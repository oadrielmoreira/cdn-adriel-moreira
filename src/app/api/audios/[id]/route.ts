import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

const AUDIO_DIR =
  process.env.AUDIO_DIR || path.join(process.cwd(), "public", "audios");

// PATCH /api/audios/[id]  -> alterna público/privado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: { isPublic?: boolean; title?: string; durationSec?: number } = {};
  if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.durationSec === "number")
    data.durationSec = Math.round(body.durationSec);

  const audio = await prisma.audio.update({ where: { id }, data });
  return NextResponse.json({ audio });
}

// DELETE /api/audios/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const audio = await prisma.audio.findUnique({ where: { id } });
  if (audio) {
    try {
      await unlink(path.join(AUDIO_DIR, audio.fileName));
    } catch {
      // arquivo já pode não existir; segue para remover do banco
    }
    await prisma.audio.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
