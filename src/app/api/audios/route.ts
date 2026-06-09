import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/audios            -> lista áudios acessíveis ao usuário logado
// GET /api/audios?tag=NOME   -> filtra por tag
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const tag = req.nextUrl.searchParams.get("tag")?.trim();
  const tagFilter = tag ? { tags: { some: { name: tag } } } : undefined;

  // Admin vê tudo; membros só veem áudios com acesso explícito
  const accessFilter =
    session.role === "ADMIN"
      ? undefined
      : session.userId
      ? { accessUsers: { some: { userId: session.userId } } }
      : { id: "never" }; // sessão antiga sem userId — retorna vazio

  const where =
    accessFilter || tagFilter
      ? { AND: [accessFilter, tagFilter].filter(Boolean) }
      : undefined;

  try {
    const audios = await prisma.audio.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { tags: true },
    });
    return NextResponse.json({ audios });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar áudios. Verifique a conexão com o banco." },
      { status: 503 }
    );
  }
}
