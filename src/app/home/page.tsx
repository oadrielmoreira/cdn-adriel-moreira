"use client";

import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Headphones, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <div className="fade-up">
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>
            Central de Mídia
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 16 }}>
            Selecione uma categoria para começar.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
            marginTop: 34,
          }}
        >
          {/* Card Audiobooks */}
          <Link href="/audiobooks">
            <div
              className="fade-up"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 18,
                padding: 24,
                minHeight: 170,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.18s, border-color 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--primary-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <Headphones size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700 }}>Audiobooks</h2>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 14,
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Acessar biblioteca <ArrowRight size={14} />
                </p>
              </div>
            </div>
          </Link>

          {/* Espaço reservado para futuras categorias */}
          <div
            style={{
              background: "transparent",
              border: "1px dashed var(--border)",
              borderRadius: 18,
              padding: 24,
              minHeight: 170,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            Mais categorias em breve
          </div>
        </div>
      </main>
    </>
  );
}
