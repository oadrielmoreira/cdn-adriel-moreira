import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/tags
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { audios: true } } },
    });
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar tags." }, { status: 500 });
  }
}

// POST /api/tags  { name, color }
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color.trim() : "#7C3AED";

  if (!name) {
    return NextResponse.json({ error: "Nome da tag é obrigatório." }, { status: 400 });
  }
  try {
    const tag = await prisma.tag.create({ data: { name, color } });
    return NextResponse.json({ tag }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Tag já existe ou erro ao criar." }, { status: 409 });
  }
}
