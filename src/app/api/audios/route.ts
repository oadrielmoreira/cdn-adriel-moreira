import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/audios            -> lista todos (requer login)
// GET /api/audios?tag=NOME   -> filtra por nome de tag
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tag = req.nextUrl.searchParams.get("tag")?.trim();

  const audios = await prisma.audio.findMany({
    where: tag
      ? { tags: { some: { name: tag } } }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { tags: true },
  });
  return NextResponse.json({ audios });
}
