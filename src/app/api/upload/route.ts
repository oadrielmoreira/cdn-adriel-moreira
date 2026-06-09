import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

const AUDIO_DIR =
  process.env.AUDIO_DIR || path.join(process.cwd(), "public", "audios");

const TMP_DIR = path.join(AUDIO_DIR, ".tmp");

const ALLOWED = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/webm",
]);

// POST /api/upload
// Recebe um chunk por vez: chunk(blob), uploadId, chunkIndex, totalChunks, filename, title
// Monta o arquivo completo ao receber o último chunk.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os dados enviados." }, { status: 400 });
  }

  const chunk = form.get("chunk") as File | null;
  const uploadId = (form.get("uploadId") as string | null)?.trim();
  const chunkIndex = parseInt(form.get("chunkIndex") as string, 10);
  const totalChunks = parseInt(form.get("totalChunks") as string, 10);
  const originalName = (form.get("filename") as string | null) ?? chunk?.name ?? "audio";
  const mimeType = (form.get("mimeType") as string | null) ?? chunk?.type ?? "";
  const title = (form.get("title") as string | null)?.trim() ?? "";

  if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || totalChunks < 1) {
    return NextResponse.json({ error: "Parâmetros de upload inválidos." }, { status: 400 });
  }

  if (!ALLOWED.has(mimeType)) {
    return NextResponse.json(
      { error: `Tipo de arquivo não suportado: ${mimeType}` },
      { status: 415 }
    );
  }

  // Salva o chunk no diretório temporário
  const chunkDir = path.join(TMP_DIR, uploadId);
  try {
    await mkdir(chunkDir, { recursive: true });
    const chunkData = Buffer.from(await chunk.arrayBuffer());
    await writeFile(path.join(chunkDir, String(chunkIndex).padStart(6, "0")), chunkData);
  } catch {
    return NextResponse.json({ error: "Erro ao salvar parte do arquivo." }, { status: 500 });
  }

  // Não é o último chunk: confirma recebimento
  if (chunkIndex + 1 < totalChunks) {
    return NextResponse.json({ done: false, received: chunkIndex });
  }

  // Último chunk: monta o arquivo final
  const ext = path.extname(originalName) || ".mp3";
  const safeBase = originalName
    .replace(ext, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
  const fileName = `${safeBase || "audio"}_${randomUUID().slice(0, 8)}${ext}`;
  const finalPath = path.join(AUDIO_DIR, fileName);

  try {
    await mkdir(AUDIO_DIR, { recursive: true });

    const writeStream = createWriteStream(finalPath);
    let totalSize = 0;

    for (let i = 0; i < totalChunks; i++) {
      const data = await readFile(path.join(chunkDir, String(i).padStart(6, "0")));
      totalSize += data.length;
      await new Promise<void>((res, rej) => {
        writeStream.write(data, (err) => (err ? rej(err) : res()));
      });
    }

    await new Promise<void>((res, rej) => {
      writeStream.end();
      writeStream.on("finish", res);
      writeStream.on("error", rej);
    });

    await rm(chunkDir, { recursive: true, force: true });

    const audio = await prisma.audio.create({
      data: {
        title: title || fileName.replace(ext, ""),
        fileName,
        mimeType,
        size: totalSize,
        isPublic: false,
      },
    });

    return NextResponse.json({ done: true, audio });
  } catch {
    await rm(chunkDir, { recursive: true, force: true }).catch(() => null);
    return NextResponse.json(
      { error: "Falha ao montar ou registrar o arquivo." },
      { status: 500 }
    );
  }
}
