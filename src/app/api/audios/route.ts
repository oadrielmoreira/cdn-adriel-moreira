import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// POST /api/audios  { title, driveId }  — cria entrada a partir do Google Drive
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const canManage = session.role === "ADMIN" || session.canUpload === true;
  if (!canManage) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const driveId =
    typeof body.driveId === "string" ? body.driveId.trim() : "";

  if (!title || !driveId) {
    return NextResponse.json(
      { error: "Título e link do Drive são obrigatórios." },
      { status: 400 }
    );
  }

  try {
    const audio = await prisma.audio.create({
      data: {
        title,
        driveId,
        fileName: `drive:${driveId}`,
        mimeType: "audio/drive",
        size: 0,
      },
      include: { tags: true },
    });
    return NextResponse.json({ audio }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar entrada de áudio." },
      { status: 500 }
    );
  }
}

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
