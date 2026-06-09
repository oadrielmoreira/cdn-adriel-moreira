"use client";

import { useState, useEffect } from "react";
import {
  UserPlus, Pencil, Trash2, Check, X, ShieldCheck,
  User, LoaderCircle, KeyRound, Eye, EyeOff,
} from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isActive: boolean;
  createdAt: string;
};

type CreateForm = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MEMBER";
};

type EditForm = {
  name: string;
  role: "ADMIN" | "MEMBER";
  isActive: boolean;
  password: string;
};

export function AdminClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "", email: "", password: "", role: "MEMBER",
  });
  const [showCreatePw, setShowCreatePw] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", role: "MEMBER", isActive: true, password: "",
  });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers((await res.json()).users ?? []);
    setLoading(false);
  }

  async function createUser() {
    setCreateError("");
    if (!createForm.name || !createForm.email || createForm.password.length < 6) {
      setCreateError("Nome, email e senha (mín. 6 caracteres) são obrigatórios.");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setUsers((prev) => [...prev, data.user]);
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", role: "MEMBER" });
    } else {
      setCreateError(data.error || "Erro ao criar usuário.");
    }
    setCreating(false);
  }

  function startEdit(u: UserRow) {
    setEditingId(u.id);
    setEditForm({ name: u.name, role: u.role, isActive: u.isActive, password: "" });
    setEditError("");
    setShowEditPw(false);
  }

  async function saveEdit(id: string) {
    setEditError("");
    if (!editForm.name.trim()) { setEditError("Nome é obrigatório."); return; }
    if (editForm.password && editForm.password.length < 6) {
      setEditError("Nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = {
      name: editForm.name.trim(),
      role: editForm.role,
      isActive: editForm.isActive,
    };
    if (editForm.password) body.password = editForm.password;

    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
      setEditingId(null);
    } else {
      setEditError(data.error || "Erro ao salvar.");
    }
    setSaving(false);
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Excluir o usuário "${name}"? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erro ao excluir usuário.");
    }
  }

  return (
    <div className="fade-up">
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Usuários</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Gerencie quem tem acesso à plataforma.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(""); }}
          style={{ ...btnPrimary, gap: 8 }}
        >
          <UserPlus size={16} /> Novo usuário
        </button>
      </div>

      {/* Formulário de criação */}
      {showCreate && (
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--primary)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Criar novo usuário</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome completo" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Senha (mín. 6 caracteres)</label>
              <div style={{ position: "relative" }}>
                <input type={showCreatePw ? "text" : "password"} value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Senha inicial" style={{ ...inputStyle, paddingRight: 40 }} />
                <button onClick={() => setShowCreatePw((v) => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
                  {showCreatePw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Função</label>
              <select value={createForm.role} onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as "ADMIN" | "MEMBER" }))}
                style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="MEMBER">Membro</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          {createError && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{createError}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={createUser} disabled={creating} style={{ ...btnPrimary, opacity: creating ? 0.7 : 1 }}>
              {creating ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
              {creating ? "Criando…" : "Criar usuário"}
            </button>
            <button onClick={() => { setShowCreate(false); setCreateError(""); }} style={btnOutline}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de usuários */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <LoaderCircle size={28} className="spin" style={{ color: "var(--primary)" }} />
        </div>
      ) : users.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>Nenhum usuário encontrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map((u) =>
            editingId === u.id ? (
              // ── Modo edição ──
              <div key={u.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--primary)", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Nome</label>
                    <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input value={u.email} disabled style={{ ...inputStyle, opacity: 0.5 }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nova senha (deixe vazio para não alterar)</label>
                    <div style={{ position: "relative" }}>
                      <input type={showEditPw ? "text" : "password"} value={editForm.password}
                        onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Nova senha…" style={{ ...inputStyle, paddingRight: 40 }} />
                      <button onClick={() => setShowEditPw((v) => !v)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
                        {showEditPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Função</label>
                      <select value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as "ADMIN" | "MEMBER" }))}
                        style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="MEMBER">Membro</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select value={editForm.isActive ? "active" : "inactive"}
                        onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.value === "active" }))}
                        style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>
                {editError && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{editError}</p>}
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button onClick={() => saveEdit(u.id)} disabled={saving}
                    style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                    {saving ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}
                    Salvar
                  </button>
                  <button onClick={() => setEditingId(null)} style={btnOutline}>
                    <X size={15} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // ── Modo visualização ──
              <div key={u.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "14px 18px",
                opacity: u.isActive ? 1 : 0.55,
              }}>
                {/* Avatar / ícone */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: u.role === "ADMIN" ? "var(--primary-soft)" : "var(--bg-input)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: u.role === "ADMIN" ? "var(--primary)" : "var(--text-muted)",
                  flexShrink: 0,
                }}>
                  {u.role === "ADMIN" ? <ShieldCheck size={20} /> : <User size={20} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                      background: u.role === "ADMIN" ? "var(--primary-soft)" : "var(--bg-input)",
                      color: u.role === "ADMIN" ? "var(--primary)" : "var(--text-muted)",
                    }}>
                      {u.role === "ADMIN" ? "Admin" : "Membro"}
                    </span>
                    {!u.isActive && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "var(--danger)22", color: "var(--danger)" }}>
                        Inativo
                      </span>
                    )}
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>{u.email}</p>
                </div>

                {/* Ações */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => startEdit(u)} title="Editar" style={iconBtn}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => deleteUser(u.id, u.name)} title="Excluir"
                    style={{ ...iconBtn, color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-muted)", marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-input)",
  border: "1px solid var(--border)", borderRadius: 10,
  padding: "10px 12px", color: "var(--text)", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  background: "var(--primary)", color: "white", border: "none",
  borderRadius: 10, padding: "9px 16px", fontWeight: 600, fontSize: 14,
  display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
};
const btnOutline: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border)",
  color: "var(--text-muted)", borderRadius: 10, padding: "9px 14px",
  fontSize: 14, display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
};
const iconBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border)",
  color: "var(--text-muted)", borderRadius: 8, padding: "7px",
  display: "flex", alignItems: "center", cursor: "pointer",
  transition: "color 0.15s, border-color 0.15s",
};
