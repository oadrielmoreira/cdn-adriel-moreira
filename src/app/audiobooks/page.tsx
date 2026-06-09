"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Upload, Music, LoaderCircle, Lock, Globe, Tag, ChevronDown, X } from "lucide-react";

type Tag = { id: string; name: string; color: string };

type Audio = {
  id: string;
  title: string;
  fileName: string;
  size: number;
  durationSec: number | null;
  isPublic: boolean;
  createdAt: string;
  tags: Tag[];
};

function humanSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AudiobooksPage() {
  const [audios, setAudios] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [tagFilterSearch, setTagFilterSearch] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tagFilterRef = useRef<HTMLDivElement>(null);

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

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB por chunk

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

  useEffect(() => {
    load();
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setProgress(0);

    const uploadId = crypto.randomUUID();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const title = file.name.replace(/\.[^.]+$/, "");

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const blob = file.slice(start, start + CHUNK_SIZE);

        const form = new FormData();
        form.append("chunk", new File([blob], file.name, { type: file.type }), file.name);
        form.append("uploadId", uploadId);
        form.append("chunkIndex", String(i));
        form.append("totalChunks", String(totalChunks));
        form.append("filename", file.name);
        form.append("mimeType", file.type);
        form.append("title", title);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || "Falha no upload");
          return;
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 100));

        if (data.done) {
          await load();
          return;
        }
      }
    } catch {
      setError("Erro de conexão durante o upload. Tente novamente.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <TopBar />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              <Link href="/home" style={{ color: "var(--text-muted)" }}>
                Início
              </Link>{" "}
              / Audiobooks
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
              Audiobooks
            </h1>
          </div>

          {/* Botão de upload */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: uploading ? 0.7 : 1,
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? (
                <>
                  <LoaderCircle size={18} className="spin" /> Enviando… {progress}%
                </>
              ) : (
                <>
                  <Upload size={18} /> Subir áudio
                </>
              )}
            </button>
            {uploading && (
              <div style={{ width: 180, height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "var(--primary)",
                    borderRadius: 4,
                    transition: "width 0.2s",
                  }}
                />
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={handleFile}
          />
        </div>

        {error && (
          <p style={{ color: "var(--danger)", marginTop: 14, fontSize: 14 }}>
            {error}
          </p>
        )}

        {/* Filtro por tags — dropdown */}
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
                      autoFocus
                      placeholder="Pesquisar tag…"
                      value={tagFilterSearch}
                      onChange={(e) => setTagFilterSearch(e.target.value)}
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
                            padding: "7px 10px", borderRadius: 8, fontSize: 13.5, fontWeight: activeTag === tag.id ? 600 : 400,
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
                  onClick={() => setActiveTag(null)}
                  title="Limpar filtro"
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
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: 16,
                padding: 48,
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <Music size={32} style={{ opacity: 0.5 }} />
              <p style={{ marginTop: 12 }}>
                Nenhum áudio ainda. Clique em “Subir áudio” para começar.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {audios.filter((a) => !activeTag || a.tags.some((t) => t.id === activeTag)).map((a) => (
                <Link key={a.id} href={`/audiobooks/${a.id}`}>
                  <div
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 16,
                      padding: 18,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "border-color 0.18s, transform 0.18s",
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
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 11,
                        background: "var(--primary-soft)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Music size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {a.title}
                      </p>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: 12.5,
                          marginTop: 3,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {humanSize(a.size)}
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

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
