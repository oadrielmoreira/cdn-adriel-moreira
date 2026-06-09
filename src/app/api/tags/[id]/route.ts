import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

// PATCH /api/tags/[id]  { name?, color? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: { name?: string; color?: string } = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.color === "string") data.color = body.color.trim();

  try {
    const tag = await prisma.tag.update({ where: { id }, data });
    return NextResponse.json({ tag });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar tag." }, { status: 500 });
  }
}

// DELETE /api/tags/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir tag." }, { status: 500 });
  }
}
