// components.jsx — shared UI primitives for RANKR
const { useState, useEffect, useRef } = React;

// ---- Logo ----
function Logo({ size = 26 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: 8, background: "var(--grad)",
        display: "grid", placeItems: "center", boxShadow: "0 4px 14px -4px var(--accent)",
      }}>
        <div style={{ width: 0, height: 0, marginLeft: 2,
          borderLeft: `${size*0.34}px solid #fff`,
          borderTop: `${size*0.22}px solid transparent`,
          borderBottom: `${size*0.22}px solid transparent` }} />
      </div>
      <span className="display" style={{ fontWeight: 700, fontSize: size * 0.78, letterSpacing: "-0.02em" }}>
        RANKR
      </span>
    </div>
  );
}

// ---- Animated number ----
function useCountUp(target, dur = 700) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current, to = target, t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

// ---- Score ring (big circular gauge) ----
function ScoreRing({ score, size = 132, stroke = 11, label = "RANK SCORE", live }) {
  const val = useCountUp(score);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - val / 100);
  const gid = "ring-" + Math.round(size);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--grad-a)" />
            <stop offset="0.5" stopColor="var(--grad-b)" />
            <stop offset="1" stopColor="var(--grad-c)" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={`url(#${gid})`} strokeWidth={stroke}
          fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.2,0.7,0.3,1)",
            filter: live ? "drop-shadow(0 0 8px var(--accent))" : "none" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div className="display" style={{ fontSize: size * 0.34, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}>{val}</div>
          <div className="mono" style={{ fontSize: 9.5, color: "var(--muted)", letterSpacing: "0.12em", marginTop: 4 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

// ---- Mini stat bar ----
function RatingBar({ label, value, icon }) {
  const w = useCountUp(value, 600);
  const tone = value >= 85 ? "var(--win)" : value >= 70 ? "var(--grad-b)" : "var(--muted)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)", width: 92, flexShrink: 0, letterSpacing: "0.02em" }}>
        {icon} {label}
      </span>
      <div style={{ flex: 1, height: 6, background: "var(--surface-2)", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: value >= 85 ? "var(--win)" : "var(--grad)", borderRadius: 20, transition: "width 0.6s ease" }} />
      </div>
      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: tone, width: 26, textAlign: "right" }}>{w}</span>
    </div>
  );
}

// ---- Pill / chip ----
function Pill({ children, active, onClick, trending }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "8px 14px", borderRadius: 20, fontSize: 13.5, fontWeight: 500,
      border: `1.5px solid ${active ? "transparent" : "var(--border)"}`,
      background: active ? "var(--grad)" : "var(--surface)",
      color: active ? "#fff" : "var(--text)",
      boxShadow: active ? "0 6px 18px -8px var(--accent)" : "none",
      transition: "all 0.18s ease", whiteSpace: "nowrap",
    }}>
      {trending && <span style={{ fontSize: 11 }}>📈</span>}
      {children}
    </button>
  );
}

// ---- Button ----
function Button({ children, onClick, kind = "primary", size = "md", disabled, style }) {
  const sizes = { sm: "9px 16px", md: "14px 26px", lg: "17px 36px" };
  const fs = { sm: 13, md: 15, lg: 17 };
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
    padding: sizes[size], fontSize: fs[size], fontWeight: 600, borderRadius: 999,
    fontFamily: '"Space Grotesk", sans-serif', letterSpacing: "-0.01em",
    transition: "transform 0.12s ease, box-shadow 0.2s ease, opacity 0.2s",
    opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto",
    ...style,
  };
  const kinds = {
    primary: { background: "var(--grad)", color: "#fff", boxShadow: "0 10px 30px -10px var(--accent)" },
    ghost: { background: "var(--surface)", color: "var(--text)", border: "1.5px solid var(--border)" },
    quiet: { background: "transparent", color: "var(--muted)" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
      onMouseUp={e => e.currentTarget.style.transform = ""}
      onMouseLeave={e => e.currentTarget.style.transform = ""}
      style={{ ...base, ...kinds[kind] }}>
      {children}
    </button>
  );
}

