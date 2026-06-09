import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/audios/[id]/access  -> lista usuários com acesso explícito
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const entries = await prisma.audioAccess.findMany({
    where: { audioId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ access: entries.map((e) => e.user) });
}

// POST /api/audios/[id]/access  { userId }  -> concede acesso
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";

  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });
  }

  try {
    await prisma.audioAccess.create({ data: { audioId: id, userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Usuário já tem acesso ou erro interno." },
      { status: 409 }
    );
  }
}

// DELETE /api/audios/[id]/access  { userId }  -> revoga acesso
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";

  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });
  }

  try {
    await prisma.audioAccess.delete({
      where: { audioId_userId: { audioId: id, userId } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Acesso não encontrado." },
      { status: 404 }
    );
  }
}
