import { prisma } from "@/lib/prisma";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Logo } from "@/components/Logo";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audio = await prisma.audio.findUnique({ where: { id } });

  const available = audio && audio.isPublic;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 500px at 50% -10%, var(--primary-soft), transparent 60%), var(--bg)",
      }}
    >
      <header
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Logo size={26} />
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        {available ? (
          <div className="fade-up">
            <AudioPlayer src={`/api/stream/${audio!.fileName}`} title={audio!.title} />
            <p
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: 18,
              }}
            >
              Compartilhado via CDN Adriel
            </p>
          </div>
        ) : (
          <div
            className="fade-up"
            style={{
              textAlign: "center",
              padding: 48,
              border: "1px solid var(--border)",
              borderRadius: 18,
              background: "var(--bg-elevated)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "var(--bg-input)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--text-muted)",
              }}
            >
              <Lock size={26} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Conteúdo indisponível</h1>
            <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14.5 }}>
              Este áudio é privado ou não existe mais.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
