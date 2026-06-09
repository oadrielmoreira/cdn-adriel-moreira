import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

// PATCH /api/users/[id]  { name?, role?, isActive?, canUpload?, password? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (body.role === "ADMIN" || body.role === "MEMBER") {
    data.role = body.role;
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }
  if (typeof body.canUpload === "boolean") {
    data.canUpload = body.canUpload;
  }
  if (typeof body.password === "string" && body.password.length >= 6) {
    data.passwordHash = await hashPassword(body.password);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true,
        role: true, isActive: true, canUpload: true,
      },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar usuário." },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const session = await getSession();
  const { id } = await params;

  if (session?.userId === id) {
    return NextResponse.json(
      { error: "Você não pode excluir sua própria conta." },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir usuário." },
      { status: 500 }
    );
  }
}
