# FRONTEND Patterns & Components

**For: Building UI, components, styling, state management**

---

## Component Structure

### Hierarchy
```
App (state machine: phase, step, selections)
├── Upload (phase: "upload", root "/")
├── Analyzing (phase: "analyzing")
└── ResultsWizard (phase: "results")
    ├── StepNav (5 indicators)
    ├── [Dynamic Step Component]
    └── StepFooter (Back | Next)
```

### Step Components
- `TitleStep.tsx` — 4 SelectCard components (AI-generated titles)
- `ThumbnailStep.tsx` — 4 ThumbnailCard (real AI-picked frames, canvas-enhanced) + custom upload
- `DescriptionStep.tsx` — single AI-generated description block + copy
- `TagsStep.tsx` — multi-select pills
- `RankStep.tsx` — overall score display + export

---

## State Management Pattern

```typescript
// App-level state (useState only — no Redux, no Context yet)
const [phase, setPhase] = useState<"upload" | "analyzing" | "results">("upload");
const [step, setStep] = useState(0);

// Pipeline state
const [videoFile, setVideoFile] = useState<File | null>(null);
const [analysisProgress, setAnalysisProgress] = useState<
  "extracting" | "analyzing" | "generating" | "error"
>("extracting");
const [analysisResult, setAnalysisResult] = useState<{
  frames: string[];               // base64 JPEGs extracted client-side
  description: string;            // Stage 1 output
  thumbnailFrameIndices: number[]; // Stage 1 output
} | null>(null);
const [generatedContent, setGeneratedContent] = useState<{
  titles: string[];
  description: string;
  tags: string[];
  overallScore: number;
} | null>(null);

// Wizard selections
const [titleSel, setTitleSel] = useState(0);
const [thumbSel, setThumbSel] = useState(0);
const [tagsSel, setTagsSel] = useState<string[]>([]);
const [userThumb, setUserThumb] = useState<File | null>(null);
const [theme, setTheme] = useState<"sunset" | "forest" | "midnight">("sunset");
```

**No Redux. No Context API needed (yet). Just hooks.**

`generatedContent.overallScore` is a static number from Stage 2 — it does not
recompute when the user changes selections. It's displayed as-is on the final
step.

---

## Styling Approach

### CSS Variables (Theme-Switchable)
```css
/* Root element */
--grad-a: #ff4d6d
--grad-b: #b14dff
--accent: #ff4d6d
--text: #ffffff
--bg: #0a0e27
--win: #4ade80
--gap-xs: 8px
--gap-md: 16px
--r-lg: 12px
/* ...more in DESIGN_QUICK_REF.md */
```

### Tailwind + CSS Variables
```tsx
// Use Tailwind classes + CSS var fallbacks
<div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)]">
  <h1 className="text-[var(--text)] font-bold">Title</h1>
</div>
```

### No Custom CSS (Except Animations)
- Use Tailwind for layout/spacing/colors
- Use CSS variables for theme switching
- Custom CSS only for animations (globals.css)

---

## Reusable Components (shadcn/ui)

Install and use:
- `Button` — All buttons
- `Card` — Container cards
- `Input` — Form inputs
- `Select` — Dropdowns
- `Tabs` — If needed
- `Dialog` — Modals

**Don't build custom components.** Copy from shadcn/ui.

---

## Component Patterns

### SelectCard Pattern (Titles)
```typescript
interface SelectCardProps {
  title: string;
  isSelected: boolean;
  onSelect: () => void;
}

// Styling:
// - Unselected: border 1px var(--border), bg var(--surface)
// - Selected: border 2px var(--accent), glow effect
// - Hover: bg slightly lighter
```

No per-item scores or badges — Stage 2 returns 4 plain title strings. The
user picks the one they like best.

### ThumbnailCard Pattern (Thumbnails)
```typescript
interface ThumbnailCardProps {
  frameSrc: string;     // base64 JPEG from analysisResult.frames
  enhancedSrc: string;  // canvas-enhanced version (see DESIGN_QUICK_REF.md)
  isSelected: boolean;
  onSelect: () => void;
}

// Shows the enhanced version by default, with a BEFORE/AFTER toggle
// (see DESIGN_QUICK_REF.md "Enhancement Toggle").
```

### Step Container Pattern
```tsx
<div className="max-w-4xl mx-auto px-6 py-8">
  <StepHead eyebrow="STEP 01" title="Choose Title" subtitle="..." />
  {/* Step-specific content */}
  <StepFooter step={step} setStep={setStep} />
</div>
```

---

## Typography System

