export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          background:
            "linear-gradient(135deg, var(--primary), var(--accent))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: size * 0.55,
          color: "white",
          boxShadow: "0 4px 14px var(--primary-soft)",
        }}
      >
        C
      </div>
      <span style={{ fontWeight: 700, fontSize: size * 0.6, letterSpacing: -0.3 }}>
        CDN<span style={{ color: "var(--primary)" }}> Adriel</span>
      </span>
    </div>
  );
}
