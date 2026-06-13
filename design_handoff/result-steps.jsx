// result-steps.jsx — the five result steps for RANKR
const { useState: useStateR, useRef: useRefR } = React;

// ---------- STEP 1: TITLES ----------
function TitleStep({ titles, selected, onSelect, count }) {
  const shown = titles.slice(0, count);
  return (
    <div>
      <StepHead step={1} total={5} eyebrow="TITLE" title="Pick a title that pops"
        sub="Ranked by click-through potential, searchability and how well it rides current trends. Higher score = more likely to get served and clicked." />
      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {shown.map((t, i) => {
          const s = titleScore(t);
          const sel = selected === i;
          return (
            <SelectCard key={i} selected={sel} onClick={() => onSelect(i)} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 300px", minWidth: 240 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span className="display" style={{ fontSize: 16, fontWeight: 600, color: s >= 85 ? "var(--win)" : "var(--grad-b)" }}>{s}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: "var(--muted)", letterSpacing: "0.1em" }}>SCORE</span>
                    {i === 0 && <span className="mono" style={{ fontSize: 9.5, padding: "3px 8px", borderRadius: 6, background: "var(--grad)", color: "#fff", letterSpacing: "0.08em", fontWeight: 600 }}>TOP PICK</span>}
                  </div>
                  <div className="display" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.01em", paddingRight: 24 }}>{t.text}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
                    📈 Est. reach <span style={{ color: "var(--text)" }}>{predictReach(t.ctr)}</span> views · 30 days
                  </div>
                </div>
                <div style={{ flex: "0 1 220px", minWidth: 200, display: "flex", flexDirection: "column", gap: 9, paddingTop: 2 }}>
                  <RatingBar label="CTR power" value={t.ctr} icon="🎯" />
                  <RatingBar label="Search" value={t.seo} icon="🔍" />
                  <RatingBar label="Trend fit" value={t.trend} icon="🔥" />
                </div>
              </div>
            </SelectCard>
          );
        })}
      </div>
    </div>
  );
}

// ---------- STEP 2: THUMBNAILS ----------

// the visible enhancement pass shown while the canvas edit runs
const ENHANCE_STEPS = [
  "Analyzing composition…",
  "Boosting contrast & clarity…",
  "Punching color saturation…",
  "Adding focus vignette…",
  "Composing headline & graphics…",
  "Scoring against the feed…",
];
const ENHANCE_TICK = 520;

