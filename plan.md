RANKR — Week 1 MVP Implementation Plan

Context

The planning docs (CLAUDE.md, FRONTEND.md, BACKEND.md, GEMINI_API.md, DESIGN_QUICK_REF.md, DEPLOYMENT.md, ROLES.md, PRODUCTION_ROADMAP.md) have all been rewritten to describe RANKR's final architecture: a personal-use, no-payment YouTube optimization tool built on Next.js 14 + Tailwind + shadcn/ui, with a two-stage Gemini 2.0 Flash pipeline (Stage 1 vision: frames → {description, thumbnailFrameIndices}; Stage 2 text: description → {titles[4], description, tags[], overallScore}) and a 5-step results wizard.

However, no code exists yet — no package.json, no app/, not a git repo. This plan covers the "Week 1 MVP" scope: scaffolding the project from scratch and implementing PRODUCTION_ROADMAP.md Prompts 1-9 (Upload → frame extraction → Gemini pipeline → wizard shell → all 5 step components, without canvas thumbnail enhancement, which is Week 2's Prompt 10).

A design_handoff/ folder contains stale-but-visually-useful JSX mockups. We'll port structural/visual patterns (SelectCard glow, ScoreRing countup, StepHead layout, stagger-fade animations, drag-zone structure) but explicitly avoid the stale logic (tone-weighted scoring, RatingBar, description toggle pills, tweaks panel, multi-variant thumbnails, payment framing).

Source of truth for styling: DESIGN_QUICK_REF.md's CSS variable values (Sunset theme: --grad-a:#ff4d6d, --grad-b:#b14dff, --grad-c:#7a4aff, --accent:#ff4d6d, --bg:#0a0e27, --bg-2:#1a1f3a, --text:#ffffff, --muted:rgba(255,255,255,.65), --muted-2:rgba(255,255,255,.4), --border:rgba(255,255,255,.1), --surface:rgba(255,255,255,.05), --surface-2:rgba(255,255,255,.08), --win:#4ade80, radii --r-md:8px/--r-lg:12px/--r-xl:16px/--r-full:999px, gaps --gap-xs:8px … --gap-2xl:32px). The design_handoff/RANKR.html mockup uses different (oklch-based) colors — do not use those.

---
design_handoff/: Port vs Avoid

Port (restyle as TSX + Tailwind + CSS vars per DESIGN_QUICK_REF numbers):
- components.jsx → Button variants, SelectCard selected/glow logic, StepHead layout, ScoreRing countup mechanism (drop "live"/RANK SCORE label, static score only)
- screens.jsx → Upload drag-drop zone structure (icon circle, border states) — drop hero/marketing copy
- RANKR.html → keyframe shapes for fade/stagger/glow/countup (rename per CLAUDE.md conventions)

Avoid entirely (stale):
- data.jsx (tone-keyed content, ctr/seo/trend numbers, hardcoded THEMES)
- RatingBar, ThumbPreview, "TOP PICK" badges, reach predictions
- tweaks-panel.jsx (tone/theme/count tweak UI)
- Description toggle pills (descOpts), live score recomputation, ExportModal payment framing

---

.env.local:
GOOGLE_GEMINI_API_KEY=AIza...
NEXT_PUBLIC_URL=http://localhost:3000

Install deps:
npm install @google/generative-ai
npx shadcn@latest init    # note: "shadcn" not "shadcn-ui" (renamed package); CSS variables = Yes, tsx = Yes
npx shadcn@latest add button card dialog

Folder skeleton:
mkdir -p app/components/steps app/components/ui app/utils app/styles lib

Verify: npm run dev → default Next.js page loads at localhost:3000, no TS/Tailwind errors.

---
PROMPT 1: Project Setup + Upload Screen

- app/styles/globals.css — Tailwind directives + :root block with every CSS var from DESIGN_QUICK_REF (Sunset theme) + keyframes fadeIn, slideUp, glow, countup, staggerFadeIn (ported from RANKR.html, renamed). body { background: var(--bg); color: var(--text); }
- app/layout.tsx — load Space Grotesk / DM Sans / JetBrains Mono via next/font/google as CSS vars; import globals.css; minimal <html><body>{children}</body></html>, no nav chrome
- app/components/Upload.tsx — props onFileAccepted(file); H1 "RANKR" + subheading; dashed drag-drop zone (border→accent on drag-over, radius --r-xl, padding 48px/32px mobile); hidden file input wrapped in <label>; below zone, privacy note: "Frames from your video are sent to Google's Gemini API for analysis. Nothing is uploaded to or stored on a server." plus 10min/300MB limits text
  - validateFile(file): reject non-mp4/mov, reject >300MB, load into hidden <video> and check duration > 600 → reject with inline error message; on valid file call onFileAccepted
- app/page.tsx — "use client" root state machine: phase ('upload'|'analyzing'|'results', default 'upload'), step (default 0), videoFile. Also declare (typed, unused for now) analysisProgress, analysisResult, generatedContent, titleSel, thumbSel, tagsSel, userThumb, theme per FRONTEND.md shape. phase==='upload' → <Upload>; 'analyzing' → placeholder div; 'results' → null

Verify: / shows Upload directly; drag-over highlights border; oversized/long file shows inline error and stays on upload; valid file flips to 'analyzing' placeholder; responsive at 480/768/1024px.

---
PROMPT 2: Frame Extraction + Analyzing Screen

- app/utils/frames.ts — extractFrames(videoFile: File): Promise<string[]>. Off-screen <video> via URL.createObjectURL, on loadedmetadata pick 8 evenly-spaced timestamps between 0.5 and duration-0.5; for each, set currentTime, await seeked, draw to 480px-wide <canvas>, toDataURL('image/jpeg', 0.7), strip data:image/jpeg;base64, prefix; revoke object URL in finally. Returns 8 raw base64 strings.
- app/components/Analyzing.tsx — "use client", props videoFile, onComplete({frames, analysis, generated}). State phase: 'extracting'|'analyzing'|'generating'|'error', errorMsg. Centered layout: heading, filename, 3-item checklist (pending/spinner/✓) using staggerFadeIn/fadeIn. On error: show message + "Try Again". runPipeline() on mount:
  - extracting → extractFrames(videoFile)
  - analyzing → stub: 1s delay → {description:'placeholder', thumbnailFrameIndices:[0,1,2,3]}
  - generating → stub: 1s delay → {titles:[...4], description:'placeholder', tags:[...], overallScore:80}
  - try/catch per stage → phase='error'
- app/page.tsx — 'analyzing' → <Analyzing videoFile={videoFile!} onComplete={...}/>; onComplete sets analysisResult/generatedContent, setPhase('results'); 'results' → temporary <pre>{JSON.stringify(generatedContent)}</pre>

Verify: real short video → frames.length === 8, no data: prefix; checklist progresses through all 3 phases; lands on stubbed JSON; no console errors.

---
PROMPT 3: Gemini Two-Stage API Integration

Implement exactly per GEMINI_API.md (code already fully specified there) and BACKEND.md (validation functions already fully specified there):

- lib/gemini.ts — genAI/getModel('gemini-2.0-flash'), analyzeFrames(frames) (Stage 1 prompt + image parts → JSON-extract → validate description/thumbnailFrameIndices), generateContent(description) (Stage 2 prompt → JSON-extract → validate titles/description/tags/overallScore). No mock fallback — throw on failure.
- app/api/analyze/route.ts — validateAnalyzeInput (frames non-empty array, ≤12, all strings) → analyzeFrames → validateAnalyzeResponse; 400 on bad input, 500 on failure.
- app/api/generate/route.ts — validateGenerateInput (description non-empty string) → generateContent → validateGenerateResponse (titles/tags non-empty arrays, 0<=overallScore<=100).
- app/utils/api-client.ts — fetchAnalysis(frames), fetchGeneration(description) per BACKEND.md's API Client Pattern (throw Error(error.error) on non-OK).
- app/components/Analyzing.tsx — replace stubs with fetchAnalysis/fetchGeneration; track lastFailedStage so "Try Again" only re-runs the failed stage (cached frames/analysis reused); error message = err.message.

Verify: curl -X POST localhost:3000/api/generate -d '{"description":"A 10-minute vlog about a day trip to a mountain town."}' returns valid {titles[4], description, tags, overallScore}; real video upload shows real Gemini calls in Network tab; bad API key → error phase with useful message + working "Try Again"; Stage 2 retry doesn't re-call /api/analyze; no frame-data logging.

---
PROMPT 4: Results Wizard Shell + Navigation + State

- app/components/ui/StepHead.tsx — props eyebrow/title/subtitle; eyebrow 11px mono uppercase muted, title 32px Space Grotesk 700 (clamp(28px,4vw,32px)), subtitle 15-19px DM Sans muted 1.55lh. Port layout from components.jsx StepHead, fix sizes to DESIGN_QUICK_REF.
- app/components/ui/ThemeSelector.tsx — Sunset/Forest/Midnight pills; on click set --grad-a/-b/-c/--accent via document.documentElement.style.setProperty, persist to localStorage (rankr-theme). Forest/Midnight palettes: pick complementary dark-theme colors (greens / blues-indigos) consistent with --bg.
- app/components/ResultsWizard.tsx — receives step, setStep, analysisResult, generatedContent, all selection state+setters, theme state. Header: 5 numbered step indicators (clickable, aria-current="step", ✓ on completed). Content: switch on step renders TitleStep|ThumbnailStep|DescriptionStep|TagsStep|RankStep. Footer: "← Back" (hidden on step 0) / "Next →" (hidden/disabled on step 4 — Export is Prompt 9). Fade/slide transition on step change.
- app/components/steps/*.tsx — 5 placeholder components, each wrapped in <StepHead> with correct eyebrow/title/subtitle, rendering raw data (titles as <p>, frames as <img>, description in <pre>, tags joined, score as text).
- app/page.tsx — finalize state: tagsSel defaults to all generatedContent.tags via useEffect when generated content first arrives; theme read from localStorage on mount. 'results' → <ResultsWizard ...all state+setters />.

Verify: pipeline → wizard; 5 indicators navigate correctly with real data per step; Back/Next hide appropriately; theme change updates CSS vars live and persists across reload (analysis/generated data does NOT persist — resets to upload on reload); mobile indicators wrap cleanly.

---
PROMPT 5: Title Step

- app/components/ui/SelectCard.tsx — props title, isSelected, onSelect. Padding 18/20px, border 1px --border → 2px --accent + glow (box-shadow: 0 6px 18px -10px var(--accent)) when selected, radius --r-lg, bg --surface, hover lighten. Just title text, no scores/badges. role="button", tabIndex, aria-pressed, keyboard Enter/Space. Port selected-state logic from components.jsx SelectCard, drop checkmark badge.
- app/components/steps/TitleStep.tsx — <StepHead eyebrow="STEP 01" title="Choose Your Title" .../>; grid grid-cols-1 md:grid-cols-2 gap-4; map generatedContent.titles → <SelectCard isSelected={titleSel===i} onSelect={()=>setTitleSel(i)}/> with 75ms stagger fade-in.

Verify: 4 real titles render staggered; only one selectable at a time with accent border+glow; mobile stacks 1-column; Next → step 2.

---
PROMPT 6: Thumbnail Step

- app/components/ui/ThumbnailCard.tsx — props imageSrc, isSelected, onSelect, alt?. aspect-video, min-width 280px, object-cover, border --border/radius --r-lg; selected → 2px gradient border + glow. role="button", aria-pressed, keyboard accessible, alt text.
- app/components/steps/ThumbnailStep.tsx — <StepHead eyebrow="STEP 02" .../>; grid repeat(auto-fill, minmax(280px,1fr)) gap 16px. For each idx in analysisResult.thumbnailFrameIndices → <ThumbnailCard imageSrc={data:image/jpeg;base64,${analysisResult.frames[idx]}} isSelected={thumbSel===idx} onSelect={()=>{setThumbSel(idx); setUserThumb(null);}}/>. Plus a final "upload your own" card (dashed border, 46px icon, hidden <input type="file" accept="image/*"> in <label>); on select → setUserThumb(file), setThumbSel(-1) (sentinel for custom), preview via object URL.

Verify: real AI-picked frames render (compare visually to source video); clicking a frame selects it (clears custom); custom upload selects it (clears frame selection); mobile grid adapts.

---
PROMPT 7: Description Step

- app/utils/clipboard.ts — copyToClipboard(text): Promise<boolean> via navigator.clipboard.writeText, try/catch → bool.
- app/components/steps/DescriptionStep.tsx — <StepHead eyebrow="STEP 03" .../>; read-only whitespace-pre-wrap block (--surface bg, --border, --r-lg, padding 16, scroll if long) showing generatedContent.description; shadcn <Button> "Copy" → copyToClipboard, flash "✓ Copied!" 1.5s.

Verify: real description renders with paragraph breaks; Copy flashes confirmation and clipboard contents match exactly; mobile no overflow.

---
PROMPT 8: Tags Step

- app/components/ui/TagPill.tsx — props label, isSelected, onToggle. Unselected: border --border, transparent. Selected: bg --accent, white bold text. 11px mono, radius --r-full. role="button", aria-pressed, keyboard accessible. Port Pill structure from components.jsx, drop trending/emoji.
- app/components/steps/TagsStep.tsx — <StepHead eyebrow="STEP 04" .../>; "Selected: X of Y" label; flex-wrap gap-8px of TagPills from generatedContent.tags, isSelected={tagsSel.includes(tag)}. toggleTag (defined in app/page.tsx, passed down): setTagsSel(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]).

Verify: all tags shown, all selected by default (per Prompt 4's useEffect); toggling updates count and visual state both ways; mobile wraps correctly.

---
PROMPT 9: Rank Step + Export

- app/components/ui/ScoreRing.tsx — props score: number. 150px SVG, 8px stroke, gradient --grad-a→--grad-c (or 3-stop with --grad-b). useEffect+rAF countup of displayed number and strokeDashoffset 0→score over ~1.5s on mount (port useCountUp from components.jsx, adjust to 1500ms). Centered 21px Space Grotesk 700 text. aria-label="Overall score: {score} out of 100".
- app/components/ui/ExportPackage.tsx — props title, description, tags. --surface box, 12px mono, renders TITLE\n{title}\n\nDESCRIPTION\n{description}\n\nTAGS\n{tags.join(', ')}. "Copy All" button → copyToClipboard; success → "✓ Copied! Paste in YouTube Studio" flash; failure → shadcn <Dialog> with <textarea readOnly> fallback.
- app/components/steps/RankStep.tsx — <StepHead eyebrow="STEP 05" .../>, <ScoreRing score={generatedContent.overallScore}/>, <ExportPackage title={generatedContent.titles[titleSel]} description={generatedContent.description} tags={tagsSel}/>.

Verify: score ring animates 0→overallScore once; changing title selection on step 1 and returning to step 5 updates export title but not the score number; "Copy All" produces correct TITLE/DESCRIPTION/TAGS text reflecting current selections; clipboard-unavailable path shows dialog fallback.

---
End-to-End Verification (after Prompt 9)

1. npm run dev, visit localhost:3000
2. Drop a real short video (<2 min)
3. Watch Analyzing run extracting → analyzing → generating with real Gemini calls
4. Step through wizard 1-5, confirming real AI content at each step (titles, frames, description, tags, score)
5. Test Copy on steps 3 and 5
6. Switch theme, refresh — theme persists, pipeline data resets to upload
7. Check responsiveness at 375/480/768/1024px
8. Confirm no base64 frame dumps in console

---
Critical Reference Files

- PRODUCTION_ROADMAP.md, GEMINI_API.md, BACKEND.md, FRONTEND.md, DESIGN_QUICK_REF.md (already fully specify code patterns above)
- design_handoff/components.jsx (SelectCard/ScoreRing/StepHead/Button porting)
- design_handoff/screens.jsx (Upload drag-zone structure)