# Getting Started with RANKR Implementation

## Quick Summary

You have received a complete high-fidelity design specification for **RANKR**, a YouTube video optimization studio. The bundle includes:

1. **README.md** — Comprehensive design spec with layout, components, interactions, design tokens, state management, and implementation notes
2. **RANKR.html** — Fully functional HTML prototype (can be opened in any browser to see the design in action)
3. **Source files** (app.jsx, screens.jsx, result-steps.jsx, components.jsx, data.jsx, tweaks-panel.jsx) — React components that power the prototype

## What to Do

### Step 1: Review the Design
1. Open `RANKR.html` in your browser
2. Click through the flow: upload → analyzing → 5-step wizard
3. Try uploading a thumbnail (will simulate enhancement)
4. Toggle themes using the Tweaks panel (top-right)
5. Review the README.md for detailed specifications

### Step 2: Understand the Architecture
- **app.jsx**: State machine, scoring logic, phase management
- **screens.jsx**: Upload and Analyzing screens
- **result-steps.jsx**: The 5-step wizard components + thumbnail upload handler
- **components.jsx**: Reusable UI building blocks (Button, Pill, SelectCard, ScoreRing, etc.)
- **data.jsx**: Static data (titles, descriptions, thumbnails, tags, themes)

### Step 3: Set Up in Your Target Framework
- If **React/Next.js**: Copy component structure and adapt to your build setup
- If **Vue/Svelte**: Translate hooks to equivalent patterns
- If **native (iOS/Android/Flutter)**: Use README.md as your spec, build from scratch

### Step 4: Implement in Order
1. **Layout & Navigation**: Build the page shell, step indicators, phase transitions
2. **Upload Screen**: File input, drag-drop zone
3. **Analyzing Screen**: Progress ring animation
4. **Step 1 (Titles)**: Card selection, styling
5. **Step 2 (Thumbnails)**: AI concept cards + upload handler
   - *Note: This is the most complex step — canvas image enhancement*
6. **Step 3 (Description)**: Toggle-driven text composition
7. **Step 4 (Tags)**: Multi-select with progress feedback
8. **Step 5 (Rank)**: Score display + package summary
9. **Tweaks Panel**: Theme switcher, tone/count selection
10. **Animations & Polish**: Transitions, hover states, copy feedback

### Step 5: Wire Backend
Replace static data with API calls:
- Title generation
- Description generation
- Tag recommendations
- Thumbnail enhancement (or use provided canvas version as fallback)

---

## Key Implementation Details

### Thumbnail Enhancement (Most Complex)
The prototype includes **real canvas-based image processing**:
- `enhanceImage(src)` — Applies color grading (contrast, saturation, brightness, vignette)
- `composeGraphics(src, headline)` — Layers text, emoji, and frame on top
- Two variants generated (grade only, grade + graphics)

You can either:
1. **Keep this as-is** in your implementation (good for MVP)
2. **Move to backend** (recommended for production — faster, more flexible)

### Scoring Algorithm
```
ctr = (title.ctr + thumb.ctr) / 2
seo = (title.seo + (tags_count * 6 + 46)) / 2
watch = 64 + (chapters?10:0) + (cta?6:0) + (links?4:0) + (thumb.ctr>88?6:0)
trend = (title.trend + (trending_tags_ratio * 100)) / 2
overall = ctr*0.35 + seo*0.25 + watch*0.15 + trend*0.25
```

This is already implemented in `app.jsx` — just adapt the data sources.

### Theming
All colors are CSS custom properties. The prototype switches themes by updating `--grad-a`, `--grad-b`, `--accent`, etc. in the root style. Your implementation should do the same (or use CSS-in-JS equivalents).

---

## Common Pitfalls to Avoid

1. **Don't copy the HTML directly.** It's a prototype. Use it as a reference, not source code.
2. **Canvas enhancement is slow.** Consider web workers or server-side processing for real deployments.
3. **Clipboard copy may fail on some browsers.** Add a fallback UI (show the text for manual copy).
4. **Mobile responsiveness.** The prototype uses `clamp()` for responsive type — make sure your implementation handles small screens.
5. **Accessibility.** Add ARIA labels, keyboard navigation, alt text. The prototype is visual-first; production needs to be accessible.

---

## Questions?

Refer to the README.md for:
- **"What does [component] do?"** → See "Screens / Views" section
- **"What colors should I use?"** → See "Design Tokens" section
- **"How does [interaction] work?"** → See "Interactions & Behavior" section
- **"What state do I need?"** → See "State Management" section

Good luck! 🚀
