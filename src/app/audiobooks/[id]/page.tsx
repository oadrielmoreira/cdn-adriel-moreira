import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { AudioDetailClient } from "./AudioDetailClient";

export const dynamic = "force-dynamic";

export default async function AudioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const audio = await prisma.audio.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { name: "asc" } },
      accessUsers: true,
    },
  });
  if (!audio) notFound();

  const isAdmin = session.role === "ADMIN";
  const canManage = isAdmin || (session.canUpload === true);

  // Membros precisam de acesso explícito — isPublic não dá acesso na plataforma
  if (!isAdmin) {
    const hasAccess =
      session.userId &&
      audio.accessUsers.some((a) => a.userId === session.userId);
    if (!hasAccess) redirect("/audiobooks");
  }

  return (
    <>
      <TopBar />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>
        <AudioDetailClient
          isAdmin={isAdmin}
          canManage={canManage}
          audio={{
            id: audio.id,
            title: audio.title,
            fileName: audio.fileName,
            isPublic: audio.isPublic,
            durationSec: audio.durationSec,
            driveId: audio.driveId ?? null,
            tags: audio.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          }}
        />
      </main>
    </>
  );
}
