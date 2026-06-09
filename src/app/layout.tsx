import type { Metadata } from "next";
import { theme } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "CDN — Fitz Digital",
  description: "Central de mídia da Fitz Digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Injeta os tokens do tema (src/lib/theme.ts) como variáveis CSS globais.
  // Trocar as cores em theme.ts reflete em todo o site.
  const cssVars = `:root{
    --bg:${theme.bg};
    --bg-elevated:${theme.bgElevated};
    --bg-input:${theme.bgInput};
    --border:${theme.border};
    --text:${theme.text};
    --text-muted:${theme.textMuted};
    --primary:${theme.primary};
    --primary-hover:${theme.primaryHover};
    --primary-soft:${theme.primarySoft};
    --accent:${theme.accent};
    --success:${theme.success};
    --danger:${theme.danger};
    --font-family:${theme.fontFamily};
  }`;

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
