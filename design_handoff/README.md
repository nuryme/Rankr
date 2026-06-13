# Handoff: RANKR — YouTube Video Optimization Studio

## Overview

RANKR is a multi-step wizard that helps video creators optimize their YouTube metadata before publishing. Users upload a video, and the tool generates AI-optimized titles, thumbnails, descriptions, and tags — each scored against a ranking model. The app includes a custom thumbnail upload feature that auto-edits images with color grading and composited graphics to maximize click-through rates.

**Key features:**
- 5-step results wizard (Title → Thumbnail → Description → Tags → Rank Score)
- AI-generated option selection (4 titles, 4 thumbnail concepts, description toggles)
- Custom thumbnail upload with live image enhancement (2 variants: color grade only, grade + graphics)
- Rank score calculation weighted across CTR, searchability, watch-time, and trend alignment
- Clipboard copy of optimized package (title, description, tags) ready for YouTube Studio
- Theme switching (Sunset, Forest, Midnight, etc.) via tweaks panel
- Tone/style selection (punchy, balanced, professional) affecting copy

## About the Design Files

The files in this bundle are **design references created in HTML** — a high-fidelity prototype showing intended look, behavior, and interactions. **Do not copy the HTML directly into your codebase.** Instead, use these files and this README as a specification to:

1. Recreate the UI in your target framework (React, Vue, Next.js, etc.) using your codebase's established patterns and libraries
2. Implement the state machine and scoring logic in your target language/runtime
3. Wire real image processing (canvas-based enhancement) where the prototype uses synthetic implementations
4. Connect to real backend APIs for title/tag/description generation (the prototype uses static data)

## Fidelity

**High-fidelity (hifi)** — Pixel-perfect mockups with final colors, typography, spacing, and interactions. The developer should recreate the UI pixel-for-pixel using the target framework's styling system, matching the design tokens listed below.

## Screens / Views

### Screen 1: Upload (Entry Point)

**Purpose:** User uploads a video file (MP4/MOV) to begin the optimization flow.

**Layout:**
- Full viewport, centered content
- Heading + subheading (max-width ~640px)
- Large drag-and-drop zone: 48px top margin, 48px padding, border-radius var(--r-xl), dashed border 2px var(--border)
- Drag state: border becomes accent color, background lightens
- Text inside: "Drop your video here or click to upload · MP4 / MOV · we'll analyze everything"

**Components:**
- `<h1>` "RANKR — Launch Studio" (Space Grotesk, 48px, 700, -0.02em letter-spacing)
- `<p>` subheading (DM Sans, 16px–19px clamp, muted color, 1.55 line-height)
- Drag zone button with file input (cursor: pointer on hover, background: var(--surface) → slightly lighter on drag)

**Interactions:**
- Click or drag-drop to trigger file picker
- On file select: show analyzing screen (2–3 second simulated progress bar, then advance to results)
- No validation needed (prototype assumes valid MP4)

---

### Screen 2: Analyzing (Loading State)

**Purpose:** Show progress while "analyzing" the video (in reality, this would call an API; prototype simulates with a timed progress bar).

**Layout:**
- Full viewport, centered
- Large animated progress ring (150px diameter, stroke 8px, gradient fill)
- Percentage text inside ring (21px, 700 weight, colored text)
- Heading below: "Analyzing your video…" (26px, 700)
- File name + duration (11.5px mono, muted)
- Checklist of analysis steps (each with a checkmark icon as it completes)

**Components:**
- ScoreRing component (animated countup from 0 to ~100, SVG stroke-dasharray animation)
- Step list with checkmark icons (✓ emoji or icon)
- Last step remains in-progress state (hollow circle instead of checkmark)

**Interactions:**
- Automatically advances to results screen after ~3 seconds
- Progress bar ticks every ~90ms, completes at 100%

---

### Screen 3: Results Wizard — Steps 1–5

All 5 steps share a common layout:

**Layout:**
- Top nav: 5 numbered step indicators (01 02 03 04 05), inline, each clickable and showing check mark when done
- Heading + subheading for the current step
- Main content area (varies per step, see below)
- Bottom footer: "← Back" button (left), "Next · [Step Name] →" button (right), Rank Score chip (center-right)

