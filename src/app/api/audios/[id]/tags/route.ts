import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/audios/[id]/tags  { name }  -> adiciona uma tag ao áudio
// Tags livres: se a tag não existir, ela é criada automaticamente.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Nome da tag é obrigatório." },
      { status: 400 }
    );
  }

  try {
    // cria a tag se não existir (upsert pelo nome único), e conecta ao áudio
    await prisma.audio.update({
      where: { id },
      data: {
        tags: {
          connectOrCreate: {
            where: { name },
            create: { name },
          },
        },
      },
    });
    const audio = await prisma.audio.findUnique({
      where: { id },
      include: { tags: true },
    });
    return NextResponse.json({ audio });
  } catch {
    return NextResponse.json(
      { error: "Erro ao adicionar tag." },
      { status: 500 }
    );
  }
}

// DELETE /api/audios/[id]/tags  { tagId }  -> remove a tag do áudio
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const tagId = typeof body.tagId === "string" ? body.tagId : "";

  if (!tagId) {
    return NextResponse.json({ error: "tagId é obrigatório." }, { status: 400 });
  }

  try {
    await prisma.audio.update({
      where: { id },
      data: { tags: { disconnect: { id: tagId } } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao remover tag." }, { status: 500 });
  }
}
