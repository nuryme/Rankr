# RANKR Design Quick Reference

**Use this instead of full README.md — saves ~20KB tokens**

---

## Color System (CSS Variables)

### Color Palette
```css
--grad-a: #ff4d6d
--grad-b: #b14dff
--grad-c: #7a4aff
--accent: #ff4d6d (pink, primary action)
--text: #ffffff
--muted: rgba(255, 255, 255, 0.65)
--muted-2: rgba(255, 255, 255, 0.4)
--border: rgba(255, 255, 255, 0.1)
--surface: rgba(255, 255, 255, 0.05)
--surface-2: rgba(255, 255, 255, 0.08)
--bg: #0a0e27 (dark bg)
--bg-2: #1a1f3a (secondary bg)
--win: #4ade80 (success/green)
```

---

## Typography (No CSS Classes — Use Inline Sizing)

| Use Case | Font | Size | Weight | Letter-spacing |
|----------|------|------|--------|-----------------|
| Page heading | Space Grotesk | 48px | 700 | -0.02em |
| Step heading | Space Grotesk | 32px | 700 | -0.02em |
| Step subtitle | DM Sans | 15-19px | 400 | normal |
| Body text | DM Sans | 16px | 400 | normal |
| Mono label | JetBrains Mono | 11px | 400 | 0.1em |
| Badge/pill | JetBrains Mono | 9.5px | 600 | 0.08em |
| Score number | Space Grotesk | 21px | 700 | -0.01em |

**Line heights:** 1.3 (titles), 1.55 (body), 1.6-1.7 (long-form)

---

## Spacing

```
--gap-xs: 8px
--gap-sm: 12px
--gap-md: 16px
--gap-lg: 20px
--gap-xl: 24px
--gap-2xl: 32px
--r-md: 8px (border-radius)
--r-lg: 12px
--r-xl: 16px
--r-full: 999px (pills)
```

---

## Key Component Specs

### SelectCard (Title Options)
- Padding: 18px vertical, 20px horizontal
- Border: 1px var(--border), radius var(--r-lg)
- Background: var(--surface)
- Selected: 2px solid var(--accent) border + glow (box-shadow: 0 6px 18px -10px var(--accent))
- Hover: background slightly lighter
- Just the title text — no scores, no badges

### ScoreRing (Overall Score)
- SVG circle, 150px diameter, 8px stroke
- Animated countup: 0 → `overallScore` on mount of the final step
- Gradient fill (--grad-a to --grad-c)
- Text centered inside: 21px, 700 weight

### Button Styles
- Default: 1px border var(--border), transparent bg, var(--text) text
- Hover: bg var(--surface), border var(--border)
- Active: scale(0.98)
- Disabled: opacity 0.5
- Primary (Next, Copy): bg var(--accent), border var(--accent), white text

### ThumbnailCard (Real Frame Previews)
- 16:9 aspect ratio, 280px wide (responsive grid)
- Background: the actual video frame (base64 JPEG from `analysisResult.frames`),
  canvas-enhanced by default (see "Enhancement" below)
- Border: 1px var(--border), radius var(--r-lg)
- Selected: 2px gradient border
- BEFORE/AFTER toggle in the top-right corner (see below)

### Upload Zone
- Dashed 2px var(--border) border
- Padding: 48px top, 48px sides
- Border-radius: var(--r-xl)
- Hover: border becomes var(--accent), bg slightly lighter
- Icon: 46px circle, bg var(--surface-2)
- Below the zone: inline privacy note — "Frames from your video are sent to
  Google's Gemini API for analysis. Nothing is stored." + size/duration limits
  (10 min / 300MB)

---

## Animations & Interactions

| Element | Animation | Duration | Trigger |
|---------|-----------|----------|---------|
| Result cards | Fade in + stagger | 75ms delay per card | Step enters |
| Overall score ring | Countup 0→score | 1.5 seconds | Rank step enters |
| Selected card | Glow pulse | Continuous | Card selected |
| Hover state | Bg lighten | Instant | Mouse enter |
| Copy feedback | Flash green | 1.5 seconds | Copy clicked |
| Analyzing progress | Step-by-step reveal | Real (driven by pipeline) | Each phase completes |