// real image edit: contrast / saturation / brightness boost + focus vignette
function enhanceImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.min(1280, img.width || 1280);
      const h = Math.round(w * (img.height || 720) / (img.width || 1280));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.filter = "contrast(1.16) saturate(1.45) brightness(1.05)";
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = "none";
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.78);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// pull 1–2 punchy words from the chosen title for the composited headline
function headlineFrom(title) {
  const stop = new Set(["the", "a", "an", "of", "to", "that", "this", "is", "it", "its", "your", "you", "you'll", "ever", "only", "like", "in", "for", "with", "how", "i", "my", "we", "need"]);
  const words = String(title || "").replace(/\(.*?\)/g, " ").split(/\s+/)
    .map((w) => w.replace(/[^\w'!%-]/g, "")).filter((w) => w && !stop.has(w.toLowerCase()));
  return (words.slice(0, 2).join("\n") || "MUST SEE").toUpperCase();
}

// second edit pass: composite engagement graphics onto the graded image —
// bold headline, emoji badge, brand-gradient frame
function composeGraphics(src, headline) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.min(1280, img.width || 1280);
      const h = Math.round(w * (img.height || 720) / (img.width || 1280));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      // darken the headline zone so text pops
      const zone = ctx.createLinearGradient(0, h, 0, h * 0.45);
      zone.addColorStop(0, "rgba(0,0,0,0.55)");
      zone.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = zone;
      ctx.fillRect(0, 0, w, h);
      // headline (stroked + filled, brand display font)
      const lines = headline.split("\n");
      const fs = Math.round(w * (lines.length > 1 ? 0.105 : 0.125));
      const pad = Math.round(w * 0.05);
      ctx.font = `700 ${fs}px "Space Grotesk", "Arial Black", sans-serif`;
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = w * 0.018;
      ctx.shadowOffsetY = w * 0.005;
      let y = h - pad - (lines.length - 1) * fs * 0.98;
      lines.forEach((ln) => {
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = fs * 0.13;
        ctx.strokeText(ln, pad, y);
        ctx.fillStyle = "#fff";
        ctx.fillText(ln, pad, y);
        y += fs * 0.98;
      });
      ctx.shadowColor = "transparent";
      // emoji badge, top-right
      ctx.font = `${Math.round(w * 0.105)}px serif`;
      ctx.textBaseline = "top";
      const em = "🔥";
      ctx.fillText(em, w - ctx.measureText(em).width - pad * 0.7, pad * 0.55);
      ctx.textBaseline = "alphabetic";
      // brand-gradient frame
      const rootStyle = getComputedStyle(document.documentElement);
      const ga = rootStyle.getPropertyValue("--grad-a").trim() || "#ff4d6d";
      const gb = rootStyle.getPropertyValue("--grad-b").trim() || "#b14dff";
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, ga); grad.addColorStop(1, gb);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(6, w * 0.009);
      const inset = ctx.lineWidth / 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, w * 0.018);
      else ctx.rect(inset, inset, w - inset * 2, h - inset * 2);
      ctx.stroke();
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// one enhanced variant as a selectable card with its own BEFORE/AFTER toggle
function VariantThumbCard({ variant, before, raw, selected, onSelect, onReplace, topPick }) {
  const [view, setView] = useStateR("after");
  const after = view === "after";
  const ViewPill = ({ id, label }) => (
    <button onClick={(e) => { e.stopPropagation(); setView(id); }} className="mono" style={{
      fontSize: 9.5, letterSpacing: "0.06em", padding: "5px 10px", borderRadius: 999, cursor: "pointer",
      border: "none", background: view === id ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.45)",
      color: view === id ? "#111" : "rgba(255,255,255,0.85)", fontWeight: 600 }}>{label}</button>
  );
  return (
    <SelectCard selected={selected} onClick={onSelect} style={{ overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <ThumbPreview thumb={{ img: after ? variant.img : raw, tag: after ? variant.tag : "ORIGINAL" }} />
        <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 5, zIndex: 3 }}>
          <ViewPill id="before" label="BEFORE" />
          <ViewPill id="after" label="AFTER" />
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
          <span className="mono" style={{ fontSize: 10.5, padding: "4px 9px", borderRadius: 6, background: "var(--surface-2)", color: "var(--muted)", letterSpacing: "0.04em" }}>{variant.chip}</span>
          {topPick
            ? <span className="mono" style={{ fontSize: 9.5, color: "var(--win)", letterSpacing: "0.08em", fontWeight: 600 }}>★ HIGHEST CTR</span>
            : <button onClick={(e) => { e.stopPropagation(); onReplace(); }} className="mono" style={{
                fontSize: 10, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>Replace</button>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <RatingBar label="CTR power" value={after ? variant.ctr : before.ctr} icon="🎯" />
          <RatingBar label="Standout" value={after ? variant.contrast : before.contrast} icon="✨" />
        </div>
        <div className="mono" style={{ fontSize: 10, color: after ? "var(--win)" : "var(--muted)", marginTop: 11, lineHeight: 1.5 }}>
          {after ? `▲ +${variant.ctr - before.ctr} CTR · ${variant.edits}` : "original — toggle AFTER to see the edit"}
        </div>
      </div>
    </SelectCard>
  );
}

function UploadThumbCard({ userThumb, setUserThumb, selectedKey, onSelect, title }) {
  const [busy, setBusy] = useStateR(false);
  const [stepIdx, setStepIdx] = useStateR(0);
  const [rawPreview, setRawPreview] = useStateR(null);
  const inputRef = useRefR(null);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result;
      setRawPreview(raw); setBusy(true); setStepIdx(0); setUserThumb(null);
      const iv = setInterval(() => setStepIdx((s) => Math.min(s + 1, ENHANCE_STEPS.length - 1)), ENHANCE_TICK);
      enhanceImage(raw)
        .then((graded) => composeGraphics(graded, headlineFrom(title)).then((graphics) => ({ graded, graphics })))
        .then(({ graded, graphics }) => {
          setTimeout(() => {
            clearInterval(iv);
            const base = 84 + (f.size % 5);
            setBusy(false);
            setUserThumb({
              raw,
              before: { ctr: 56 + (f.size % 9), contrast: 58 + (f.size % 8) },
              variants: {
                grade: { img: graded, ctr: base, contrast: 88 + (f.size % 5), tag: "COLOR GRADE", chip: "Color grade only",
                  edits: "contrast +16% · color +45% · focus vignette" },
                graphics: { img: graphics, ctr: Math.min(97, base + 5 + (f.size % 3)), contrast: 92 + (f.size % 4), tag: "GRADE + GRAPHICS", chip: "Grade + graphics",
                  edits: "grade + bold headline · 🔥 badge · accent frame" },
              },
            });
            onSelect("user-graphics");
          }, ENHANCE_STEPS.length * ENHANCE_TICK + 200);
        });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const fileInput = <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />;

  // — empty: upload prompt —
  if (!userThumb && !busy) {
    return (
      <button onClick={() => inputRef.current && inputRef.current.click()} style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
        minHeight: 280, padding: 24, borderRadius: "var(--r-lg)", cursor: "pointer",
        border: "1.5px dashed var(--border)", background: "var(--surface)", color: "var(--text)", textAlign: "center" }}>
        <div style={{ width: 46, height: 46, borderRadius: 999, background: "var(--surface-2)", display: "grid", placeItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>
        </div>
        <div className="display" style={{ fontSize: 16, fontWeight: 600 }}>Upload your thumbnail</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>PNG / JPG · we'll auto-edit it<br />for contrast, color & click-through</div>
        {fileInput}
      </button>
    );
  }

  // — busy: enhancement pass —
  if (busy) {
    return (
      <div style={{ borderRadius: "var(--r-lg)", border: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
        <style>{`@keyframes rankr-scan { 0% { left: -34%; } 100% { left: 100%; } }`}</style>
        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", background: "var(--bg-2)" }}>
          {rawPreview && <img src={rawPreview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7) saturate(0.85)" }} />}
          <div style={{ position: "absolute", top: 0, bottom: 0, width: "34%", left: "-34%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            animation: "rankr-scan 1.1s linear infinite" }} />
        </div>
        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--accent)", boxShadow: "0 0 7px var(--accent)" }} />
            {ENHANCE_STEPS[stepIdx]}
          </span>
          <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ width: `${((stepIdx + 1) / ENHANCE_STEPS.length) * 100}%`, height: "100%", background: "var(--grad)", borderRadius: 20, transition: "width 0.4s" }} />
          </div>
        </div>
      </div>
    );
  }

  // — done: two enhanced options, each selectable —
  const replace = () => inputRef.current && inputRef.current.click();
  return (
    <React.Fragment>
      <VariantThumbCard variant={userThumb.variants.graphics} before={userThumb.before} raw={userThumb.raw}
        selected={selectedKey === "user-graphics"} onSelect={() => onSelect("user-graphics")} topPick onReplace={replace} />
      <VariantThumbCard variant={userThumb.variants.grade} before={userThumb.before} raw={userThumb.raw}
        selected={selectedKey === "user-grade"} onSelect={() => onSelect("user-grade")} onReplace={replace} />
      {fileInput}
    </React.Fragment>
  );
}

function ThumbStep({ thumbs, selected, onSelect, count, userThumb, setUserThumb, title }) {
  const shown = thumbs.slice(0, Math.min(count, thumbs.length));
  return (
    <div>
      <StepHead step={2} total={5} eyebrow="THUMBNAIL" title="Choose a thumbnail concept"
        sub="Pick an AI-composed concept — or upload your own and RANKR will auto-edit it for contrast, color and click-through." />
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {shown.map((th, i) => {
          const sel = selected === i;
          return (
            <SelectCard key={th.id} selected={sel} onClick={() => onSelect(i)} style={{ overflow: "hidden" }}>
              <ThumbPreview thumb={th} />
              <div style={{ padding: "14px 16px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="mono" style={{ fontSize: 10.5, padding: "4px 9px", borderRadius: 6, background: "var(--surface-2)", color: "var(--muted)", letterSpacing: "0.04em" }}>{th.chip}</span>
                  {i === 0 && <span className="mono" style={{ fontSize: 9.5, color: "var(--win)", letterSpacing: "0.08em", fontWeight: 600 }}>★ HIGHEST CTR</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <RatingBar label="CTR power" value={th.ctr} icon="🎯" />
                  <RatingBar label="Standout" value={th.contrast} icon="✨" />
                </div>
              </div>
            </SelectCard>
          );
        })}
        <UploadThumbCard userThumb={userThumb} setUserThumb={setUserThumb} selectedKey={selected} onSelect={onSelect} title={title} />
      </div>
    </div>
  );
}

// ---------- STEP 3: DESCRIPTION ----------
function DescStep({ desc, opts, setOpts, title }) {
  const [copied, setCopied] = useStateR(false);
  const tagLine = "#ramen #ramenrecipe #homemaderamen #cooking #12minutemeals";
  const full = [
    desc.intro,
    opts.chapters ? "\n⏱ CHAPTERS\n" + DESC_CHAPTERS.join("\n") : "",
    opts.links ? "\n🔗 Full written recipe + gear: rankr.studio/ramen\n📸 Instagram: @yourhandle" : "",
    opts.cta ? "\n👉 Subscribe for a new 12-minute recipe every week!" : "",
    opts.hashtags ? "\n" + tagLine : "",
  ].filter(Boolean).join("\n");

  const copy = () => { navigator.clipboard?.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 1600); };

  const Toggle = ({ k, label }) => (
    <Pill active={opts[k]} onClick={() => setOpts({ ...opts, [k]: !opts[k] })}>{opts[k] ? "✓ " : ""}{label}</Pill>
  );

  return (
    <div>
      <StepHead step={3} total={5} eyebrow="DESCRIPTION" title="Build your description"
        sub="The first two lines drive search ranking and the 'show more' click. Toggle blocks on or off — everything updates live." />
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 18 }}>
        <Toggle k="chapters" label="Timestamps" />
        <Toggle k="links" label="Links" />
        <Toggle k="cta" label="Subscribe CTA" />
        <Toggle k="hashtags" label="Hashtags" />
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: "1px solid var(--border)" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em" }}>YOUTUBE DESCRIPTION · {full.length} chars</span>
          <Button kind="ghost" size="sm" onClick={copy}>{copied ? "✓ Copied" : "Copy"}</Button>
        </div>
        <pre style={{ margin: 0, padding: "20px 18px", fontFamily: '"DM Sans", sans-serif', fontSize: 14.5, lineHeight: 1.62,
          color: "var(--text)", whiteSpace: "pre-wrap", maxHeight: 380, overflowY: "auto" }}>{full}</pre>
      </div>
    </div>
  );
}

// ---------- STEP 4: TAGS ----------
function TagStep({ tags, picked, toggle }) {
  return (
    <div>
      <StepHead step={4} total={5} eyebrow="TAGS & KEYWORDS" title="Lock in your keywords"
        sub="We pre-selected the strongest mix. 📈 marks tags the algorithm is favoring right now. Aim for 8–12 relevant tags." />
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
          <span style={{ color: picked.length >= 8 ? "var(--win)" : "var(--accent)", fontWeight: 600, fontSize: 15 }}>{picked.length}</span> selected
        </span>
        <div style={{ flex: 1, minWidth: 120, height: 5, background: "var(--surface-2)", borderRadius: 20, overflow: "hidden", maxWidth: 200 }}>
          <div style={{ width: `${Math.min(100, picked.length / 12 * 100)}%`, height: "100%", background: "var(--grad)", borderRadius: 20, transition: "width 0.3s" }} />
        </div>
        <span className="mono" style={{ fontSize: 11.5, color: picked.length >= 8 ? "var(--win)" : "var(--muted)" }}>
          {picked.length >= 8 ? "✓ Strong keyword coverage" : `add ${8 - picked.length} more for best reach`}
        </span>
      </div>
      <div className="stagger" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {tags.map((tag, i) => {
          const on = picked.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)} style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 15px", borderRadius: 12,
              border: `1.5px solid ${on ? "transparent" : "var(--border)"}`,
              background: on ? "var(--grad)" : "var(--surface)", color: on ? "#fff" : "var(--text)",
              boxShadow: on ? "0 6px 18px -10px var(--accent)" : "none", transition: "all 0.16s", cursor: "pointer" }}>
              {tag.trending && <span style={{ fontSize: 11 }}>📈</span>}
              <span style={{ fontSize: 14, fontWeight: 500 }}>{tag.t}</span>
              <span className="mono" style={{ fontSize: 10, opacity: 0.7 }}>{tag.vol}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- STEP 5: RANK / REVIEW ----------
function RankStep({ score, breakdown, title, thumb, tagCount, onRestart, onExport }) {
  return (
    <div>
      <StepHead step={5} total={5} eyebrow="RANK SCORE" title="Your video is publish-ready"
        sub="Here's how your optimized package scores against the ranking model — and what it could do in its first 30 days." />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 18 }}>
          {/* score card */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 26, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
            <ScoreRing score={score} size={150} live />
            <div className="display" style={{ fontSize: 19, fontWeight: 600, marginTop: 16 }}>
              {score >= 85 ? "🚀 Primed to blow up" : score >= 70 ? "💪 Strong & ready" : "📈 Solid start"}
            </div>
            <div className="mono" style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
              Est. first-30-day reach<br /><span className="grad-text" style={{ fontSize: 21, fontWeight: 700 }}>{predictReach(score)} views</span>
            </div>
          </div>
          {/* breakdown */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 26, boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>SIGNAL BREAKDOWN</div>
            <RatingBar label="Click-through" value={breakdown.ctr} icon="🎯" />
            <RatingBar label="Searchability" value={breakdown.seo} icon="🔍" />
            <RatingBar label="Watch-time" value={breakdown.watch} icon="⏱" />
            <RatingBar label="Trend align" value={breakdown.trend} icon="🔥" />
          </div>
        </div>
        {/* package summary */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 22, boxShadow: "var(--shadow-lg)" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 16 }}>YOUR PACKAGE</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            {thumb && <div style={{ width: 150, flexShrink: 0 }}><ThumbPreview thumb={thumb} /></div>}
            <div style={{ flex: "1 1 240px", minWidth: 200 }}>
              <div className="display" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{title}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
                {tagCount} keywords selected · description optimized<br />{VIDEO.duration} · {VIDEO.res}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button kind="primary" size="lg" onClick={onExport}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy package
          </Button>
          <Button kind="ghost" size="lg" onClick={onRestart}>↺ Analyze another</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TitleStep, ThumbStep, DescStep, TagStep, RankStep });
