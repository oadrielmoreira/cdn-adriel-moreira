import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/audios/[id]/tags  { tagId }  → adiciona tag ao áudio
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const tagId = typeof body.tagId === "string" ? body.tagId : null;
  if (!tagId) return NextResponse.json({ error: "tagId obrigatório." }, { status: 400 });

  try {
    await prisma.audio.update({
      where: { id },
      data: { tags: { connect: { id: tagId } } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao adicionar tag." }, { status: 500 });
  }
}

// DELETE /api/audios/[id]/tags?tagId=xxx  → remove tag do áudio
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const tagId = req.nextUrl.searchParams.get("tagId");
  if (!tagId) return NextResponse.json({ error: "tagId obrigatório." }, { status: 400 });

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
