import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/drive/info  { iframeCode: string }
// Extrai o Drive ID do iframe e busca o nome do arquivo
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const iframeCode: string =
    typeof body.iframeCode === "string" ? body.iframeCode.trim() : "";

  const match = iframeCode.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
  );
  if (!match) {
    return NextResponse.json(
      { error: "Código inválido. Verifique o código de incorporação e tente novamente." },
      { status: 400 }
    );
  }

  const driveId = match[1];
  let title = "";

  try {
    const res = await fetch(
      `https://drive.google.com/file/d/${driveId}/view`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; bot)",
          "Accept-Language": "pt-BR,pt;q=0.9",
        },
        redirect: "follow",
      }
    );
    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1]
          .replace(/ - Google (Drive|Docs|Sheets|Slides)$/, "")
          .trim();
      }
    }
  } catch {
    // título vazio — usuário preenche manualmente
  }

  // Não retornamos o ID do arquivo para o cliente
  return NextResponse.json({ title });
}
