import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/drive/stream/[driveId]
// Proxy para streamar áudio do Google Drive, necessário para Web Audio API (CORS)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  const { driveId } = await params;
  const rangeHeader = req.headers.get("range");

  const url = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0&confirm=t`;

  const upstreamHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  if (rangeHeader) upstreamHeaders["range"] = rangeHeader;

  let res: Response;
  try {
    res = await fetch(url, { headers: upstreamHeaders, redirect: "follow" });
  } catch {
    return new NextResponse("Erro ao conectar com Google Drive", { status: 502 });
  }

  if (!res.ok && res.status !== 206) {
    return new NextResponse("Arquivo não encontrado no Google Drive", {
      status: res.status,
    });
  }

  const contentType =
    res.headers.get("content-type") || "audio/mpeg";
  const outHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
    "Access-Control-Allow-Origin": "*",
  };

  const contentLength = res.headers.get("content-length");
  if (contentLength) outHeaders["Content-Length"] = contentLength;

  const contentRange = res.headers.get("content-range");
  if (contentRange) outHeaders["Content-Range"] = contentRange;

  return new NextResponse(res.body, {
    status: rangeHeader ? 206 : 200,
    headers: outHeaders,
  });
}