---

## Layout Patterns

### Upload Screen
- Centered content, max-width ~640px
- Heading + subheading above drag zone
- Drag zone: full width with padding
- This is the root screen (`/`) — no landing page before it

### Results Wizard
- Top nav: 5 numbered step indicators (01 02 03 04 05), clickable
- Current step heading + subheading
- Main content area (step-specific)
- Footer: ← Back | Next → (overall score only appears on step 5)

### Thumbnail Grid (Step 2)
- Grid: `repeat(auto-fill, minmax(280px, 1fr))`, gap 16px
- 4 real AI-picked video frames (canvas-enhanced) + upload card (always visible)
- Upload card: dashed border initially, shows image + enhancement animation when a custom image is dropped

### Tag Selection (Step 4)
- Multi-select toggle pills
- Layout: grid, gap 8px
- Selected: bg var(--accent), white text
- Unselected: transparent, border var(--border)

---

## Important Details

### Thumbnails: BEFORE/AFTER Toggle
- Two pill buttons: "BEFORE" | "AFTER"
- Top-right of preview
- BEFORE: original frame (or original upload), text "original — toggle AFTER to see the edit"
- AFTER: enhanced image (color graded, or color graded + headline graphics)
- Toggle shows/hides image, swaps text

### Enhancement Steps (Animate)
Runs on the 4 AI-picked frames AND on any custom upload:
1. "Analyzing composition…"
2. "Boosting contrast & clarity…"
3. "Punching color saturation…"
4. "Adding focus vignette…"
5. "Composing headline & graphics…"

Total animation time: ~2-3 seconds

### Grade + Graphics Variant (Thumbnail)
- Darkened headline zone at bottom
- White stroked headline text (3px stroke), drawn from the selected title (Step 1)
- Accent gradient frame border

### Color Grade Only Variant
- Contrast +16%
- Color saturation +45%
- Brightness +5%
- Vignette (darkened edges)

### Step Titles (All Steps)
- Eyebrow: 11px mono, muted, 0.1em letter-spacing
- Main title: 32px Space Grotesk, 700, -0.02em
- Subtitle: 15-19px DM Sans, muted, 1.55 line-height

---

## Responsive / Mobile

- Use `clamp()` for typography: `clamp(16px, 2.2vw, 19px)`
- Grid breakpoints: shrink to 1 column below 480px
- Touch targets: min 44px
- Upload zone: reduce padding on mobile (32px instead of 48px)
- Thumbnail grid: min-width drop to 200px on mobile

---

## Accessibility Essentials

- Step nav: `aria-current="step"` on active step
- File input: wrap in `<label>` with visible text
- Buttons: always have text or `aria-label`
- Overall score: `aria-label="Overall score: 87 out of 100"`
- Selected cards: `aria-pressed="true"`

---

## File References for Full Details

See `design_handoff/RANKR.html` to:
- Open in browser and click through UI
- See exact animations/interactions live
- Reference pixel-perfect styling

`design_handoff/` mockups predate the personal-use, two-stage-Gemini
architecture (they show mock scores, toggle sections, and gradient
thumbnail placeholders). Treat them as a visual/styling reference only —
the structure described in this file and FRONTEND.md is the source of truth.

---

## Quick Checklist for Claude Code

When building each component:
- ✅ Use CSS variables for colors (never hardcode hex)
- ✅ Apply proper spacing (gap property, not margin)
- ✅ Use Tailwind + shadcn/ui, minimize custom CSS
- ✅ Add animations (stagger, glow, countup)
- ✅ Mobile-first with clamp()
- ✅ Accessibility: aria-labels, proper HTML semantics
- ✅ Error states visible (show loading spinners, error messages)
