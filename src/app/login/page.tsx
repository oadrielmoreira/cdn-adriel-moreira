"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Lock, UserCircle2, LoaderCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username.trim(), password }),
      });
      if (res.ok) {
        router.push("/home");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Credenciais inválidas.");
        setLoading(false);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  const inputBase = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    background: "var(--bg-input)",
    border: `1px solid ${hasError ? "var(--danger)" : "var(--border)"}`,
    borderRadius: 12,
    padding: "13px 14px 13px 42px",
    color: "var(--text)",
    fontSize: 15,
    outline: "none",
  });

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

        <h1 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>
          Acesso à Central
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", marginBottom: 26 }}>
          Entre com seu usuário e senha
        </p>

        {/* Usuário */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <UserCircle2
            size={18}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={username}
            autoFocus
            placeholder="Usuário"
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={inputBase(!!error)}
          />
        </div>

        {/* Senha */}
        <div style={{ position: "relative" }}>
          <Lock
            size={18}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="Senha"
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{ ...inputBase(!!error), paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            style={{
              position: "absolute",
              right: 13,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              padding: 2,
            }}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !username || !password}
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
            opacity: loading || !username || !password ? 0.6 : 1,
            transition: "background 0.15s",
            cursor: loading || !username || !password ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = "var(--primary-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--primary)";
          }}
        >
          {loading ? <LoaderCircle size={18} className="spin" /> : "Entrar"}
        </button>
      </div>

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