**Typography for all step headers:**
- Eyebrow: 11px mono, muted, 0.1em letter-spacing
- Title: 32px Space Grotesk, 700, -0.02em letter-spacing
- Subtitle: 15px–19px DM Sans, muted color, 1.55 line-height

---

#### Step 1: Title Selection

**Purpose:** Choose from 4 AI-generated title options.

**Layout:**
- Stagger animation on cards (fade in with slight delay per card)
- Each title card: 18px vertical padding, 20px horizontal, border-radius var(--r-lg), background var(--surface), 1px border var(--border), box-shadow var(--shadow-lg)
- Selected card: thick border (2px var(--accent)), glow effect (box-shadow: 0 6px 18px -10px var(--accent))

**Components per card:**
- Score (large, 16px, 600): color is green (var(--win)) if ≥85, else accent color
- "SCORE" label (mono, 9.5px)
- "TOP PICK" badge (mono, 9.5px, 600, pill shape, background var(--grad), color white) — on first card only
- Title text (display class, 19px, 600, 1.25 line-height, -0.01em letter-spacing)
- Est. reach (mono, 11px, muted): "📈 Est. reach [23K–39K] views · 30 days"
- Rating bars (3 bars for CTR power, Search, Trend fit; each shows icon + label + bar + numeric value)

**Interactions:**
- Click a card to select it (triggers re-scoring of downstream steps)
- Hover state: background slightly lighter

**State:**
- `titleSel`: selected index (0 by default)
- Scores computed from TITLES array in data.jsx (ctr, seo, trend values)

---

#### Step 2: Thumbnail Selection

**Purpose:** Choose from 4 AI-composed thumbnail concepts OR upload and edit a custom thumbnail.

**Layout:**
- Auto-fill grid: `gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))"`, gap: 16px
- First 4 cards: AI concepts (read-only)
- 5th card (or area): Upload card (always present)

**AI Concept Cards:**
- Thumbnail preview (16/9 aspect ratio, 280px wide)
  - Background: gradient + photo placeholder stripes (subtle diagonal pattern)
  - Headline text (white, uppercase, bold, shadow, responsive font size via clamp)
  - Badge emoji (top-right, 22px font, drop-shadow)
  - Shot description (bottom, 9px mono, rgba(255,255,255,0.62))
- Below preview: chip label, CTR/Standout rating bars
- "★ HIGHEST CTR" badge on first card (mono, 9.5px, color var(--win))
- Selected state: thick gradient border

**Upload Card (Initial State — No Image):**
- Dashed border (1.5px var(--border)), border-radius var(--r-lg), min-height 280px, padding 24px
- Icon: upload arrow in circle (46px circle, background var(--surface-2), centered)
- Heading: "Upload your thumbnail" (16px, 600)
- Subheading: "PNG / JPG · we'll auto-edit it for contrast, color & click-through" (11px mono, muted)
- Clickable (cursor: pointer)

**Upload Card (Busy State — Enhancing):**
- Show uploaded image (darkened, ~0.7 brightness, 0.85 saturation) with a scanning animation overlay
- Progress bar below with current step text (11.5px mono, muted)
- Each step: "Analyzing composition…", "Boosting contrast & clarity…", "Punching color saturation…", "Adding focus vignette…", "Composing headline & graphics…", "Scoring against the feed…"
- Animates over ~3s total

**Upload Card (Done State — Two Variant Options):**
- Two cards displayed side-by-side, each showing a thumbnail edit option

**Grade + Graphics Variant (Top Pick):**
- Card border: 2px gradient (thick, selected by default)
- Preview area with BEFORE/AFTER toggle (two pills, top-right)
  - Shows composited image: image with darkened headline zone, white stroked headline text pulled from title, 🔥 emoji badge (top-right), brand gradient frame
- Chip: "Grade + graphics" (10.5px mono)
- Badge: "★ HIGHEST CTR" (9.5px, var(--win))
- Rating bars: CTR power, Standout (values jump on AFTER view)
- Description: "▲ +[5–7] CTR · grade + bold headline · 🔥 badge · accent frame" (10px mono, var(--win))

