"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Gauge,
} from "lucide-react";

type Props = {
  src: string;
  title: string;
  onDuration?: (sec: number) => void;
};

const MIN_SPEED = 0.25;
const MAX_SPEED = 3.0;

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, title, onDuration }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  // ── Web Audio + visualização ──────────────────────────────────────────────
  const setupAudioGraph = useCallback(() => {
    if (ctxRef.current || !audioRef.current) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
  }, []);

  const drawBars = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const c = canvas.getContext("2d");
    if (!c) return;

    const bins = analyser.frequencyBinCount;
    const data = new Uint8Array(bins);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(data);

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);

      const bars = 48;
      const step = Math.floor(bins / bars);
      const gap = 3;
      const bw = (w - gap * (bars - 1)) / bars;
      if (bw <= 0) return;

      const primary =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--primary")
          .trim() || "#22C55E";

      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255;
        const bh = Math.max(3, v * h);
        const x = i * (bw + gap);
        const y = h - bh;
        const alpha = 0.35 + v * 0.65;
        const grad = c.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, primary + Math.round(alpha * 255).toString(16).padStart(2, "0"));
        grad.addColorStop(1, primary + "55");
        c.fillStyle = grad;
        const r = Math.min(bw / 2, 4);
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + bw, y, x + bw, y + r, r);
        c.lineTo(x + bw, h);
        c.lineTo(x, h);
        c.lineTo(x, y + r);
        c.arcTo(x, y, x + r, y, r);
        c.closePath();
        c.fill();
      }
    };
    render();
  }, []);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    setupAudioGraph();
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    if (a.paused) { a.play(); drawBars(); } else { a.pause(); }
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onLoaded = () => {
      setDuration(a.duration);
      if (onDuration && isFinite(a.duration)) onDuration(a.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    const onEnded = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onDuration]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a) return;
    const t = (Number(e.target.value) / 100) * duration;
    a.currentTime = t;
    setCurrent(t);
  }

  function skip(sec: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.min(Math.max(0, a.currentTime + sec), duration);
  }

  function changeSpeed(delta: number) {
    setSpeed((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.min(MAX_SPEED, Math.max(MIN_SPEED, next));
    });
  }

  const progress = duration ? (current / duration) * 100 : 0;
  const volPct = (muted ? 0 : volume) * 100;

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: 24,
      boxShadow: "0 16px 50px rgba(0,0,0,0.4)",
    }}>
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />

      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
      </div>

      {/* Visualizador de frequências */}
      <div style={{
        height: 100,
        background: "linear-gradient(180deg, transparent 0%, var(--primary-soft) 100%)",
        borderRadius: 14,
        padding: "10px 10px 0",
        marginBottom: 16,
        overflow: "hidden",
      }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {/* Progresso */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", minWidth: 38, textAlign: "right" }}>
          {fmt(current)}
        </span>
        <input
          type="range" min={0} max={100} step={0.1} value={progress}
          onChange={seek}
          style={{
            flex: 1, appearance: "none", height: 5, borderRadius: 4, outline: "none", cursor: "pointer",
            background: `linear-gradient(to right, var(--primary) ${progress}%, var(--border) ${progress}%)`,
          }}
        />
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", minWidth: 38 }}>
          {fmt(duration)}
        </span>
      </div>

      {/* Controles */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 20, gap: 10, flexWrap: "wrap",
      }}>

        {/* Volume */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 130 }}>
          <button onClick={() => setMuted((m) => !m)} style={iconBtn} title={muted ? "Ativar som" : "Silenciar"}>
            {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
            style={{
              width: 76, appearance: "none", height: 4, borderRadius: 4, cursor: "pointer",
              background: `linear-gradient(to right, var(--text-muted) ${volPct}%, var(--border) ${volPct}%)`,
            }}
          />
        </div>

        {/* Transporte */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => skip(-10)} style={iconBtn} title="Voltar 10s">
            <SkipBack size={19} />
          </button>
          <button
            onClick={togglePlay}
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--primary)", border: "none", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 24px rgba(34,197,94,0.35)", cursor: "pointer",
            }}
            title={playing ? "Pausar" : "Reproduzir"}
          >
            {playing ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}
          </button>
          <button onClick={() => skip(10)} style={iconBtn} title="Avançar 10s">
            <SkipForward size={19} />
          </button>
        </div>

        {/* Velocidade: −/+ com passo 0.05 */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 130, justifyContent: "flex-end" }}>
          <button
            onClick={() => changeSpeed(-0.05)}
            disabled={speed <= MIN_SPEED}
            style={{ ...iconBtn, width: 30, height: 30, fontSize: 16, fontWeight: 700, opacity: speed <= MIN_SPEED ? 0.35 : 1 }}
            title="Diminuir velocidade"
          >
            −
          </button>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 13, fontWeight: 700, minWidth: 60,
            justifyContent: "center", color: "var(--text)",
          }}>
            <Gauge size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
            {speed.toFixed(2)}x
          </div>
          <button
            onClick={() => changeSpeed(0.05)}
            disabled={speed >= MAX_SPEED}
            style={{ ...iconBtn, width: 30, height: 30, fontSize: 16, fontWeight: 700, opacity: speed >= MAX_SPEED ? 0.35 : 1 }}
            title="Aumentar velocidade"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10,
  background: "transparent", border: "1px solid var(--border)",
  color: "var(--text)", display: "flex", alignItems: "center",
  justifyContent: "center", cursor: "pointer",
};