| Use | Font | Size | Weight | Notes |
|-----|------|------|--------|-------|
| Page heading | Space Grotesk | 48px | 700 | `clamp(40px, 5vw, 48px)` |
| Step heading | Space Grotesk | 32px | 700 | `clamp(28px, 4vw, 32px)` |
| Body | DM Sans | 16px | 400 | Use 1.55 line-height |
| Mono labels | JetBrains Mono | 11px | 400 | 0.1em letter-spacing |
| Badges | JetBrains Mono | 9.5px | 600 | Pill-shaped, 0.08em spacing |

**Always use `clamp()` for responsive typography.**

---

## Animation Patterns

### Stagger Fade (Cards Appearing)
```css
@keyframes staggerFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Apply with nth-child delays */
.card:nth-child(1) { animation: staggerFadeIn 0.4s ease-out 0s; }
.card:nth-child(2) { animation: staggerFadeIn 0.4s ease-out 0.075s; }
.card:nth-child(3) { animation: staggerFadeIn 0.4s ease-out 0.15s; }
.card:nth-child(4) { animation: staggerFadeIn 0.4s ease-out 0.225s; }
```

### Glow Effect (Selected Cards)
```css
box-shadow: 0 6px 18px -10px var(--accent);
transition: box-shadow 0.2s ease-out;
```

### Analyzing Progress
The Analyzing screen reflects **real** pipeline state (`analysisProgress`),
not a fixed timer. Map each phase to a step in a progress indicator:

```
"extracting" → "Extracting frames from video..."
"analyzing"  → "Analyzing video content..."
"generating" → "Generating titles, tags & description..."
"error"      → show error + "Try Again" button
```

---

## Responsive Design

### Breakpoints (Tailwind defaults)
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Mobile-First Rules
```
- Touch targets: ≥44px (buttons, cards)
- Grid columns: min-width 160px on desktop, 140px mobile
- Padding: Use clamp() or responsive gaps
- Typography: Always use clamp()
- Don't assume viewport width
```

### Example: Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stacks on mobile, 4 columns on desktop */}
</div>
```

---

## Loading & Error States

### Loading Spinner
```tsx
<div className="animate-spin">
  <svg>...</svg>
</div>
```

### Error Message + Retry
```tsx
<div className="bg-red-100 text-red-800 p-4 rounded space-y-2">
  <p>Failed to analyze video.</p>
  <Button onClick={retryCurrentPhase}>Try Again</Button>
</div>
```

### Success Toast
```tsx
<div className="bg-[var(--win)] text-white p-3 rounded animate-pulse">
  ✓ Copied to clipboard!
</div>
```

---

## Accessibility Checklist

- [ ] Buttons have visible text or `aria-label`
- [ ] Form inputs have `<label>` elements
- [ ] Step indicators: `aria-current="step"` on active
- [ ] Color contrast passes WCAG AA (check with DevTools)
- [ ] Keyboard navigation works (Tab through all interactive elements)
- [ ] Modals can be closed with Escape key
- [ ] Images have `alt` text

---

## File Organization

```
app/components/
├── Upload.tsx                  # Upload screen (root "/")
├── Analyzing.tsx                # Real-progress pipeline screen
├── ResultsWizard.tsx            # 5-step container
│
├── steps/
│   ├── TitleStep.tsx
│   ├── ThumbnailStep.tsx
│   ├── DescriptionStep.tsx
│   ├── TagsStep.tsx
│   └── RankStep.tsx
│
├── ui/
│   ├── Button.tsx              # shadcn
│   ├── Card.tsx                # shadcn
│   ├── SelectCard.tsx          # custom, reusable (titles)
│   ├── ThumbnailCard.tsx        # custom (frames + canvas enhancement)
│   ├── ScoreRing.tsx            # SVG progress ring (overall score)
│   ├── StepHead.tsx             # step header
│   └── ThemeSelector.tsx        # theme switcher (Sunset/Forest/Midnight)
```

---

## When to Create vs Import

| Need | Action |
|------|--------|
| Button, card, form | Import shadcn/ui |
| Custom selection card | Create SelectCard.tsx |
| SVG progress ring | Create ScoreRing.tsx |
| Theme switcher | Create ThemeSelector.tsx |
| Plain div container | Just use Tailwind classes |

---

## Performance Tips

- Use `useMemo` for expensive derived values (e.g. canvas-enhanced thumbnail variants)
- Memoize components that re-render often (step cards)
- Avoid creating objects/functions in render
- Use `useState` for UI state, not server state
- Lazy load step components if bundle gets large (optional)

---

**Reference this when building UI. Pair with DESIGN_QUICK_REF.md for exact colors/spacing.**