**Color Grade Only Variant:**
- Card border: 1px var(--border) (not selected by default)
- Same BEFORE/AFTER structure
  - AFTER image shows: contrast+16%, color +45%, brightness+5%, vignette
- Chip: "Color grade only"
- No badge
- Rating bars with lower scores than graphics variant
- Description: "▲ +[2–4] CTR · contrast +16% · color +45% · focus vignette" (10px mono, var(--win))

**Both variant cards:**
- Subtext on BEFORE view: "original — toggle AFTER to see the edit"
- Replace button (BEFORE & AFTER toggle pills): "Replace" (underlined, mono, 10px, muted) — re-opens file picker

**Interactions:**
- Click variant card to select (triggers re-score)
- Toggle BEFORE/AFTER to compare
- Click Replace to upload a different image (resets flow, runs enhancement again)

**State:**
- `userThumb`: { raw, before: {ctr, contrast}, variants: {grade, graphics} } or null
- `thumbSel`: 0–3 (AI concept index) or "user-grade" or "user-graphics"

---

#### Step 3: Description Builder

**Purpose:** Customize the video description by toggling optional sections.

**Layout:**
- Toggle pill buttons at top (4 pills): "Timestamps", "Links", "Subscribe CTA", "Hashtags"
- Large text box below showing the composed description (max-height 380px, overflow-y auto, monospace font DM Sans)
- Copy button in header of text box (right side)

**Components:**
- Pill buttons (active state: background var(--grad), color white; inactive: background var(--surface), color var(--text))
- Text box header: "YOUTUBE DESCRIPTION · [char count]" (11px mono, muted) + "Copy" button (ghost style, 11px mono)
- Textarea showing composed text (14.5px, 1.62 line-height, color var(--text), white-space pre-wrap)
- Copy button feedback: shows "✓ Copied" for 1.6s on click

**Interactions:**
- Click pill to toggle section on/off
- Description updates live (no delay)
- Click Copy to copy full description to clipboard (via navigator.clipboard)

**State:**
- `descOpts`: { chapters: bool, links: bool, cta: bool, hashtags: bool }
- Composed description built from `DESCRIPTIONS[tone]` + toggles

---

#### Step 4: Tags & Keywords

**Purpose:** Select 8–12 keywords from a curated list.

**Layout:**
- Counter and progress bar at top
- "You have [N] selected" (12px, color changes to var(--win) when ≥8)
- Progress bar (5px height, background var(--surface-2), filled width proportional to count/12)
- Subtext: "✓ Strong keyword coverage" or "add [N] more for best reach"
- Flex-wrap layout of tag buttons below (gap 10px)

**Components per tag:**
- Button: inline-flex, align-items center, gap 8px, padding 10px 15px, border-radius 12px
- Inactive: border 1.5px var(--border), background var(--surface), color var(--text)
- Active: border transparent, background var(--grad), color white, box-shadow 0 6px 18px -10px var(--accent)
- Content: [optional 📈 emoji] + tag text (14px, 500) + volume (10px mono, opacity 0.7)
- Transition: all 0.16s

**State:**
- `tagsSel`: array of selected indices
- Default: indices [0, 1, 2, 3, 6, 7, 8, 11] (8 tags pre-selected)
- Toggle on click

---

#### Step 5: Rank Score & Package Summary

**Purpose:** Show the final optimization score and the complete package ready to copy.

**Layout:**
- Two-column grid: left = score card + breakdown, right = package summary
- Score ring: 150px diameter, animated countup to final score (85–97 typical)
- Breakdown: 4 signal bars (CTR power, Searchability, Watch-time, Trend align) with colors and values
- Package card: thumbnail preview (150px wide) + title + metadata + buttons

**Components:**

**Score Card:**
- Score ring (animated, 150px, SVG with gradient stroke)
- Text below ring (19px, 600, var(--text)): emoji + descriptor (e.g., "🚀 Primed to blow up")
- Est. reach (mono, 12.5px, muted): "Est. first-30-day reach"
- Big number (21px, 700, color-mix/grad): "[23K–39K] views"

**Breakdown Card:**
- Label: "SIGNAL BREAKDOWN" (11px mono, muted, 0.1em letter-spacing)
- 4 rating bars, stacked vertically, gap 16px each

