"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components/AudioPlayer";
import {
  ChevronLeft, Copy, Check, Globe, Lock, Trash2,
  Pencil, Tag, Plus, X, Settings2,
} from "lucide-react";

type TagData = { id: string; name: string; color: string };

type AudioData = {
  id: string;
  title: string;
  fileName: string;
  isPublic: boolean;
  durationSec: number | null;
  tags: TagData[];
};

const COLOR_PALETTE = [
  "#7C3AED", "#2563EB", "#059669", "#D97706",
  "#DC2626", "#DB2777", "#0891B2", "#65A30D",
];

// ── picker modes ────────────────────────────────────────────────────────────
type PickerMode = "add" | "manage" | "create";

export function AudioDetailClient({ audio }: { audio: AudioData }) {
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

  // create
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(COLOR_PALETTE[0]);
  const [savingTag, setSavingTag] = useState(false);

  // edit (manage mode)
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");

  const pickerRef = useRef<HTMLDivElement>(null);

  const audioSrc = `/api/stream/${audio.fileName}`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${audio.id}`
      : `/share/${audio.id}`;

  useEffect(() => {
    if (!showTagPicker) return;
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        closePicker();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTagPicker]);

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
      body: JSON.stringify({ tagId: tag.id }),
    });
  }

  async function removeTag(tagId: string) {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    await fetch(`/api/audios/${audio.id}/tags?tagId=${tagId}`, { method: "DELETE" });
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
      setAllTags((prev) => prev.map((t) => t.id === tagId ? updated : t));
      setTags((prev) => prev.map((t) => t.id === tagId ? updated : t));
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
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* fallback */ }
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

  return (
    <div className="fade-up">
      <Link href="/audiobooks" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 18 }}>
        <ChevronLeft size={16} /> Voltar para Audiobooks
      </Link>

      {/* Título editável */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        {editingTitle ? (
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
            <button onClick={() => { setTitleDraft(title); setEditingTitle(true); }} title="Renomear" style={iconOutlineBtn}>
              <Pencil size={15} />
            </button>
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

          <div style={{ position: "relative" }} ref={pickerRef}>
            <button onClick={openTagPicker} style={{ ...iconOutlineBtn, padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
              <Plus size={14} /> Adicionar
            </button>

            {showTagPicker && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 12, padding: 8, minWidth: 240, zIndex: 30,
                boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              }}>

                {/* ── Abas ── */}
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {(["add", "manage"] as PickerMode[]).map((mode) => (
                    <button key={mode} onClick={() => { setPickerMode(mode); setTagSearch(""); setEditingTagId(null); }}
                      style={{
                        flex: 1, padding: "5px 0", borderRadius: 8, border: "none", fontSize: 12.5, fontWeight: 600,
                        background: pickerMode === mode ? "var(--primary)" : "var(--bg-elevated)",
                        color: pickerMode === mode ? "white" : "var(--text-muted)",
                      }}>
                      {mode === "add" ? "Adicionar" : "Gerenciar"}
                    </button>
                  ))}
                </div>

                {/* ── Modo: Adicionar ── */}
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
                      style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: "transparent", border: "none", color: "var(--primary)", padding: "7px 10px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, borderTop: "1px solid var(--border)", marginTop: 4 }}
                    >
                      <Plus size={13} /> Nova tag…
                    </button>
                  </>
                )}

                {/* ── Modo: Criar ── */}
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

                {/* ── Modo: Gerenciar ── */}
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
        </div>

        {/* Pills das tags deste áudio */}
        {tags.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sem tags. Clique em "Adicionar" para associar.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((tag) => (
              <span key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 8px", borderRadius: 999, background: tag.color + "22", border: `1px solid ${tag.color}55`, color: tag.color, fontSize: 13, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: tag.color }} />
                {tag.name}
                <button onClick={() => removeTag(tag.id)} title="Remover" style={{ background: "transparent", border: "none", color: tag.color, padding: 0, display: "flex", cursor: "pointer" }}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Compartilhamento ── */}
      <div style={{ marginTop: 16, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isPublic ? <Globe size={18} style={{ color: "var(--success)" }} /> : <Lock size={18} style={{ color: "var(--text-muted)" }} />}
            <div>
              <p style={{ fontWeight: 600, fontSize: 14.5 }}>{isPublic ? "Público" : "Privado"}</p>
              <p style={{ color: "var(--text-muted)", fontSize: 12.5 }}>
                {isPublic ? "Qualquer pessoa com o link pode ouvir" : "Apenas pessoas autenticadas têm acesso"}
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
        {!isPublic && <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>Torne o áudio público para que o link funcione para qualquer pessoa.</p>}
      </div>

      {/* Excluir */}
      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={remove} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--danger)", borderRadius: 10, padding: "9px 14px", fontSize: 13.5, display: "flex", alignItems: "center", gap: 7 }}>
          <Trash2 size={15} /> Excluir áudio
        </button>
      </div>
    </div>
  );
}

// ── Sub-componente: hex + roda de cor + paleta ───────────────────────────────
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <input type="color" value={value.length === 7 ? value : "#7C3AED"} onChange={(e) => onChange(e.target.value)}
          style={{ width: 34, height: 34, padding: 2, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", cursor: "pointer", flexShrink: 0 }}
        />
        <input type="text" value={value} maxLength={7} placeholder="#7C3AED"
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
  display: "flex", alignItems: "center",
};
