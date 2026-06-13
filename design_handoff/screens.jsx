// screens.jsx — Upload, Analyzing, and the five Result steps for RANKR
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

// ============ UPLOAD ============
function UploadScreen({ onStart, tone }) {
  const [drag, setDrag] = useStateS(false);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "40px 22px 80px" }}>
        <div className="stagger" style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 15px", borderRadius: 999,
            border: "1px solid var(--border)", background: "var(--surface)", marginBottom: 26 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--win)", boxShadow: "0 0 8px var(--win)" }} />
            <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: "0.04em" }}>Ranking model · updated for 2026</span>
          </div>
          <h1 className="display" style={{ fontSize: "clamp(38px, 7vw, 74px)", fontWeight: 700, lineHeight: 0.96, letterSpacing: "-0.035em", margin: 0 }}>
            Drop a video.<br /><span className="grad-text">Rank higher.</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "clamp(16px, 2.2vw, 19px)", lineHeight: 1.55, maxWidth: 520, margin: "20px auto 0" }}>
            RANKR studies your footage and hands you titles, thumbnails, descriptions and tags engineered to win the algorithm — each scored before you ever hit publish.
          </p>

          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); onStart(); }}
            onClick={onStart}
            style={{
              marginTop: 38, padding: "48px 28px", borderRadius: "var(--r-xl)", cursor: "pointer",
              border: `2px dashed ${drag ? "var(--accent)" : "var(--border-2)"}`,
              background: drag ? "color-mix(in oklch, var(--accent) 10%, var(--surface))" : "var(--surface)",
              transition: "all 0.2s ease", boxShadow: "var(--shadow-lg)",
            }}>
            <div style={{ width: 64, height: 64, margin: "0 auto 18px", borderRadius: 18, background: "var(--grad)",
              display: "grid", placeItems: "center", boxShadow: "0 12px 30px -10px var(--accent)",
              transform: drag ? "scale(1.08) translateY(-3px)" : "none", transition: "transform 0.2s" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M5 11l7-7 7 7" /><path d="M4 20h16" /></svg>
            </div>
            <div className="display" style={{ fontSize: 20, fontWeight: 600 }}>
              {drag ? "Release to analyze" : "Drag & drop your video here"}
            </div>
            <div style={{ color: "var(--muted)", marginTop: 7, fontSize: 14.5 }}>
              or <span style={{ color: "var(--accent)", fontWeight: 600 }}>browse files</span> · MP4, MOV, WebM up to 4 GB
            </div>
          </div>

          <div style={{ display: "flex", gap: 22, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
            {[["⚡", "~30s analysis"], ["🎯", "Algorithm-scored"], ["🔒", "Private & secure"]].map(([i, t]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 13.5 }}>
                <span style={{ fontSize: 15 }}>{i}</span>{t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ANALYZING ============
function AnalyzingScreen({ onDone }) {
  const [pct, setPct] = useStateS(0);
  const [stepIdx, setStepIdx] = useStateS(0);
  useEffectS(() => {
    // timer-driven (not rAF) so progress still advances when the tab is backgrounded
    const t0 = Date.now(), DUR = 5000;
    let done = false;
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / DUR);
      const e = 1 - Math.pow(1 - p, 2.2);
      const v = Math.round(e * 100);
      setPct(v);
      setStepIdx(Math.min(ANALYSIS_STEPS.length - 1, Math.floor((v / 100) * ANALYSIS_STEPS.length)));
      if (p >= 1 && !done) { done = true; clearInterval(id); setTimeout(onDone, 450); }
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "40px 22px" }}>
        <div style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
          {/* spinning gradient ring */}
          <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto 34px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: "conic-gradient(var(--grad-a), var(--grad-b), var(--grad-c), var(--grad-a))",
              animation: "spin 1.4s linear infinite", filter: "blur(2px)", opacity: 0.9 }} />
            <div style={{ position: "absolute", inset: 6, borderRadius: 999, background: "var(--bg)", display: "grid", placeItems: "center" }}>
              <div className="display grad-text" style={{ fontSize: 42, fontWeight: 700 }}>{pct}<span style={{ fontSize: 20 }}>%</span></div>
            </div>
          </div>
          <h2 className="display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Analyzing your video…</h2>
          <div className="mono" style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>{VIDEO.name} · {VIDEO.duration}</div>

          <div style={{ marginTop: 32, textAlign: "left", display: "flex", flexDirection: "column", gap: 12 }}>
            {ANALYSIS_STEPS.map((s, i) => {
              const done = i < stepIdx, active = i === stepIdx;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, opacity: i <= stepIdx ? 1 : 0.32, transition: "opacity 0.4s" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, display: "grid", placeItems: "center",
                    background: done ? "var(--grad)" : active ? "transparent" : "var(--surface-2)",
                    border: active ? "2px solid var(--accent)" : "none" }}>
                    {done ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : active ? <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)", animation: "pulse-ring 1s infinite" }} /> : null}
                  </div>
                  <span style={{ fontSize: 15, color: active ? "var(--text)" : "var(--muted)", fontWeight: active ? 600 : 400 }}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ shared chrome ============
function TopBar({ right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px clamp(18px, 4vw, 44px)", position: "sticky", top: 0, zIndex: 20,
      background: "color-mix(in oklch, var(--bg) 78%, transparent)", backdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--border)" }}>
      <Logo />
      {right}
    </div>
  );
}

Object.assign(window, { UploadScreen, AnalyzingScreen, TopBar });