**Package Summary Card:**
- Label: "YOUR PACKAGE" (11px mono, muted)
- Flex layout: thumbnail (150px, flex-shrink 0) + text (flex 1, min 200px)
- Thumbnail: ThumbPreview component showing selected thumbnail with tag
- Title (17px, 600, 1.3 line-height)
- Metadata (12px mono, muted): "[N] keywords selected · description optimized\n[duration] · [resolution]"

**Buttons (Below package):**
- "Copy package ▸" (primary, large): copies title + description + tags to clipboard, shows modal
- "↺ Analyze another" (ghost, large): resets to upload screen

**Interactions:**
- Buttons: click handlers for copy and restart
- Score ring: animated countup from 0 to final value (500ms duration, ease)

**Modal on Copy:**
- Overlay (fixed, inset 0, z-index 100, backdrop blur)
- Centered card (max-width 420px, padding 38px 34px, border-radius var(--r-xl))
- Icon: 📋 (52px)
- Heading: "Package copied" (26px, 700, mono)
- Message: "Your title, description and tags — scoring a [Rank Score] — are on your clipboard. Paste them into YouTube Studio when you upload."
- Package preview: quoted title text in a box (14px, 600)
- Buttons: "Optimize another" (primary) + "Close" (ghost)

**State:**
- `score`: { overall, ctr, seo, watch, trend } (computed real-time from selections)
- Modal shown when exported/published button clicked

---

## Interactions & Behavior

### Navigation & State Flow

1. **Upload** → file selected → **Analyzing** (progress bar) → **Results** (Step 1: Title)
2. **Step N** → Click "Next" → **Step N+1**
3. **Step N** → Click step indicator → Jump directly to that step
4. **Step 5** → Click "Copy package" → Show modal
5. **Modal** → Click "Close" or click overlay → Dismiss modal
6. **Any step** → Click "↺ Start over" or "Analyze another" → Back to **Upload**

### Animation Details

- **Slide in on step change:** fade-in 0.35s ease on step content
- **Card selection:** 0.16s transition (border, shadow, background)
- **Progress ring:** countup animation over 500ms, cubic-bezier(0.2, 0.8, 0.3, 1) easing
- **Thumbnail enhancement scanning:** scan overlay moves left to right, 1.1s linear infinite animation, 34% width, positioned absolutely
- **Progress bar:** width transition 0.4s ease on each step tick
- **Modal entrance:** fade-in 0.25s on overlay, pop-in 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) on modal card
- **Disabled/reduced motion:** respect `@media (prefers-reduced-motion: no-preference)` for animations

### Form Behavior

- **No validation errors** (prototype assumes valid inputs)
- **Description toggles:** live preview update (no debounce needed)
- **Tag selection:** no limit enforced, but UI shows feedback at 8+ selected
- **Theme/tone tweaks:** real-time CSS variable updates and re-scoring

### Copy to Clipboard

When user clicks "Copy package":
1. Build text: `TITLE\n[title text]\n\nDESCRIPTION\n[full description]\n\nTAGS\n[tag1, tag2, ...]`
2. `navigator.clipboard.writeText(text)`
3. Show success modal for 1.6s (auto-dismiss) or until user closes

### Thumbnail Upload & Enhancement

1. File input triggers FileReader
2. Raw image converted to DataURL
3. **Enhancement pass (sequential):**
   - Show "busy" card with progress steps
   - Step 0: "Analyzing composition…" 
   - Step 1–5: Various enhancements, each showing for ~520ms
4. **In parallel (real implementation would be async):**
   - `enhanceImage(raw)`: Apply canvas filters (contrast 1.16, saturate 1.45, brightness 1.05, radial vignette)
   - `composeGraphics(enhanced, headline)`: Draw onto enhanced image: darkened zone at bottom, white stroked headline text (Space Grotesk bold), 🔥 emoji badge, brand gradient frame
5. Two variants generated: one stops at enhance, one continues to graphics
6. After ~3s total, dismiss busy card and show two variant option cards
7. User selects one → triggers re-score

### Scoring Algorithm

