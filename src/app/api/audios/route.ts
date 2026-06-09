import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/audios  -> lista todos (requer login)
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const audios = await prisma.audio.findMany({
      orderBy: { createdAt: "desc" },
      include: { tags: { orderBy: { name: "asc" } } },
    });
    return NextResponse.json({ audios });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível conectar ao banco de dados. Tente novamente em instantes." },
      { status: 503 }
    );
  }
}
