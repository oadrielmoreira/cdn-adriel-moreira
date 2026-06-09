"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import {
  Plus, Music, Lock, Globe, Tag, ChevronDown, X,
  Search, HardDriveUpload, LoaderCircle,
} from "lucide-react";

type AudioTag = { id: string; name: string; color: string };

type Audio = {
  id: string;
  title: string;
  fileName: string;
  size: number;
  durationSec: number | null;
  isPublic: boolean;
  driveId: string | null;
  createdAt: string;
  tags: AudioTag[];
};

function humanSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AudiobooksList({ canManage }: { canManage: boolean }) {
  const [audios, setAudios] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [tagFilterSearch, setTagFilterSearch] = useState("");
  const tagFilterRef = useRef<HTMLDivElement>(null);

  // Modal Drive
  const [showModal, setShowModal] = useState(false);
  const [iframeCode, setIframeCode] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [driveInfo, setDriveInfo] = useState<{ driveId: string; title: string } | null>(null);
  const [driveTitle, setDriveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!showTagFilter) return;
    function handler(e: MouseEvent) {
      if (tagFilterRef.current && !tagFilterRef.current.contains(e.target as Node)) {
        setShowTagFilter(false);
        setTagFilterSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTagFilter]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/audios");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAudios(data.audios ?? []);
      } else {
        setError(data.error || "Não foi possível carregar os áudios.");
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openModal() {
    setShowModal(true);
    setIframeCode("");
    setFetchError("");
    setDriveInfo(null);
    setDriveTitle("");
    setSaveError("");
  }

  function closeModal() {
    setShowModal(false);
    setIframeCode("");
    setFetchError("");
    setDriveInfo(null);
    setDriveTitle("");
    setSaveError("");
  }

  async function fetchDriveInfo() {
    if (!iframeCode.trim()) return;
    setFetching(true);
    setFetchError("");
    setDriveInfo(null);
    try {
      const res = await fetch("/api/drive/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iframeCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(data.error || "Erro ao buscar informações do arquivo.");
      } else {
        setDriveInfo(data);
        setDriveTitle(data.title || "");
      }
    } catch {
      setFetchError("Erro de conexão.");
    } finally {
      setFetching(false);
    }
  }

  async function saveDriveAudio() {
    if (!driveInfo || !driveTitle.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/audios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: driveTitle.trim(), driveId: driveInfo.driveId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Erro ao salvar áudio.");
      } else {
        closeModal();
        await load();
      }
    } catch {
      setSaveError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              <Link href="/home" style={{ color: "var(--text-muted)" }}>Início</Link>{" "}/ Audiobooks
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>Audiobooks</h1>
          </div>

          {canManage && (
            <button
              onClick={openModal}
              style={{
                background: "var(--primary)", color: "white", border: "none",
                borderRadius: 12, padding: "12px 18px", fontWeight: 600, fontSize: 14,
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              }}
            >
              <Plus size={18} /> Adicionar áudio
            </button>
          )}
        </div>

        {error && (
          <p style={{ color: "var(--danger)", marginTop: 14, fontSize: 14 }}>{error}</p>
        )}

        {/* Filtro por tags */}
        {(() => {
          const allTags = Array.from(
            new Map(audios.flatMap((a) => a.tags).map((t) => [t.id, t])).values()
          ).sort((a, b) => a.name.localeCompare(b.name));
          if (allTags.length === 0) return null;
          const activeTagData = allTags.find((t) => t.id === activeTag);
          const visible = tagFilterSearch
            ? allTags.filter((t) => t.name.toLowerCase().includes(tagFilterSearch.toLowerCase()))
            : allTags;
          return (
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative" }} ref={tagFilterRef}>
                <button
                  onClick={() => { setShowTagFilter((v) => !v); setTagFilterSearch(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                    border: activeTag ? `1px solid ${activeTagData?.color}` : "1px solid var(--border)",
                    background: activeTag ? (activeTagData?.color ?? "") + "18" : "var(--bg-elevated)",
                    color: activeTag ? activeTagData?.color : "var(--text-muted)",
                  }}
                >
                  <Tag size={13} />
                  {activeTagData ? activeTagData.name : "Filtrar por tag"}
                  <ChevronDown size={13} style={{ opacity: 0.6 }} />
                </button>

                {showTagFilter && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0,
                    background: "var(--bg-input)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: 8, minWidth: 220, zIndex: 30,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                  }}>
                    <input
                      autoFocus placeholder="Pesquisar tag…"
                      value={tagFilterSearch} onChange={(e) => setTagFilterSearch(e.target.value)}
                      style={{
                        width: "100%", background: "var(--bg-elevated)",
                        border: "1px solid var(--border)", borderRadius: 8,
                        padding: "7px 10px", color: "var(--text)", fontSize: 13,
                        outline: "none", boxSizing: "border-box", marginBottom: 4,
                      }}
                    />
                    <button
                      onClick={() => { setActiveTag(null); setShowTagFilter(false); setTagFilterSearch(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        width: "100%", background: activeTag === null ? "var(--primary-soft)" : "transparent",
                        border: "none", color: activeTag === null ? "var(--primary)" : "var(--text-muted)",
                        padding: "7px 10px", borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                      }}
                    >
                      Todos
                    </button>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                      {visible.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => { setActiveTag(tag.id); setShowTagFilter(false); setTagFilterSearch(""); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            width: "100%", background: activeTag === tag.id ? tag.color + "22" : "transparent",
                            border: "none", color: activeTag === tag.id ? tag.color : "var(--text)",
                            padding: "7px 10px", borderRadius: 8, fontSize: 13.5,
                            fontWeight: activeTag === tag.id ? 600 : 400,
                          }}
                          onMouseEnter={(e) => { if (activeTag !== tag.id) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                          onMouseLeave={(e) => { if (activeTag !== tag.id) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                          {tag.name}
                        </button>
                      ))}
                      {visible.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "6px 10px" }}>Nenhuma tag encontrada.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)} title="Limpar filtro"
                  style={{
                    background: "transparent", border: "1px solid var(--border)",
                    color: "var(--text-muted)", borderRadius: 8, padding: "6px 8px",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })()}

        {/* Lista */}
        <div style={{ marginTop: 28 }}>
          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Carregando…</p>
          ) : audios.length === 0 ? (
            <div style={{
              border: "1px dashed var(--border)", borderRadius: 16, padding: 48,
              textAlign: "center", color: "var(--text-muted)",
            }}>
              <Music size={32} style={{ opacity: 0.5 }} />
              <p style={{ marginTop: 12 }}>
                {canManage
                  ? 'Nenhum áudio ainda. Clique em "Adicionar áudio" para começar.'
                  : "Nenhum áudio disponível para você no momento."}
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}>
              {audios
                .filter((a) => !activeTag || a.tags.some((t) => t.id === activeTag))
                .map((a) => (
                  <Link key={a.id} href={`/audiobooks/${a.id}`}>
                    <div
                      style={{
                        background: "var(--bg-elevated)", border: "1px solid var(--border)",
                        borderRadius: 16, padding: 18, display: "flex", alignItems: "center",
                        gap: 14, transition: "border-color 0.18s, transform 0.18s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--primary)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div style={{
                        width: 46, height: 46, borderRadius: 11,
                        background: a.driveId ? "#1a73e820" : "var(--primary-soft)",
                        color: a.driveId ? "#1a73e8" : "var(--primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {a.driveId ? <HardDriveUpload size={20} /> : <Music size={20} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{
                          fontWeight: 600, fontSize: 15,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {a.title}
                        </p>
                        <p style={{
                          color: "var(--text-muted)", fontSize: 12.5, marginTop: 3,
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          {a.driveId ? (
                            <span style={{ color: "#1a73e8", fontWeight: 500 }}>Google Drive</span>
                          ) : (
                            humanSize(a.size)
                          )}
                          {canManage && (
                            <>
                              <span>·</span>
                              {a.isPublic ? (
                                <span style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--success)" }}>
                                  <Globe size={12} /> Público
                                </span>
                              ) : (
                                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <Lock size={12} /> Privado
                                </span>
                              )}
                            </>
                          )}
                        </p>
                        {a.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                            {a.tags.map((tag) => (
                              <span
                                key={tag.id}
                                style={{
                                  padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                                  background: tag.color + "22", border: `1px solid ${tag.color}44`, color: tag.color,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Adicionar áudio via Google Drive */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 28, width: "100%", maxWidth: 520,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "#1a73e820", color: "#1a73e8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <HardDriveUpload size={18} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>Adicionar via Google Drive</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12.5 }}>Cole o código de incorporação</p>
                </div>
              </div>
              <button onClick={closeModal} style={{
                background: "transparent", border: "none", color: "var(--text-muted)",
                cursor: "pointer", padding: 4, borderRadius: 8, display: "flex",
              }}>
                <X size={18} />
              </button>
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
              Código de incorporação (iframe)
            </label>
            <textarea
              value={iframeCode}
              onChange={(e) => { setIframeCode(e.target.value); setDriveInfo(null); setFetchError(""); }}
              placeholder={'<iframe src="https://drive.google.com/file/d/..." ...></iframe>'}
              rows={3}
              style={{
                width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 13,
                outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace",
              }}
            />
            {fetchError && (
              <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 6 }}>{fetchError}</p>
            )}

            {!driveInfo && (
              <button
                onClick={fetchDriveInfo}
                disabled={fetching || !iframeCode.trim()}
                style={{
                  marginTop: 10, width: "100%", background: "var(--primary)", color: "white",
                  border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 600,
                  fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, opacity: fetching || !iframeCode.trim() ? 0.6 : 1,
                  cursor: fetching || !iframeCode.trim() ? "not-allowed" : "pointer",
                }}
              >
                {fetching
                  ? <><LoaderCircle size={16} className="spin" /> Buscando…</>
                  : <><Search size={16} /> Buscar</>}
              </button>
            )}

            {driveInfo && (
              <>
                <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                  <iframe
                    src={`https://drive.google.com/file/d/${driveInfo.driveId}/preview`}
                    width="100%"
                    height="80"
                    allow="autoplay"
                    title="Preview"
                    style={{ border: "none", display: "block" }}
                  />
                </div>

                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 14, marginBottom: 6, color: "var(--text-muted)" }}>
                  Nome do áudio
                </label>
                <input
                  autoFocus
                  value={driveTitle}
                  onChange={(e) => setDriveTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveDriveAudio(); }}
                  placeholder="Nome do áudio"
                  style={{
                    width: "100%", background: "var(--bg-input)", border: "1px solid var(--primary)",
                    borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 14,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
                {saveError && (
                  <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 6 }}>{saveError}</p>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button
                    onClick={saveDriveAudio}
                    disabled={saving || !driveTitle.trim()}
                    style={{
                      flex: 1, background: "var(--primary)", color: "white", border: "none",
                      borderRadius: 10, padding: "11px 0", fontWeight: 600, fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: saving || !driveTitle.trim() ? 0.6 : 1,
                      cursor: saving || !driveTitle.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? <><LoaderCircle size={16} className="spin" /> Salvando…</> : "Adicionar"}
                  </button>
                  <button
                    onClick={() => { setDriveInfo(null); setDriveTitle(""); setIframeCode(""); setFetchError(""); }}
                    style={{
                      background: "transparent", border: "1px solid var(--border)",
                      color: "var(--text-muted)", borderRadius: 10, padding: "11px 18px",
                      fontSize: 14, cursor: "pointer",
                    }}
                  >
                    Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
