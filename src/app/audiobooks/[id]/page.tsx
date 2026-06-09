import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { AudioDetailClient } from "./AudioDetailClient";

export const dynamic = "force-dynamic";

export default async function AudioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audio = await prisma.audio.findUnique({
    where: { id },
    include: { tags: { orderBy: { name: "asc" } } },
  });
  if (!audio) notFound();

  return (
    <>
      <TopBar />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>
        <AudioDetailClient
          audio={{
            id: audio.id,
            title: audio.title,
            fileName: audio.fileName,
            isPublic: audio.isPublic,
            durationSec: audio.durationSec,
            tags: audio.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          }}
        />
      </main>
    </>
  );
}