// ---- Section heading with eyebrow ----
function StepHead({ step, total, eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.14em", marginBottom: 10, fontWeight: 600 }}>
        STEP {step}/{total} · {eyebrow}
      </div>
      <h2 className="display" style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 700, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
        {title}
      </h2>
      {sub && <p style={{ color: "var(--muted)", margin: "10px 0 0", fontSize: 15.5, maxWidth: 560, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

// ---- Selectable card frame ----
function SelectCard({ selected, onClick, children, style }) {
  return (
    <div onClick={onClick} style={{
      position: "relative", borderRadius: "var(--r-lg)", cursor: "pointer",
      background: "var(--surface)",
      border: `2px solid ${selected ? "transparent" : "var(--border)"}`,
      boxShadow: selected ? "0 0 0 2px var(--accent), 0 18px 44px -18px var(--accent)" : "var(--shadow-lg)",
      transition: "transform 0.18s ease, box-shadow 0.25s ease, border-color 0.2s",
      transform: selected ? "translateY(-2px)" : "none",
      ...style,
    }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.transform = "translateY(-3px)"; }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.transform = "none"; }}>
      {selected && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3, width: 26, height: 26, borderRadius: 999,
          background: "var(--grad)", display: "grid", placeItems: "center", boxShadow: "0 4px 12px -2px var(--accent)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
      {children}
    </div>
  );
}

// ---- Thumbnail preview (composed designed thumb, or user-uploaded image) ----
function ThumbPreview({ thumb, ratio = "16/9" }) {
  if (thumb.img) {
    return (
      <div style={{ position: "relative", aspectRatio: ratio, borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--bg-2)" }}>
        <img src={thumb.img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {thumb.tag && <div className="mono" style={{ position: "absolute", top: 8, left: 8, fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "rgba(0,0,0,0.6)", color: "#fff", letterSpacing: "0.08em", zIndex: 2 }}>{thumb.tag}</div>}
      </div>
    );
  }
  const bg = {
    "left-text": "linear-gradient(100deg, rgba(0,0,0,0.55) 38%, transparent), var(--grad)",
    "split": "var(--grad)",
    "face": "radial-gradient(circle at 72% 50%, transparent 30%, rgba(0,0,0,0.5)), var(--grad)",
    "minimal": "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.6))",
  }[thumb.layout];
  return (
    <div style={{ position: "relative", aspectRatio: ratio, borderRadius: "var(--r-md)", overflow: "hidden",
      background: thumb.layout === "minimal" ? "var(--surface-2)" : "var(--bg-2)" }}>
      {/* photo placeholder stripes */}
      <div style={{ position: "absolute", inset: 0,
        background: "repeating-linear-gradient(135deg, transparent, transparent 11px, rgba(255,255,255,0.045) 11px, rgba(255,255,255,0.045) 22px)" }} />
      {/* color treatment */}
      <div style={{ position: "absolute", inset: 0, background: bg, opacity: thumb.layout === "minimal" ? 1 : 0.92, mixBlendMode: "normal" }} />
      {/* shot note */}
      <div className="mono" style={{ position: "absolute", bottom: 8, left: 10, right: 10, fontSize: 9, color: "rgba(255,255,255,0.62)", lineHeight: 1.3, zIndex: 1 }}>
        ◹ {thumb.shot}
      </div>
      {/* overlay headline */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: thumb.layout === "left-text" ? "flex-start" : "center",
        padding: "0 18px", zIndex: 2 }}>
        <div style={{ textAlign: thumb.layout === "left-text" ? "left" : "center" }}>
          <div className="display" style={{ color: thumb.textColor, fontWeight: 700, lineHeight: 0.92,
            fontSize: "clamp(22px, 4.4vw, 40px)", letterSpacing: "-0.02em", whiteSpace: "pre-line",
            textShadow: "0 3px 16px rgba(0,0,0,0.5)", textTransform: "uppercase" }}>
            {thumb.headline}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 9, right: 10, fontSize: 22, zIndex: 2, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}>{thumb.badge}</div>
    </div>
  );
}

Object.assign(window, {
  useCountUp, ScoreRing, RatingBar, Pill, Button, StepHead, SelectCard, ThumbPreview, Logo,
});
