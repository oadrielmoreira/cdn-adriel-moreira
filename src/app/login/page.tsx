"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Lock, LoaderCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/home");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Senha incorreta");
        setLoading(false);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "radial-gradient(1200px 600px at 50% -10%, var(--primary-soft), transparent 60%), var(--bg)",
      }}
    >
      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "36px 30px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Logo size={32} />
        </div>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Acesso à Central
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 26,
          }}
        >
          Digite a senha para continuar
        </p>

        <div style={{ position: "relative" }}>
          <Lock
            size={18}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="password"
            value={password}
            autoFocus
            placeholder="Senha"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%",
              background: "var(--bg-input)",
              border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "13px 14px 13px 42px",
              color: "var(--text)",
              fontSize: 15,
              outline: "none",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 18,
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "13px",
            fontSize: 15,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.7 : 1,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--primary-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--primary)")
          }
        >
          {loading ? (
            <LoaderCircle size={18} className="spin" />
          ) : (
            "Entrar"
          )}
        </button>
      </div>

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