```
Base values from selected title + thumbnail:
  ctr = (title.ctr + thumb.ctr) / 2
  seo = (title.seo + (tags_count * 6 + 46)) / 2
  watch = 64 + (chapters ? 10 : 0) + (cta ? 6 : 0) + (links ? 4 : 0) + (thumb.ctr > 88 ? 6 : 0)
  trend = (title.trend + (trending_tags_ratio * 100)) / 2

Final score (weighted):
  overall = ctr * 0.35 + seo * 0.25 + watch * 0.15 + trend * 0.25
```

---

## State Management

### Top-level App State (app.jsx)

```javascript
const [phase, setPhase] = useState('upload'); // 'upload' | 'analyzing' | 'results'
const [step, setStep] = useState(0); // 0–4 (step index)

// Selections
const [titleSel, setTitleSel] = useState(0);
const [thumbSel, setThumbSel] = useState(0); // 0–3 or "user-grade" or "user-graphics"
const [descOpts, setDescOpts] = useState({ chapters: true, links: true, cta: true, hashtags: true });
const [tagsSel, setTagsSel] = useState([0, 1, 2, 3, 6, 7, 8, 11]); // array of indices
const [userThumb, setUserThumb] = useState(null); // uploaded thumbnail data

// UI state
const [exported, setExported] = useState(false); // show copy modal
```

### Derived State

```javascript
const titles = TITLES[tone] || TITLES.balanced; // array of 4 title options
const title = titles[titleSel]?.text;
const thumb = (typeof thumbSel === 'string' && userThumb)
  ? userThumb.variants[thumbSel === 'user-grade' ? 'grade' : 'graphics']
  : THUMBS[thumbSel];

const score = useMemo(() => {
  // See scoring algorithm above
  return { overall, ctr, seo, watch, trend };
}, [titleSel, thumbSel, descOpts, tagsSel, userThumb]);
```

### Tweaks State (persisted via tweaks-panel)

```javascript
const tweaks = {
  theme: 'Sunset', // 'Sunset' | 'Forest' | 'Midnight' | ...
  tone: 'balanced', // 'punchy' | 'balanced' | 'professional'
  count: 4, // number of options shown per step (1–4)
};
```

---

## Design Tokens

### Colors

All colors defined as CSS custom properties (theme-switched via tweaks):

**Sunset theme (default):**
```css
--grad-a: #ff4d6d
--grad-b: #b14dff
--grad-c: #7a4aff
--accent: #ff4d6d
--text: #ffffff
--muted: rgba(255, 255, 255, 0.65)
--muted-2: rgba(255, 255, 255, 0.4)
--border: rgba(255, 255, 255, 0.1)
--surface: rgba(255, 255, 255, 0.05)
--surface-2: rgba(255, 255, 255, 0.08)
--bg: #0a0e27
--bg-2: #1a1f3a
--win: #4ade80 (or similar green)
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.3)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
```

**Other themes (Forest, Midnight, etc.):** Swap --grad-a, --grad-b, --accent colors accordingly.

### Spacing

```css
--gap-xs: 8px
--gap-sm: 12px
--gap-md: 16px
--gap-lg: 20px
--gap-xl: 24px
--gap-2xl: 32px
```

Use `gap` property in flex/grid layouts; avoid margin on siblings.

### Typography

**Font families:**
- Display (headings, titles): Space Grotesk, 400/500/600/700 weights
- Body (paragraphs, UI text): DM Sans, 400/500/600/700 weights, opsz 9..40
- Monospace (code, metadata, labels): JetBrains Mono, 400/500/600 weights

**Type scale (no fixed classes, use contextual sizing):**
- `clamp(16px, 2.2vw, 19px)` — paragraph text, responsive
- `11px` — labels, mono eyebrows
- `12px–14.5px` — metadata, description preview
- `16px–19px` — step titles, body text
- `21px` — big numbers (score estimate)
- `26px` — modal headings
- `32px` — step headings
- `48px` — main page heading

**Line heights:**
- `1.3` — titles
- `1.55` — body text
- `1.6–1.7` — descriptions, long-form
- `1` — compact labels

