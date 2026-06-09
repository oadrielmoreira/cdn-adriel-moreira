import { NextRequest, NextResponse } from "next/server";
import { createSession, destroySession, getExpectedPassword } from "@/lib/auth";

// POST /api/auth  -> login com senha única
export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const expected = getExpectedPassword();
  if (!body.password || body.password !== expected) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ ok: true });
}

// DELETE /api/auth -> logout
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
