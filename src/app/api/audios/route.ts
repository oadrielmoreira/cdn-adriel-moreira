import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// GET /api/audios            -> lista áudios acessíveis ao usuário logado
// GET /api/audios?tag=NOME   -> filtra por tag
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const tag = req.nextUrl.searchParams.get("tag")?.trim();

  const filters: Prisma.AudioWhereInput[] = [];

  // Admin vê tudo; membros só veem áudios com acesso explícito
  if (session.role !== "ADMIN") {
    if (session.userId) {
      filters.push({ accessUsers: { some: { userId: session.userId } } });
    } else {
      // Sessão antiga sem userId — não retorna nada
      filters.push({ id: "never" });
    }
  }

  if (tag) {
    filters.push({ tags: { some: { name: tag } } });
  }

  const where: Prisma.AudioWhereInput | undefined =
    filters.length > 0 ? { AND: filters } : undefined;

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
