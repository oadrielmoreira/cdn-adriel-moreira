import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import path from "path";

export const runtime = "nodejs";

const AUDIO_DIR =
  process.env.AUDIO_DIR || path.join(process.cwd(), "public", "audios");

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".mp4": "audio/mp4",
  ".webm": "audio/webm",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safeName = path.basename(filename); // impede path traversal
  const filePath = path.join(AUDIO_DIR, safeName);

  let fileSize: number;
  try {
    fileSize = (await stat(filePath)).size;
  } catch {
    return new NextResponse("Arquivo não encontrado.", { status: 404 });
  }

  const mime = MIME[path.extname(safeName).toLowerCase()] ?? "audio/mpeg";
  const range = req.headers.get("range");

  if (range) {
    const [rawStart, rawEnd] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(rawStart, 10);
    const end = rawEnd ? parseInt(rawEnd, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const nodeStream = createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": mime,
      },
    });
  }

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": mime,
      "Accept-Ranges": "bytes",
    },
  });
}
