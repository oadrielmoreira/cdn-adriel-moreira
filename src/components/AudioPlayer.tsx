"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Gauge,
} from "lucide-react";

type Props = {
  src: string;
  title: string;
  /** chamado quando descobrimos a duração real, para salvar no banco */
  onDuration?: (sec: number) => void;
};

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, title, onDuration }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web Audio
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
  const [showSpeed, setShowSpeed] = useState(false);

  // ── Visualização de frequências (Web Audio + canvas) ──
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
      if (bw <= 0) return; // canvas muito estreito, evita raio negativo
      const accent =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim() || "#22D3EE";
      const primary =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--primary")
          .trim() || "#7C3AED";

      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255; // 0..1
        const bh = Math.max(2, v * h);
        const x = i * (bw + gap);
        const y = h - bh;
        const grad = c.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, accent);
        grad.addColorStop(1, primary);
        c.fillStyle = grad;
        const r = Math.max(0, Math.min(bw / 2, 3));
        // barra com cantos arredondados
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
    if (a.paused) {
      a.play();
      drawBars();
    } else {
      a.pause();
    }
  }

  // sincroniza estados com o elemento <audio>
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

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 16px 50px rgba(0,0,0,0.4)",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
      </div>

      {/* Visualizador de frequências */}
      <div
        style={{
          height: 110,
          background:
            "linear-gradient(180deg, transparent, var(--primary-soft))",
          borderRadius: 14,
          padding: 12,
          marginBottom: 18,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>

      {/* Barra de progresso + tempos */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)", minWidth: 42 }}>
          {fmt(current)}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={seek}
          style={{
            flex: 1,
            appearance: "none",
            height: 6,
            borderRadius: 4,
            background: `linear-gradient(to right, var(--primary) ${progress}%, var(--border) ${progress}%)`,
            outline: "none",
            cursor: "pointer",
          }}
        />
        <span style={{ fontSize: 13, color: "var(--text-muted)", minWidth: 42 }}>
          {fmt(duration)}
        </span>
      </div>

      {/* Controles */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 18,
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        {/* esquerda: volume */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
          <button
            onClick={() => setMuted((m) => !m)}
            style={iconBtn}
            title={muted ? "Ativar som" : "Silenciar"}
          >
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setMuted(false);
            }}
            style={{
              width: 80,
              appearance: "none",
              height: 4,
              borderRadius: 4,
              background: `linear-gradient(to right, var(--text-muted) ${
                (muted ? 0 : volume) * 100
              }%, var(--border) ${(muted ? 0 : volume) * 100}%)`,
              cursor: "pointer",
            }}
          />
        </div>

        {/* centro: transporte */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => skip(-10)} style={iconBtn} title="Voltar 10s">
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlay}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--primary)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 20px var(--primary-soft)",
            }}
            title={playing ? "Pausar" : "Reproduzir"}
          >
            {playing ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 2 }} />}
          </button>
          <button onClick={() => skip(10)} style={iconBtn} title="Avançar 10s">
            <SkipForward size={20} />
          </button>
        </div>

        {/* direita: velocidade detalhada */}
        <div style={{ position: "relative", minWidth: 130, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowSpeed((s) => !s)}
            style={{
              ...iconBtn,
              width: "auto",
              padding: "8px 12px",
              gap: 6,
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              fontWeight: 600,
            }}
            title="Velocidade de reprodução"
          >
            <Gauge size={16} /> {speed}x
          </button>

          {showSpeed && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                right: 0,
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 8,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 4,
                width: 150,
                zIndex: 20,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    setShowSpeed(false);
                  }}
                  style={{
                    background: s === speed ? "var(--primary)" : "transparent",
                    color: s === speed ? "white" : "var(--text)",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
