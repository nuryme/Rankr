// app.jsx — RANKR orchestrator: state machine, scoring, results wizard, tweaks
const { useState: useApp, useEffect: useAppEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "Sunset",
  "tone": "balanced",
  "count": 4
}/*EDITMODE-END*/;

const STEP_NAMES = ["Title", "Thumbnail", "Description", "Tags", "Rank"];
const DEFAULT_TAGS = [0, 1, 2, 3, 6, 7, 8, 11];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [phase, setPhase] = useApp("upload"); // upload | analyzing | results
  const [step, setStep] = useApp(0);

  // selections
  const [titleSel, setTitleSel] = useApp(0);
  const [thumbSel, setThumbSel] = useApp(0);
  const [descOpts, setDescOpts] = useApp({ chapters: true, links: true, cta: true, hashtags: true });
  const [tagsSel, setTagsSel] = useApp(DEFAULT_TAGS);
  const [userThumb, setUserThumb] = useApp(null); // uploaded + auto-edited thumbnail
  const [exported, setExported] = useApp(false);

  const titles = TITLES[t.tone] || TITLES.balanced;
  const desc = DESCRIPTIONS[t.tone] || DESCRIPTIONS.balanced;

  // clamp selections if tone/count changes
  useAppEffect(() => { if (titleSel >= titles.length) setTitleSel(0); }, [t.tone]);

  // apply theme to CSS vars
  useAppEffect(() => {
    const th = THEMES[t.theme] || THEMES.Sunset;
    const root = document.documentElement.style;
    root.setProperty("--grad-a", th.a);
    root.setProperty("--grad-b", th.b);
    root.setProperty("--grad-c", th.c);
    root.setProperty("--accent", th.accent);
  }, [t.theme]);

  // ---- scoring ----
  const score = useMemo(() => {
    const ti = titles[titleSel] || titles[0];
    const th = (typeof thumbSel === "string" && userThumb)
      ? userThumb.variants[thumbSel === "user-grade" ? "grade" : "graphics"]
      : THUMBS[Math.min(typeof thumbSel === "string" ? 0 : thumbSel, THUMBS.length - 1)];
    const picked = tagsSel.map(i => TAGS[i]).filter(Boolean);
    const trendRatio = picked.length ? picked.filter(x => x.trending).length / picked.length : 0;

    const ctr = Math.round((ti.ctr + th.ctr) / 2);
    const tagSeo = Math.min(100, 46 + picked.length * 6);
    const seo = Math.round((ti.seo + tagSeo) / 2);
    const watch = Math.min(100, 64 + (descOpts.chapters ? 10 : 0) + (descOpts.cta ? 6 : 0) + (descOpts.links ? 4 : 0) + (th.ctr > 88 ? 6 : 0));
    const trend = Math.round((ti.trend + trendRatio * 100) / 2);
    const overall = Math.round(ctr * 0.35 + seo * 0.25 + watch * 0.15 + trend * 0.25);
    return { overall, ctr, seo, watch, trend };
  }, [titleSel, thumbSel, descOpts, tagsSel, t.tone, userThumb]);

  const start = () => { setPhase("analyzing"); };
  const finishAnalyze = () => { setPhase("results"); setStep(0); window.scrollTo(0, 0); };
  const restart = () => {
    setPhase("upload"); setStep(0); setTitleSel(0); setThumbSel(0); setUserThumb(null);
    setTagsSel(DEFAULT_TAGS); setDescOpts({ chapters: true, links: true, cta: true, hashtags: true });
    setExported(false); window.scrollTo(0, 0);
  };
  const goStep = (n) => { setStep(n); window.scrollTo(0, 0); };

  const toggleTag = (i) => setTagsSel(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);

  // copy the optimized package to the clipboard for pasting into YouTube Studio
  const exportPackage = () => {
    const ti = titles[titleSel] || titles[0];
    const picked = tagsSel.map(i => TAGS[i]).filter(Boolean).map(x => x.t);
    const text = `TITLE\n${ti.text}\n\nDESCRIPTION\n${desc.intro}\n\nTAGS\n${picked.join(", ")}`;
    try { navigator.clipboard.writeText(text); } catch (e) { /* clipboard unavailable — modal still shows the package */ }
    setExported(true);
  };

  // ---- panel ----
  const panel = (
    <TweaksPanel>
      <TweakSection label="Theme" />
      <TweakRadio label="Gradient" value={t.theme} options={["Sunset", "Electric", "Inferno", "Mint"]}
        onChange={v => setTweak("theme", v)} />
      <TweakSection label="Suggestions" />
      <TweakRadio label="Tone" value={t.tone} options={["punchy", "balanced", "seo"]}
        onChange={v => setTweak("tone", v)} />
      <TweakSlider label="How many" value={t.count} min={2} max={5} step={1}
        onChange={v => setTweak("count", v)} />
    </TweaksPanel>
  );

  if (phase === "upload") return (<><UploadScreen onStart={start} /><Float>{panel}</Float></>);
  if (phase === "analyzing") return (<><AnalyzingScreen onDone={finishAnalyze} /><Float>{panel}</Float></>);

  // ---- results ----
  const stepDone = [titleSel != null, thumbSel != null, true, tagsSel.length > 0, false];
  const titleText = titles[titleSel]?.text;
  const thumb = (typeof thumbSel === "string" && userThumb)
    ? userThumb.variants[thumbSel === "user-grade" ? "grade" : "graphics"]
    : THUMBS[Math.min(typeof thumbSel === "string" ? 0 : thumbSel, THUMBS.length - 1)];

  return (
    <>
      <TopBar right={<ScoreChip score={score.overall} />} />
      <div className="results-wrap">
        {/* stepper */}
        <div className="stepper">
          {STEP_NAMES.map((name, i) => {
            const active = step === i, done = i < step;
            return (
              <button key={name} className="stepper-seg" onClick={() => goStep(i)} style={{ textAlign: "left" }}>
                <div style={{ height: 4, borderRadius: 20, background: active || done ? "var(--grad)" : "var(--surface-2)", transition: "background 0.3s" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: active ? "var(--accent)" : done ? "var(--text)" : "var(--muted-2)", fontWeight: 600 }}>
                    {done ? "✓" : `0${i + 1}`}
                  </span>
                  <span className="step-label-text" style={{ fontSize: 12.5, color: active ? "var(--text)" : "var(--muted)", fontWeight: active ? 600 : 400 }}>{name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* step content */}
        <div key={step + t.tone} className="step-anim" style={{ animation: "fade-in 0.35s ease" }}>
          {step === 0 && <TitleStep titles={titles} selected={titleSel} onSelect={setTitleSel} count={t.count} />}
          {step === 1 && <ThumbStep thumbs={THUMBS} selected={thumbSel} onSelect={setThumbSel} count={t.count} userThumb={userThumb} setUserThumb={setUserThumb} title={titleText} />}
          {step === 2 && <DescStep desc={desc} opts={descOpts} setOpts={setDescOpts} title={titleText} />}
          {step === 3 && <TagStep tags={TAGS} picked={tagsSel} toggle={toggleTag} />}
          {step === 4 && <RankStep score={score.overall} breakdown={score} title={titleText} thumb={thumb}
            tagCount={tagsSel.length} onRestart={restart} onExport={exportPackage} />}
        </div>
      </div>

      {/* footer nav */}
      <div className="step-foot">
        <Button kind="quiet" onClick={() => step === 0 ? restart() : goStep(step - 1)}>
          {step === 0 ? "↺ Start over" : "← Back"}
        </Button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--win)", boxShadow: "0 0 7px var(--win)" }} />
            Rank {score.overall}
          </span>
          {step < 4
            ? <Button kind="primary" onClick={() => goStep(step + 1)}>Next · {STEP_NAMES[step + 1]} →</Button>
            : <Button kind="primary" onClick={exportPackage}>Copy package ▸</Button>}
        </div>
      </div>

      {exported && <ExportModal score={score.overall} title={titleText} onClose={() => setExported(false)} onRestart={restart} />}
      <Float>{panel}</Float>
    </>
  );
}

// compact live score in top bar
function ScoreChip({ score }) {
  const val = useCountUp(score, 500);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px 7px 8px", borderRadius: 999,
      border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div style={{ width: 30, height: 30, borderRadius: 999, background: "var(--grad)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <span className="display" style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{val}</span>
      </div>
      <div style={{ lineHeight: 1 }}>
        <div className="mono" style={{ fontSize: 8.5, color: "var(--muted)", letterSpacing: "0.1em" }}>RANK SCORE</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{val >= 85 ? "Excellent" : val >= 70 ? "Strong" : "Building"}</div>
      </div>
    </div>
  );
}

// export success modal
function ExportModal({ score, title, onClose, onRestart }) {
  return (
    <div onClick={onClose} className="enter-anim" style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: 22, animation: "fade-in 0.25s" }}>
      <div onClick={e => e.stopPropagation()} className="enter-anim" style={{ background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", padding: "38px 34px", maxWidth: 420, textAlign: "center", boxShadow: "var(--shadow-lg)",
        animation: "pop-in 0.4s cubic-bezier(0.2,0.8,0.3,1)" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
        <h2 className="display" style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Package copied</h2>
        <p style={{ color: "var(--muted)", margin: "12px 0 4px", fontSize: 15, lineHeight: 1.5 }}>
          Your title, description and tags — scoring a <span className="grad-text" style={{ fontWeight: 700 }}>Rank Score of {score}</span> — are on your clipboard. Paste them into YouTube Studio when you upload.
        </p>
        <div style={{ background: "var(--bg-2)", borderRadius: "var(--r-md)", padding: "12px 16px", margin: "20px 0", fontSize: 14, fontWeight: 600 }}>“{title}”</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Button kind="primary" onClick={onRestart}>Optimize another</Button>
          <Button kind="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// wrapper that hides panel children entirely when edit mode is off is handled by TweaksPanel itself
function Float({ children }) { return children; }

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
