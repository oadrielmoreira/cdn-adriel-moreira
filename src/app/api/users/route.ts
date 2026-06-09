import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

const USER_SELECT = {
  id: true, name: true, email: true,
  role: true, isActive: true, canUpload: true, createdAt: true,
} as const;

// GET /api/users
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

// POST /api/users  { name, email, password, role?, canUpload? }
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role: "ADMIN" | "MEMBER" = body.role === "ADMIN" ? "ADMIN" : "MEMBER";
  const canUpload: boolean = body.canUpload === true;

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Nome, usuário e senha (mín. 6 caracteres) são obrigatórios." },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, canUpload },
      select: USER_SELECT,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Usuário já cadastrado." },
      { status: 409 }
    );
  }
}