**Letter spacing:**
- `normal` — body text
- `-0.02em` — headings (tighter)
- `-0.01em` — titles (slightly tighter)
- `0.04em` — small labels
- `0.06em` — mono toggles
- `0.08em` — badges
- `0.1em` — eyebrow labels

### Border Radius

```css
--r-md: 8px     /* small components, pills */
--r-lg: 12px    /* cards, inputs */
--r-xl: 16px    /* large containers */
--r-full: 999px /* circles */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.3)
--shadow-glow: 0 6px 18px -10px var(--accent)
```

---

## Assets

### Images / Placeholders
- Thumbnail previews: Use subtle striped pattern overlays (CSS repeating-linear-gradient at 135°, transparent + rgba white at 4.5% opacity)
- No external image assets needed for core UI
- Emoji used: 🚀 🔥 🎯 🔍 ⏱ 📈 👀 ✅ 📋 and others (inline text)

### Icons
- All icons use inline SVG or emoji
- Examples:
  - Upload arrow: `<svg width="20" height="20"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`
  - YouTube logo (on publish button): YouTube SVG path (standard YouTube icon)
  - Close button: ✕ or simple X path

---

## Files in This Bundle

- `RANKR.html` — Main bundled HTML file with all inline styles and scripts (reference for overall layout)
- `app.jsx` — Top-level React component, state machine, scoring logic
- `screens.jsx` — Upload and Analyzing screen components
- `result-steps.jsx` — Step 1–5 wizard components (TitleStep, ThumbStep, DescStep, TagStep, RankStep)
- `components.jsx` — Reusable UI components (Button, RatingBar, Pill, ScoreRing, SelectCard, StepHead, etc.)
- `data.jsx` — Static data (TITLES, DESCRIPTIONS, THUMBS, TAGS, THEMES)
- `tweaks-panel.jsx` — Tweaks panel for theme/tone/count selection (ready-made starter component)

---

## Implementation Notes

### Setup in Target Framework

1. **If using React/Next.js:**
   - Use this structure as-is, but move files to proper source directories
   - Replace inline Babel transpilation with your build tool (Webpack, Vite, etc.)
   - Wire tweaks persistence to localStorage or URL query params
   - For canvas image enhancement, wrap the canvas operations in utility functions or Web Workers for better performance

2. **If using Vue/Svelte/other framework:**
   - Translate React hooks (useState, useMemo, useRef, useEffect) to framework equivalents
   - Keep the component hierarchy and prop structure similar
   - Adapt CSS (use CSS Modules, scoped styles, or a CSS-in-JS library as appropriate)

3. **Backend Integration (not in prototype):**
   - `/api/titles` — POST video metadata, GET array of 4 title options
   - `/api/descriptions` — POST selections, GET optimized description text
   - `/api/tags` — GET curated tag list with trending indicators
   - `/api/thumbnail-enhance` — POST image file, GET enhanced variants

4. **Performance:**
   - Canvas operations (image enhancement) can be slow; consider web workers or server-side processing
   - Memoize score recalculation (already done via useMemo in prototype)
   - Lazy-load thumbnail previews if displaying many at once

5. **Accessibility:**
   - Add `aria-labels` to icon-only buttons
   - Ensure form inputs have associated labels
   - Test keyboard navigation (tab through steps, buttons)
   - Provide alt text for generated thumbnail previews

6. **Mobile Responsiveness:**
   - The prototype uses `clamp()` and responsive typography
   - Adjust grid column widths for small screens
   - Ensure touch targets are ≥44px
   - Test on mobile devices

---

## Questions for Developer

Before starting implementation, clarify with the product owner:

1. **Backend:** Where will title, description, and tag generation come from? (OpenAI API, custom ML model, static recommendations?)
2. **File upload:** Should actual video files be validated? Scanned for metadata? Or is this just a UI demo?
3. **Thumbnail generation:** Is the canvas-based enhancement good enough, or should thumbnails be processed server-side?
4. **Persistence:** Should user selections and generated packages be saved to a database? Or ephemeral (just for this session)?
5. **Publishing:** Should "Copy package" actually integrate with YouTube API, or stay as a clipboard copy?
6. **Theming:** Should themes be selectable from tweaks, or pulled from user account settings?

