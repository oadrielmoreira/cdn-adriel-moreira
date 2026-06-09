"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components/AudioPlayer";
import {
  ChevronLeft, Copy, Check, Globe, Lock, Trash2,
  Pencil, Tag, Plus, X, Users, UserPlus, UserMinus,
} from "lucide-react";

type TagData = { id: string; name: string; color: string };
type UserData = { id: string; name: string; email: string };

type AudioData = {
  id: string;
  title: string;
  fileName: string;
  isPublic: boolean;
  durationSec: number | null;
  tags: TagData[];
};

const COLOR_PALETTE = [
  "#22C55E", "#2563EB", "#D97706", "#DC2626",
  "#DB2777", "#0891B2", "#65A30D", "#7C3AED",
];

type PickerMode = "add" | "manage" | "create";

export function AudioDetailClient({
  audio,
  isAdmin,
  canManage,
}: {
  audio: AudioData;
  isAdmin: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(audio.isPublic);
  const [title, setTitle] = useState(audio.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(audio.title);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tags
  const [tags, setTags] = useState<TagData[]>(audio.tags);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>("add");
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(COLOR_PALETTE[0]);
  const [savingTag, setSavingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Controle de acesso (admin)
  const [accessUsers, setAccessUsers] = useState<UserData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const accessPickerRef = useRef<HTMLDivElement>(null);

  const audioSrc = `/api/stream/${audio.fileName}`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${audio.id}`
      : `/share/${audio.id}`;

  // Fecha tag picker ao clicar fora
  useEffect(() => {
    if (!showTagPicker) return;
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) closePicker();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTagPicker]);

  // Fecha user picker ao clicar fora
  useEffect(() => {
    if (!showUserPicker) return;
    function handler(e: MouseEvent) {
      if (accessPickerRef.current && !accessPickerRef.current.contains(e.target as Node)) {
        setShowUserPicker(false);
        setUserSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserPicker]);

  // Carrega acesso quando admin abre a seção
  useEffect(() => {
    if (!isAdmin) return;
    fetchAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function fetchAccess() {
    setLoadingAccess(true);
    const [accessRes, usersRes] = await Promise.all([
      fetch(`/api/audios/${audio.id}/access`),
      fetch("/api/users"),
    ]);
    if (accessRes.ok) setAccessUsers((await accessRes.json()).access ?? []);
    if (usersRes.ok) setAllUsers((await usersRes.json()).users ?? []);
    setLoadingAccess(false);
  }

  async function grantAccess(userId: string) {
    await fetch(`/api/audios/${audio.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const user = allUsers.find((u) => u.id === userId);
    if (user) setAccessUsers((prev) => [...prev, user]);
    setShowUserPicker(false);
    setUserSearch("");
  }

  async function revokeAccess(userId: string) {
    await fetch(`/api/audios/${audio.id}/access`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setAccessUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  // ── Tags ──
  function closePicker() {
    setShowTagPicker(false);
    setPickerMode("add");
    setTagSearch("");
    setEditingTagId(null);
    setNewTagName("");
  }

  async function fetchTags() {
    if (allTags.length > 0) return;
    setLoadingTags(true);
    const res = await fetch("/api/tags");
    if (res.ok) setAllTags((await res.json()).tags ?? []);
    setLoadingTags(false);
  }

  async function openTagPicker() {
    if (showTagPicker) { closePicker(); return; }
    setShowTagPicker(true);
    setPickerMode("add");
    setTagSearch("");
    await fetchTags();
  }

  async function addTag(tag: TagData) {
    if (tags.some((t) => t.id === tag.id)) return;
    setTags((prev) => [...prev, tag]);
    await fetch(`/api/audios/${audio.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tag.name }),
    });
  }

  async function removeTag(tagId: string) {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    await fetch(`/api/audios/${audio.id}/tags`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
  }

  async function createAndAddTag() {
    const name = newTagName.trim();
    if (!name || newTagColor.length !== 7) return;
    setSavingTag(true);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: newTagColor }),
    });
    if (res.ok) {
      const tag: TagData = (await res.json()).tag;
      setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      await addTag(tag);
      setNewTagName("");
      setNewTagColor(COLOR_PALETTE[0]);
      setPickerMode("add");
    }
    setSavingTag(false);
  }

  async function saveTagEdit(tagId: string) {
    const name = editTagName.trim();
    if (!name || editTagColor.length !== 7) return;
    const res = await fetch(`/api/tags/${tagId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: editTagColor }),
    });
    if (res.ok) {
      const updated: TagData = (await res.json()).tag;
      setAllTags((prev) => prev.map((t) => (t.id === tagId ? updated : t)));
      setTags((prev) => prev.map((t) => (t.id === tagId ? updated : t)));
      setEditingTagId(null);
    }
  }

  async function deleteTag(tagId: string) {
    if (!confirm("Excluir esta tag de todos os áudios?")) return;
    await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
    setAllTags((prev) => prev.filter((t) => t.id !== tagId));
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    setEditingTagId(null);
  }

  async function saveTitle() {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === title) { setEditingTitle(false); return; }
    setSaving(true);
    await fetch(`/api/audios/${audio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    setTitle(trimmed);
    setEditingTitle(false);
    setSaving(false);
  }

  async function togglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    setSaving(true);
    await fetch(`/api/audios/${audio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    setSaving(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* fallback */ }
  }

  async function remove() {
    if (!confirm("Excluir este áudio? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/audios/${audio.id}`, { method: "DELETE" });
    router.push("/audiobooks");
    router.refresh();
  }

  const saveDuration = useCallback(
    (sec: number) => {
      if (audio.durationSec) return;
      fetch(`/api/audios/${audio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationSec: sec }),
      });
    },
    [audio.id, audio.durationSec]
  );

  const filteredAvailable = allTags.filter(
    (t) => !tags.some((at) => at.id === t.id) && t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );
  const filteredAll = allTags.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase()));

  // Usuários que não têm acesso ainda (para o picker)
  const usersWithoutAccess = allUsers.filter(
    (u) => !accessUsers.some((a) => a.id === u.id) && u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="fade-up">
      <Link href="/audiobooks" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 18 }}>
        <ChevronLeft size={16} /> Voltar para Audiobooks
      </Link>

      {/* Título editável */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        {canManage && editingTitle ? (
          <>
            <input autoFocus value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
              style={{ flex: 1, fontSize: 22, fontWeight: 700, background: "var(--bg-input)", border: "1px solid var(--primary)", borderRadius: 10, padding: "6px 12px", color: "var(--text)", outline: "none" }}
            />
            <button onClick={saveTitle} disabled={saving} style={btnPrimary}>Salvar</button>
            <button onClick={() => setEditingTitle(false)} style={btnOutline}>Cancelar</button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, flex: 1 }}>{title}</h1>
            {canManage && (
              <button onClick={() => { setTitleDraft(title); setEditingTitle(true); }} title="Renomear" style={iconOutlineBtn}>
                <Pencil size={15} />
              </button>
            )}
          </>
        )}
      </div>

      <AudioPlayer src={audioSrc} title={title} onDuration={saveDuration} />

      {/* ── Tags ── */}
      <div style={{ marginTop: 20, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 14.5 }}>
            <Tag size={15} style={{ color: "var(--text-muted)" }} /> Tags
          </div>

          {canManage && (
            <div style={{ position: "relative" }} ref={pickerRef}>
              <button onClick={openTagPicker} style={{ ...iconOutlineBtn, padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                <Plus size={14} /> Adicionar
              </button>

              {showTagPicker && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, padding: 8, minWidth: 240, zIndex: 30, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
                  {/* Abas */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {(["add", "manage"] as PickerMode[]).map((mode) => (
                      <button key={mode} onClick={() => { setPickerMode(mode); setTagSearch(""); setEditingTagId(null); }}
                        style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: "none", fontSize: 12.5, fontWeight: 600, background: pickerMode === mode ? "var(--primary)" : "var(--bg-elevated)", color: pickerMode === mode ? "white" : "var(--text-muted)" }}>
                        {mode === "add" ? "Adicionar" : "Gerenciar"}
                      </button>
                    ))}
                  </div>

                  {/* Modo: Adicionar */}
                  {pickerMode === "add" && (
                    <>
                      <input autoFocus placeholder="Buscar tag…" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)}
                        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 4 }}
                      />
                      {loadingTags ? (
                        <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "6px 10px" }}>Carregando…</p>
                      ) : filteredAvailable.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "6px 10px" }}>
                          {tagSearch ? "Nenhuma tag encontrada." : allTags.length === 0 ? "Nenhuma tag ainda." : "Todas as tags já adicionadas."}
                        </p>
                      ) : (
                        <div style={{ maxHeight: 180, overflowY: "auto" }}>
                          {filteredAvailable.map((tag) => (
                            <button key={tag.id} onClick={() => { addTag(tag); closePicker(); }}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", color: "var(--text)", padding: "7px 10px", borderRadius: 8, fontSize: 13.5 }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <button onClick={() => { setPickerMode("create"); setTagSearch(""); }}
                        style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: "transparent", border: "none", color: "var(--primary)", padding: "7px 10px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                        <Plus size={13} /> Nova tag…
                      </button>
                    </>
                  )}

                  {/* Modo: Criar */}
                  {pickerMode === "create" && (
                    <div style={{ padding: "2px 0" }}>
                      <input autoFocus placeholder="Nome da tag" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") createAndAddTag(); if (e.key === "Escape") setPickerMode("add"); }}
                        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                      <ColorInput value={newTagColor} onChange={setNewTagColor} />
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button onClick={createAndAddTag} disabled={savingTag || !newTagName.trim() || newTagColor.length !== 7}
                          style={{ ...btnPrimary, flex: 1, justifyContent: "center", opacity: savingTag || !newTagName.trim() ? 0.6 : 1 }}>
                          Criar
                        </button>
                        <button onClick={() => setPickerMode("add")} style={btnOutline}>Voltar</button>
                      </div>
                    </div>
                  )}

                  {/* Modo: Gerenciar */}
                  {pickerMode === "manage" && (
                    <>
                      <input autoFocus placeholder="Buscar tag…" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)}
                        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 4 }}
                      />
                      {loadingTags ? (
                        <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "6px 10px" }}>Carregando…</p>
                      ) : filteredAll.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "6px 10px" }}>
                          {tagSearch ? "Nenhuma tag encontrada." : "Nenhuma tag criada ainda."}
                        </p>
                      ) : (
                        <div style={{ maxHeight: 260, overflowY: "auto" }}>
                          {filteredAll.map((tag) =>
                            editingTagId === tag.id ? (
                              <div key={tag.id} style={{ padding: "6px 4px", borderBottom: "1px solid var(--border)" }}>
                                <input autoFocus value={editTagName} onChange={(e) => setEditTagName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") saveTagEdit(tag.id); if (e.key === "Escape") setEditingTagId(null); }}
                                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                                />
                                <ColorInput value={editTagColor} onChange={setEditTagColor} />
                                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                                  <button onClick={() => saveTagEdit(tag.id)}
                                    style={{ ...btnPrimary, flex: 1, justifyContent: "center", fontSize: 13, padding: "6px 0" }}>
                                    Salvar
                                  </button>
                                  <button onClick={() => deleteTag(tag.id)}
                                    style={{ background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}>
                                    Excluir
                                  </button>
                                  <button onClick={() => setEditingTagId(null)} style={{ ...btnOutline, fontSize: 13, padding: "6px 10px" }}>✕</button>
                                </div>
                              </div>
                            ) : (
                              <div key={tag.id}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8 }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: 13.5, color: "var(--text)" }}>{tag.name}</span>
                                <button onClick={() => { setEditingTagId(tag.id); setEditTagName(tag.name); setEditTagColor(tag.color); }}
                                  title="Editar" style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: "2px 4px", borderRadius: 6, display: "flex" }}>
                                  <Pencil size={13} />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {tags.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {canManage ? 'Sem tags. Clique em "Adicionar" para associar.' : "Sem tags."}
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((tag) => (
              <span key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: canManage ? "4px 10px 4px 8px" : "4px 10px", borderRadius: 999, background: tag.color + "22", border: `1px solid ${tag.color}55`, color: tag.color, fontSize: 13, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: tag.color }} />
                {tag.name}
                {canManage && (
                  <button onClick={() => removeTag(tag.id)} title="Remover" style={{ background: "transparent", border: "none", color: tag.color, padding: 0, display: "flex", cursor: "pointer" }}>
                    <X size={13} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Compartilhamento ── */}
      {canManage && (
        <div style={{ marginTop: 16, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isPublic ? <Globe size={18} style={{ color: "var(--success)" }} /> : <Lock size={18} style={{ color: "var(--text-muted)" }} />}
              <div>
                <p style={{ fontWeight: 600, fontSize: 14.5 }}>
                  {isPublic ? "Link público ativado" : "Link público desativado"}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: 12.5 }}>
                  {isPublic
                    ? "O link de compartilhamento funciona sem login"
                    : "Somente usuários com acesso podem ouvir"}
                </p>
              </div>
            </div>
            <button onClick={togglePublic} disabled={saving} aria-label="Alternar público/privado"
              style={{ width: 50, height: 28, borderRadius: 999, border: "none", background: isPublic ? "var(--success)" : "var(--border)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 3, left: isPublic ? 25 : 3, width: 22, height: 22, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
            </button>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, opacity: isPublic ? 1 : 0.55 }}>
            <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()}
              style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 13.5, outline: "none" }}
            />
            <button onClick={copyLink} style={{ background: copied ? "var(--success)" : "var(--primary)", color: "white", border: "none", borderRadius: 10, padding: "0 16px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 7, transition: "background 0.2s" }}>
              {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}
            </button>
          </div>
          {!isPublic && (
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
              Ative o link público para que qualquer pessoa possa acessar sem login.
              O acesso na plataforma é controlado separadamente pelo painel abaixo.
            </p>
          )}
        </div>
      )}

      {/* ── Controle de Acesso (admin only) ── */}
      {isAdmin && (
        <div style={{ marginTop: 16, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 14.5 }}>
              <Users size={15} style={{ color: "var(--text-muted)" }} /> Controle de Acesso
            </div>
            <div style={{ position: "relative" }} ref={accessPickerRef}>
              <button
                onClick={() => { setShowUserPicker((v) => !v); setUserSearch(""); }}
                style={{ ...iconOutlineBtn, padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}
              >
                <UserPlus size={14} /> Adicionar
              </button>

              {showUserPicker && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, padding: 8, minWidth: 240, zIndex: 30, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
                  <input autoFocus placeholder="Buscar usuário…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 4 }}
                  />
                  {usersWithoutAccess.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "6px 10px" }}>
                      {userSearch ? "Nenhum usuário encontrado." : "Todos os usuários já têm acesso."}
                    </p>
                  ) : (
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                      {usersWithoutAccess.map((u) => (
                        <button key={u.id} onClick={() => grantAccess(u.id)}
                          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, width: "100%", background: "transparent", border: "none", color: "var(--text)", padding: "8px 10px", borderRadius: 8, textAlign: "left" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name}</span>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p style={{ color: "var(--text-muted)", fontSize: 12.5, marginBottom: 12 }}>
            {isPublic
              ? "Áudio público — todos os usuários têm acesso. Torne-o privado para restringir."
              : "Quando privado, apenas admin e os usuários abaixo têm acesso."}
          </p>

          {loadingAccess ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Carregando…</p>
          ) : accessUsers.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Nenhum usuário com acesso explícito.
              {!isPublic && " Adicione usuários acima para liberar o acesso."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {accessUsers.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-input)", borderRadius: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</p>
                  </div>
                  <button onClick={() => revokeAccess(u.id)} title="Revogar acesso"
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", display: "flex", padding: 4, borderRadius: 6, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <UserMinus size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Excluir */}
      {canManage && (
        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={remove} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--danger)", borderRadius: 10, padding: "9px 14px", fontSize: 13.5, display: "flex", alignItems: "center", gap: 7 }}>
            <Trash2 size={15} /> Excluir áudio
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-componente: hex + roda de cor + paleta ───────────────────────────────
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <input type="color" value={value.length === 7 ? value : "#22C55E"} onChange={(e) => onChange(e.target.value)}
          style={{ width: 34, height: 34, padding: 2, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", cursor: "pointer", flexShrink: 0 }}
        />
        <input type="text" value={value} maxLength={7} placeholder="#22C55E"
          onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
          style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 13, outline: "none", fontFamily: "monospace" }}
        />
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
        {COLOR_PALETTE.map((c) => (
          <button key={c} onClick={() => onChange(c)} title={c}
            style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: value === c ? "2px solid white" : "2px solid transparent", outline: value === c ? `2px solid ${c}` : "none", cursor: "pointer" }}
          />
        ))}
      </div>
    </>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "var(--primary)", color: "white", border: "none",
  borderRadius: 10, padding: "8px 16px", fontWeight: 600, fontSize: 14,
  display: "flex", alignItems: "center", gap: 6,
};
const btnOutline: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border)",
  color: "var(--text-muted)", borderRadius: 10, padding: "8px 14px", fontSize: 14,
};
const iconOutlineBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border)",
  color: "var(--text-muted)", borderRadius: 10, padding: "7px 10px",
  display: "flex", alignItems: "center", cursor: "pointer",
};
