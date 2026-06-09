"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { KeyRound, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";

export default function SettingsPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");
    setSuccess(false);
    if (!current || !next || !confirm) {
      setError("Preencha todos os campos.");
      return;
    }
    if (next.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (next !== confirm) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setError(data.error || "Erro ao alterar senha.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <>
      <TopBar />
      <main
        className="fade-up"
        style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Configurações</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 32 }}>
          Gerencie as configurações da sua conta.
        </p>

        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <KeyRound size={18} style={{ color: "var(--primary)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Alterar senha</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Senha atual */}
            <div>
              <label style={labelStyle}>Senha atual</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Sua senha atual"
                  style={{ ...inputStyle, paddingRight: 42 }}
                />
                <button
                  onClick={() => setShowCurrent((v) => !v)}
                  style={eyeBtn}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Nova senha */}
            <div>
              <label style={labelStyle}>Nova senha</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNext ? "text" : "password"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{ ...inputStyle, paddingRight: 42 }}
                />
                <button
                  onClick={() => setShowNext((v) => !v)}
                  style={eyeBtn}
                >
                  {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmar nova senha */}
            <div>
              <label style={labelStyle}>Confirmar nova senha</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Repita a nova senha"
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 14 }}>
              {error}
            </p>
          )}
          {success && (
            <p
              style={{
                color: "var(--success)",
                fontSize: 13,
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={15} /> Senha alterada com sucesso!
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 20,
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "11px 20px",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--primary)";
            }}
          >
            {loading ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <KeyRound size={16} />
            )}
            {loading ? "Salvando…" : "Alterar senha"}
          </button>
        </div>
      </main>

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
const eyeBtn: React.CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  display: "flex",
  padding: 2,
};
