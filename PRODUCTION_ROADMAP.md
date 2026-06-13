# RANKR Production Roadmap — Claude Code Prompts

**Timeline: 2-4 weeks, solo developer, personal-use tool (no payment, no accounts)**

---

## PRE-DEVELOPMENT (Before First Prompt)

### 1. Create Next.js Project
```bash
npx create-next-app@latest rankr --typescript --tailwind --app
cd rankr
```

### 2. Copy Your Files Into Project Root
```bash
# Copy these files from the planning folder:
cp CLAUDE.md rankr/
cp FRONTEND.md BACKEND.md GEMINI_API.md DESIGN_QUICK_REF.md rankr/
cp -r design_handoff/ rankr/
```

### 3. Create .env.local (DON'T COMMIT THIS)
```bash
# Get your key (free, no credit card) from https://aistudio.google.com/app/apikey
GOOGLE_GEMINI_API_KEY=AIza...
```

### 4. Install Required Packages
```bash
npm install @google/generative-ai
npx shadcn-ui@latest init
```

### 5. Verify Setup
```bash
npm run dev
# Visit http://localhost:3000, should see Next.js default page
```

**✅ Stop here. Don't code yet. Ready for Prompt 1.**

---

## WEEK 1: CORE PIPELINE + WIZARD (Days 1-7)

### PROMPT 1: Project Setup + Upload Screen (Root Page)
**Duration: ~2 hours | Output: Working upload page with styling**

```
claude "I'm building RANKR, a personal YouTube optimization tool.

PROJECT CONTEXT:
- CLAUDE.md: architecture, state management, file structure
- FRONTEND.md / DESIGN_QUICK_REF.md: component patterns, visual specs, colors, typography
- Stack: Next.js 14, React 18, Tailwind CSS, shadcn/ui, Google Gemini API
- This is a personal tool: NO payment, NO accounts, NO landing page. Root '/' IS the app.

TASK: Set up the project foundation and build the Upload screen.

PART 1: PROJECT STRUCTURE
1. Create app folder structure:
   - app/layout.tsx (root layout with CSS variables)
   - app/page.tsx (THE Upload screen — this is the root, phase: 'upload')
   - app/components/ (UI components)
   - app/utils/ (utilities)
   - app/styles/globals.css (CSS variables + animations)

2. Set up CSS Variables in globals.css:
   - Define all colors from DESIGN_QUICK_REF (Sunset theme)
   - Define spacing (--gap-xs through --gap-2xl)
   - Define border-radius (--r-md through --r-full)
   - Add @keyframes for animations (fadeIn, slideUp, glow, countup, staggerFadeIn)


PART 2: UPLOAD SCREEN (app/page.tsx + components/Upload.tsx)
1. Build Upload component with:
   - H1 'RANKR' (48px Space Grotesk, 700)
   - Subheading text (16px DM Sans, muted color)
   - Large drag-drop zone:
     - Dashed 2px border (var(--border))
     - 48px top padding, 48px sides
     - Border-radius var(--r-xl)
     - Background var(--surface)
     - Text: 'Drop your video here or click to upload · MP4 / MOV · up to 10 min, 300MB'
   - File input (hidden, triggered by clicking zone)
   - Drag states: border becomes var(--accent), bg slightly lighter
   - Below the zone: an inline privacy note —
     'Frames from your video are sent to Google's Gemini API for analysis.
      Nothing is uploaded to or stored on a server.'

2. Implement drag-drop + validation logic:
   - ondrop / file input change: read the file
   - Validate type is video/mp4 or video/quicktime
   - Validate file.size <= 300 * 1024 * 1024 (300MB) — reject with inline error if too big
   - Load the file into a hidden <video> element to read .duration
     - Validate duration <= 600 seconds (10 min) — reject with inline error if too long
   - If valid: store the File in state, setPhase('analyzing')
   - If invalid: show an inline error message below the upload zone (don't change phase)

PART 3: APP STATE MACHINE (app/page.tsx)
1. Create top-level state:
   - phase: 'upload' | 'analyzing' | 'results'
   - videoFile: File | null
   - step: 0-4 (used once phase === 'results')
   - (See CLAUDE.md / FRONTEND.md 'State Management' for the full shape — most of
     it gets filled in by later prompts, just stub the fields for now)

2. Render <Upload /> when phase === 'upload'
3. When phase === 'analyzing', render a simple placeholder div for now
   (real Analyzing screen comes in Prompt 2)

PART 4: STYLING
- Use Tailwind + CSS variables
- No custom CSS except animations (globals.css)
- Match DESIGN_QUICK_REF colors exactly
- Responsive: clamp() for typography, mobile-friendly spacing
- Center content, max-width ~640px

TEST CHECKLIST:
✅ App runs on localhost:3000, root '/' shows the Upload screen directly
✅ Upload screen renders with correct styling
✅ Drag-drop zone appears with dashed border
✅ Can click and select a file
✅ Dragging over zone changes border color to accent
✅ Privacy note visible below the upload zone
✅ Selecting a video over 300MB or over 10 min shows an inline error (doesn't advance)
✅ Selecting a valid video file triggers phase change to 'analyzing'
✅ Mobile responsive (test at 480px, 768px, 1024px)

DO NOT build the real Analyzing screen or wire any APIs yet."
```

**After Prompt 1:**
- Test on localhost: http://localhost:3000
- Verify upload zone styling matches DESIGN_QUICK_REF exactly
- Try dragging a file over the zone (should see color change)
- Try a file that's too large/long (should show inline error)
- Select a valid file (should see phase change)

---

### PROMPT 2: Client-Side Frame Extraction + Analyzing Screen
**Duration: ~2 hours | Output: Real frame extraction + progress UI**

```
claude "Continue RANKR development.

TASK: Extract frames from the uploaded video client-side, and build the
Analyzing screen to show real pipeline progress (not a fixed timer).

BUILD:

1. Create utils/frames.ts:
   - Function: extractFrames(videoFile: File): Promise<string[]>
   - Implementation:
     * Create an off-screen <video> element, set src = URL.createObjectURL(videoFile)
     * Wait for 'loadedmetadata' to get video.duration
     * Pick 8 evenly-spaced timestamps across the duration (skip the very first/last
       0.5s to avoid black frames)
     * For each timestamp: seek the video (video.currentTime = t), wait for 'seeked',
       draw the current frame to a <canvas> (e.g. 480px wide, preserve aspect ratio),
       and export via canvas.toDataURL('image/jpeg', 0.7)
     * Strip the 'data:image/jpeg;base64,' prefix before returning (Gemini wants raw base64)
     * Revoke the object URL when done
   - Return: string[] (8 base64 JPEG strings, no data: prefix)

2. Create components/Analyzing.tsx:
   - Props: videoFile, onComplete(result), onError
   - Local state: phase: 'extracting' | 'analyzing' | 'generating' | 'error'
   - Layout:
     - Centered content, full viewport
     - Heading: 'Analyzing your video…' (26px, 700)
     - File name (11.5px mono, muted)
     - Checklist of 3 phases, each showing:
       - Pending: dim/grey
       - In progress: spinning icon
       - Done: ✓ checkmark (var(--win) green)
       Phases: 'Extracting frames', 'Analyzing video content', 'Generating titles, tags & description'
     - On 'error': replace checklist area with the error message + a 'Try Again' button

3. Wire the pipeline (Stage 1/2 calls are stubbed for now — real Gemini wiring is Prompt 3):
   - On mount: setPhase('extracting'), call extractFrames(videoFile)
   - Then setPhase('analyzing'), call a stub async function that resolves after ~1s
     with { description: 'placeholder', thumbnailFrameIndices: [0,1,2,3] }
   - Then setPhase('generating'), call a stub async function that resolves after ~1s
     with { titles: ['Title 1','Title 2','Title 3','Title 4'], description: 'placeholder',
            tags: ['tag1','tag2'], overallScore: 80 }
   - On success: call onComplete({ frames, analysis, generated })
   - On any error: setPhase('error'), show 'Try Again' which re-runs the failed step only

4. Wire into app/page.tsx:
   - When phase === 'analyzing', render <Analyzing videoFile={videoFile} ... />
   - On complete: store analysisResult + generatedContent in state, setPhase('results')

5. Styling:
   - Full viewport, centered content
   - Use CSS variables for colors
   - Smooth transitions between phase states (fade)
   - Mobile: layout stays centered and readable

TEST CHECKLIST:
✅ Upload a real video → Analyzing screen appears
✅ 'Extracting frames' completes (check console.log of extracted frames array — 8 base64 strings)
✅ 'Analyzing video content' completes (stub)
✅ 'Generating...' completes (stub)
✅ Auto-advances to a 'results' placeholder phase
✅ Each phase shows a checkmark when done
✅ No console errors
✅ Mobile responsive

DO NOT build the Results wizard yet. Just get the pipeline UI + frame extraction perfect."
```

**After Prompt 2:**
- Upload a real short video (under 1 min is fastest to test)
- Confirm `extractFrames` logs 8 base64 strings to console
- Watch the 3-phase checklist complete
- Verify it transitions past Analyzing afterward

---

### PROMPT 3: Gemini Two-Stage API Integration
**Duration: ~1.5 hours | Output: Real AI analysis + generation**

```
claude "Continue RANKR development.

TASK: Replace the stubbed Stage 1/2 calls in Analyzing.tsx with real Gemini API calls.

Reference GEMINI_API.md for the exact prompt templates and response shapes.

BUILD:

1. Create lib/gemini.ts:
   - Initialize Google Generative AI with GOOGLE_GEMINI_API_KEY
   - getModel(modelName = 'gemini-2.0-flash')
   - Function: analyzeFrames(frames: string[]) — Stage 1 (vision)
     * Send all frames as inlineData image parts + a prompt asking for a
       description of the video and which frame indices make good thumbnails
     * Parse JSON response: { description: string, thumbnailFrameIndices: number[] }
   - Function: generateContent(description: string) — Stage 2 (text)
     * Send the description with a prompt asking for titles/description/tags/overallScore
     * Parse JSON response: { titles: string[4], description: string, tags: string[], overallScore: number }
   - Both functions validate the parsed response and throw on malformed data
     (no mock fallback — let the caller handle the error)

2. Create app/api/analyze/route.ts:
   - POST endpoint, input: { frames: string[] }
   - Validate frames is a non-empty array (max 12)
   - Call analyzeFrames(frames), return the result as JSON
   - On error: return { error: '...' } with status 500

3. Create app/api/generate/route.ts:
   - POST endpoint, input: { description: string }
   - Call generateContent(description), return the result as JSON
   - On error: return { error: '...' } with status 500

4. Create utils/api-client.ts:
   - fetchAnalysis(frames: string[]) → calls /api/analyze
   - fetchGeneration(description: string) → calls /api/generate
   - Both throw on non-OK response with the server's error message

5. Update components/Analyzing.tsx:
   - Replace the stubbed Stage 1 call with fetchAnalysis(frames)
   - Replace the stubbed Stage 2 call with fetchGeneration(analysis.description)
   - On error in either stage: setPhase('error'), show the error message and a
     'Try Again' button that retries ONLY the failed stage:
     - If Stage 1 failed: retry fetchAnalysis(frames) (frames already extracted, don't re-extract)
     - If Stage 2 failed: retry fetchGeneration(analysis.description) (Stage 1 result already available)

TEST CHECKLIST:
✅ .env.local has a valid GOOGLE_GEMINI_API_KEY, app starts with no key errors
✅ Upload a real video → frames extracted → Stage 1 returns a real description + frame picks
✅ Stage 2 returns real titles/description/tags/overallScore based on that description
✅ DevTools Network tab shows POST /api/analyze and POST /api/generate with real JSON
✅ Temporarily break the API key → confirm the error phase shows with 'Try Again'
✅ 'Try Again' after a Stage 2 failure does NOT re-call /api/analyze
✅ No mock/fallback data appears anywhere

IMPORTANT:
- Don't log full frame arrays (base64 images) to the console — too noisy
- Free tier (15 req/min, 1.5M tokens/day) is more than enough for personal use"
```

**After Prompt 3:**
- Upload a real video and watch real Gemini output flow through
- Try an intentionally bad API key to confirm the error/retry UX works
- Confirm Stage 2 retry doesn't redo frame extraction or Stage 1

---

### PROMPT 4: Results Wizard Shell + Navigation + State
**Duration: ~1.5 hours | Output: 5-step wizard with navigation, wired to real data**

```
claude "Continue RANKR development.

TASK: Build the Results Wizard shell with 5-step navigator, and wire up the
full app state now that analysisResult/generatedContent are real.

BUILD:

1. Create components/ResultsWizard.tsx (main wrapper):
   - Header with 5 numbered step indicators (01 02 03 04 05)
     - Each inline, clickable, centered at top
     - Current step: bold, colored text (var(--accent))
     - Completed steps: show checkmark ✓
     - Clicking a step number navigates to that step
   - Step content area (conditionally render based on step prop)
   - Footer with:
     - Left: '← Back' button (hidden on step 0)
     - Right: 'Next →' button (becomes 'Export' or hidden on step 4)
   - No score chip in the footer — the overall score only appears on step 5 (RankStep)

2. Create components/StepHead.tsx (reusable step header):
   - Eyebrow (11px mono, muted, 0.1em letter-spacing): 'STEP 01'
   - Title (32px Space Grotesk, 700, -0.02em): step name
   - Subtitle (15px DM Sans, muted, 1.55 line-height): description

3. Create step placeholder components (content comes in later prompts):
   - components/steps/TitleStep.tsx — render generatedContent.titles as plain text for now
   - components/steps/ThumbnailStep.tsx — render analysisResult.frames as plain <img> for now
   - components/steps/DescriptionStep.tsx — render generatedContent.description as plain text
   - components/steps/TagsStep.tsx — render generatedContent.tags as plain text
   - components/steps/RankStep.tsx — render generatedContent.overallScore as plain text

4. Finish app-level state in app/page.tsx:
   - phase, step, videoFile, analysisResult, generatedContent (from prior prompts)
   - titleSel: number (default 0)
   - thumbSel: number (default 0)
   - tagsSel: string[] (default: all of generatedContent.tags)
   - userThumb: File | null (default null)
   - theme: 'sunset' | 'forest' | 'midnight' (default 'sunset')

5. Theme switching:
   - Create components/ui/ThemeSelector.tsx (Sunset/Forest/Midnight pills)
   - On theme change, update CSS variables on document.documentElement
     (--grad-a, --grad-b, --accent per DESIGN_QUICK_REF)
   - Persist the chosen theme to localStorage (read on mount) — this is the
     ONLY thing persisted; analysis results are never persisted

6. Wire into app/page.tsx:
   - When phase === 'results', render <ResultsWizard step={step} setStep={setStep}
     analysisResult={analysisResult} generatedContent={generatedContent} ...all selection state />
   - ResultsWizard renders the appropriate step component based on `step`

7. Navigation logic:
   - 'Back': if step > 0, setStep(step - 1)
   - 'Next': if step < 4, setStep(step + 1)
   - Clicking a step number: setStep(number)

8. Styling:
   - Match DESIGN_QUICK_REF colors and spacing
   - Step nav: flex row, gap 12px, centered
   - Footer: flex between (Back | Next)
   - Smooth transitions between steps (fade/slide up)
   - Mobile: step indicators wrap if needed

TEST CHECKLIST:
✅ After the real pipeline completes, Results wizard appears
✅ 5 step indicators visible at top (01 02 03 04 05)
✅ Current step highlighted (bold, accent color)
✅ Can click step numbers to navigate
✅ Back button hidden on step 0, Next button hidden/changed on step 4
✅ Each placeholder step shows REAL data (actual titles, frames, description, tags, score)
✅ Theme selector changes CSS variables live, persists across refresh
✅ Mobile responsive (indicators don't break)
✅ No console errors

DO NOT polish step content yet. Shell + navigation + real data wiring must be correct."
```

**After Prompt 4:**
- Run the full pipeline → land in the wizard
- Click through all 5 steps, confirm each shows real (if rough) data
- Change theme, refresh, confirm it persists
- Confirm analysis/generated data does NOT persist across a full page reload (by design)

---

### PROMPT 5: Title Step (Step 1)
**Duration: ~1 hour | Output: Styled title selection**

```
claude "Continue RANKR development.

TASK: Build Step 1 - Title Selection with styled cards, using the 4 real
titles from generatedContent.titles.

BUILD:

1. Create components/ui/SelectCard.tsx:
   - Props: title: string, isSelected: boolean, onSelect: () => void
   - Layout: title text (19px, 600 weight, 1.25 line-height), nothing else —
     no scores, no badges
   - Styling:
     - Padding: 18px vertical, 20px horizontal
     - Border: 1px var(--border), radius var(--r-lg)
     - Background: var(--surface)
     - Hover: bg slightly lighter
     - Selected: 2px solid var(--accent) border + glow (box-shadow: 0 6px 18px -10px var(--accent))

2. Update components/steps/TitleStep.tsx:
   - Render StepHead (eyebrow: 'STEP 01', title: 'Choose Your Title',
     subtitle: 'Pick the title you'll use on YouTube.')
   - Map generatedContent.titles (4 strings) → SelectCard, in a column (2x2 grid on desktop)
   - Gap between cards: var(--gap-md) = 16px
   - On card click: setTitleSel(index)

3. Animations:
   - Cards fade in with stagger (75ms delay per card) using @keyframes staggerFadeIn

4. Styling Details:
   - Match DESIGN_QUICK_REF exactly for colors, spacing, typography
   - Selected border: 2px (not 1px)

TEST CHECKLIST:
✅ Step 1 renders with correct heading
✅ 4 real AI-generated titles display as cards
✅ Cards fade in with stagger animation
✅ Clicking a card selects it (border becomes accent, glow appears)
✅ Only one card selected at a time
✅ Mobile responsive (cards stack in column)
✅ Next button navigates to Step 2

DO NOT worry about Step 2 yet."
```

**After Prompt 5:**
- Navigate to step 1, confirm 4 real titles render
- Click each card, verify selection styling
- Test mobile view

---

### PROMPT 6: Thumbnail Step (Step 2) — Real Frames + Upload Zone
**Duration: ~1.5 hours | Output: Real AI-picked frames + custom upload zone**

```
claude "Continue RANKR development.

TASK: Build Step 2 - Thumbnail Selection using the real AI-picked video
frames, plus an upload zone for a custom image. Canvas enhancement comes in
a later prompt — for now show the raw frames/upload.

BUILD:

1. Create components/ui/ThumbnailCard.tsx:
   - Props: imageSrc: string (data URL), isSelected: boolean, onSelect: () => void
   - 16:9 aspect ratio, 280px wide (responsive grid)
   - <img src={imageSrc}> filling the card
   - Border: 1px var(--border), radius var(--r-lg)
   - Selected: 2px gradient border, glow effect

2. Update components/steps/ThumbnailStep.tsx:
   - Render StepHead (STEP 02, 'Choose Thumbnail', subtitle)
   - Grid: gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16px
   - For each index in analysisResult.thumbnailFrameIndices, render a ThumbnailCard
     with imageSrc = `data:image/jpeg;base64,${analysisResult.frames[index]}`
   - Plus 1 upload card (always visible, last in the grid):
     - Dashed 1.5px var(--border), min-height 280px, padding 24px
     - Icon: upload arrow in circle (46px circle, bg var(--surface-2))
     - Heading: 'Upload your own thumbnail' (16px, 600)
     - Subheading: 'PNG / JPG' (11px mono, muted)
     - Hidden file input (accept='image/*'), clicking the card opens the picker
     - Once a file is selected: show its preview in the same card, replacing the dashed state

3. Selection state:
   - Clicking an AI frame card: setThumbSel(index), clear userThumb if it was set
   - Selecting a custom upload: setUserThumb(file), set thumbSel to a sentinel
     value (e.g. -1) indicating 'custom'
   - Only one card shows the selected (glow) border at a time

4. Styling:
   - Match DESIGN_QUICK_REF exactly
   - Responsive grid (280px min on desktop, smaller on mobile)

TEST CHECKLIST:
✅ Step 2 renders with correct heading
✅ The AI-picked real video frames display as cards (actual frames, not placeholders)
✅ Upload card visible with dashed border
✅ Clicking a frame card selects it (border glow)
✅ Selecting a custom image shows its preview and selects it
✅ Only one card selected at a time
✅ Mobile responsive (grid adapts)

DO NOT implement canvas enhancement yet — that's the next prompt."
```

**After Prompt 6:**
- Navigate to step 2, confirm the real video frames appear (not gradients/placeholders)
- Click frame cards, confirm selection works
- Upload a custom image, confirm it previews and selects

---

### PROMPT 7: Description Step (Step 3)
**Duration: ~45 min | Output: AI-generated description block + copy**

```
claude "Continue RANKR development.

TASK: Build Step 3 - Description display.

BUILD:

1. Update components/steps/DescriptionStep.tsx:
   - Render StepHead (STEP 03, 'Description', subtitle:
     'AI-generated description, ready to paste into YouTube Studio.')
   - Display generatedContent.description in a read-only block:
     - Background: var(--surface), padding 16px, radius var(--r-lg), border 1px var(--border)
     - Text: 14px DM Sans, 1.6 line-height, preserve line breaks (whitespace-pre-wrap)
   - 'Copy' button (shadcn Button) above or below the block
     - On click: copy generatedContent.description to clipboard
     - Show a small success toast/flash ('✓ Copied!') for 1.5s

2. Styling:
   - Match DESIGN_QUICK_REF
   - Block height: auto, max-height with overflow-y auto if very long

TEST CHECKLIST:
✅ Step 3 renders with correct heading
✅ Real AI-generated description text displays, formatting preserved
✅ Copy button copies the description to clipboard
✅ Success feedback shown after copy
✅ Mobile responsive

DO NOT add toggles or sections — this is a single static block."
```

**After Prompt 7:**
- Navigate to step 3, confirm the real description renders
- Click Copy, paste into a text editor to verify

---

### PROMPT 8: Tags Step (Step 4)
**Duration: ~45 min | Output: Multi-select tag list from real AI tags**

```
claude "Continue RANKR development.

TASK: Build Step 4 - Tags Selection with multi-select pills, using the real
tags from generatedContent.tags.

BUILD:

1. Create components/ui/TagPill.tsx:
   - Props: label: string, isSelected: boolean, onToggle: () => void
   - Styling:
     - Unselected: border 1px var(--border), transparent bg, var(--text) text
     - Selected: bg var(--accent), white text, bold
     - Hover: bg slightly lighter (both states)

2. Update components/steps/TagsStep.tsx:
   - Render StepHead (STEP 04, 'Tags', subtitle)
   - Render one TagPill per tag in generatedContent.tags
   - tagsSel defaults to ALL tags selected (set this default when generatedContent
     first loads, in app/page.tsx)
   - On pill click: toggle that tag in tagsSel:
     ```js
     const toggleTag = (tag) => {
       setTagsSel(prev =>
         prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
       );
     };
     ```
   - Show a small count above the grid: 'Selected: {tagsSel.length} of {tags.length}'

3. Styling:
   - Match DESIGN_QUICK_REF
   - Pills: 11px mono, letter-spacing 0.06em, flex wrap, gap 8px

TEST CHECKLIST:
✅ Step 4 renders with all real AI-generated tags
✅ Tags start all selected
✅ Clicking a tag toggles selection (color change)
✅ Count updates as tags are toggled
✅ Mobile responsive (pills wrap)"
```

**After Prompt 8:**
- Navigate to step 4, confirm real tags render, all selected by default
- Toggle a few, confirm count updates

---

### PROMPT 9: Rank Step (Step 5) + Export
**Duration: ~1 hour | Output: Static score display + full export**

```
claude "Continue RANKR development.

TASK: Build Step 5 - overall score display and final export package.

BUILD:

1. Create components/ui/ScoreRing.tsx:
   - SVG circle, 150px diameter, 8px stroke
   - Props: score: number (0-100)
   - On mount, animate countup from 0 to `score` over ~1.5 seconds
     (use @keyframes countup or a small useEffect + requestAnimationFrame)
   - Gradient stroke (--grad-a to --grad-c)
   - Text centered inside: {score} (21px Space Grotesk, 700)
   - aria-label='Overall score: {score} out of 100'

2. Update components/steps/RankStep.tsx:
   - Render StepHead (STEP 05, 'Your Score', subtitle:
     'A static estimate of how well-optimized this metadata is.')
   - Render <ScoreRing score={generatedContent.overallScore} />
   - Below: ExportPackage section

3. Create components/ui/ExportPackage.tsx:
   - Display the final selected metadata, ready to copy:
     ```
     TITLE
     [titles[titleSel]]

     DESCRIPTION
     [generatedContent.description]

     TAGS
     [tagsSel.join(', ')]
     ```
   - Container: var(--surface) bg, border 1px var(--border), padding 20px, radius var(--r-lg)
   - Text: mono 12px
   - 'Copy All' button (shadcn Button)

4. Implement copy functionality:
   - Create utils/clipboard.ts:
     ```ts
     export async function copyToClipboard(text: string): Promise<boolean> {
       try {
         await navigator.clipboard.writeText(text);
         return true;
       } catch {
         return false;
       }
     }
     ```
   - On 'Copy All' click: compose the text block above, copy it, show
     '✓ Copied! Paste in YouTube Studio' for 1.5s
   - If clipboard API fails: show the text in a modal/textarea so the user can
     manually select + copy

TEST CHECKLIST:
✅ Step 5 renders with correct heading
✅ Score ring animates 0 → overallScore on first view of this step
✅ Score does NOT change when navigating back to earlier steps and returning
   (it's the static value from Stage 2)
✅ Export package shows the SELECTED title, the description, and the SELECTED tags
✅ 'Copy All' copies the composed text
✅ Success feedback appears after copy
✅ Paste into a text editor to verify content
✅ Fallback shown if clipboard API unavailable"
```

**After Prompt 9:**
- Navigate to step 5, watch the score ring animate once
- Go back to step 1, change the title, return to step 5 — confirm the export
  package reflects the new title but the score stays the same
- Copy and paste to verify

---

## END OF WEEK 1 ✅

**At this point you have:**
- ✅ Upload → Analyzing (real pipeline) → 5-step Results wizard, fully wired to real Gemini output
- ✅ All 5 steps functional with real data
- ✅ Export to clipboard working
- ✅ Theme switching with CSS variables
- ✅ Mobile responsive
- ✅ Ready for Week 2 (canvas enhancement, polish, deploy)

**Test the entire flow:**
```
1. Go to localhost:3000 (Upload screen, root page)
2. Drop a real short video
3. Watch the Analyzing screen run through all 3 real phases
4. Click through all 5 steps — confirm real AI content everywhere
5. Copy to clipboard on steps 3 and 5
6. Change theme
7. Mobile responsive (test at 480px)
```

---

## WEEK 2: ENHANCEMENT, POLISH & DEPLOY (Days 8-14)

### PROMPT 10: Canvas Thumbnail Enhancement
**Duration: ~2.5 hours | Output: Color-graded + headline thumbnail variants**

```
claude "Continue RANKR Week 2.

TASK: Add canvas-based image enhancement to the Thumbnail step (Step 2), applied
to BOTH the AI-picked video frames and any custom upload.

Reference DESIGN_QUICK_REF.md 'Enhancement' section before starting.

BUILD:

1. Create utils/canvas.ts:
   - Function: enhanceImage(imageSrc: string, variant: 'grade' | 'graphics', headline?: string): Promise<string>
   - Returns: Promise<string> (a data URL for the enhanced image)
   - Implementation:
     * Load imageSrc into an Image object, draw onto an offscreen <canvas>
     * For 'grade' variant:
       - Increase contrast +16%
       - Increase saturation +45%
       - Increase brightness +5%
       - Add a vignette (darkened edges via radial gradient overlay)
     * For 'graphics' variant:
       - Apply the same grade adjustments
       - Draw a darkened headline zone at the bottom (rgba(0,0,0,0.4), ~25% of height)
       - Draw `headline` as white, bold, stroked text (3px stroke) in that zone,
         using clamp-style sizing relative to canvas width
       - Draw an accent-gradient frame border around the whole image
     * Return canvas.toDataURL('image/jpeg', 0.85)

2. Update components/steps/ThumbnailStep.tsx:
   - For each of the 4 AI-picked frames AND for a freshly uploaded custom image:
     - Run an 'Enhancing...' animation (reuse for both cases):
       * 'Analyzing composition…'
       * 'Boosting contrast & clarity…'
       * 'Punching color saturation…'
       * 'Adding focus vignette…'
       * 'Composing headline & graphics…'
       (cycle through these labels over ~2 seconds while enhanceImage runs)
     - Call enhanceImage(frame, 'graphics', titles[titleSel]) to get the default
       enhanced version (headline uses the currently selected title from Step 1)
     - Also compute the 'grade'-only variant for the BEFORE/AFTER toggle's AFTER state
       — actually: AFTER = 'graphics' variant, BEFORE = original frame

3. Update components/ui/ThumbnailCard.tsx:
   - Add a BEFORE/AFTER toggle (two small pill buttons, top-right of the card):
     - BEFORE: shows the original frame/upload
     - AFTER (default): shows the enhanced ('graphics') version
   - Toggling swaps the displayed image only — selection state is unaffected

4. Custom upload flow:
   - When a user drops a custom image, run the same enhancement pipeline on it
     (with the 'Enhancing...' animation), then show it in the upload card with
     the same BEFORE/AFTER toggle

5. Performance:
   - Run enhancement for the 4 AI frames once, after Step 2 first mounts (or
     lazily, on first visit to Step 2) — cache the results in state so
     revisiting the step doesn't re-run canvas work
   - Canvas operations are synchronous but fast for ~480px images; no Web
     Worker needed for this scale

TEST CHECKLIST:
✅ Visiting Step 2 shows a brief 'Enhancing...' animation per card, then settles
✅ Each AI frame card defaults to the enhanced ('AFTER') version
✅ BEFORE/AFTER toggle swaps between original and enhanced image
✅ Enhanced 'graphics' version shows the selected title as headline text, with
   stroke + darkened zone + accent frame border
✅ Uploading a custom image runs the same enhancement + toggle
✅ Revisiting Step 2 doesn't re-run the enhancement animation (cached)
✅ Mobile responsive

PERFORMANCE NOTE: for MVP/personal use, blocking the main thread briefly during
canvas work is acceptable."
```

**After Prompt 10:**
- Go to step 2, watch the enhancement animation run on the real frames
- Toggle BEFORE/AFTER on a couple of cards
- Upload a custom image and confirm it gets the same treatment
- Go back to step 1, change the title, return to step 2 — confirm the headline
  text on the 'graphics' variant updates to the newly selected title

---

### PROMPT 11: Polishing + Error Handling + Mobile Responsive
**Duration: ~1.5 hours | Output: Production-ready UI**

```
claude "Continue RANKR Week 2.

TASK: Polish the app for production. Add error handling, accessibility, mobile responsiveness.

BUILD:

1. Error Boundaries:
   - Create components/ErrorBoundary.tsx using React Error Boundary
   - Wrap the ResultsWizard and Analyzing screen
   - Show a user-friendly message: 'Something went wrong. Please reload and try again.'
   - Log to console for debugging

2. Loading States:
   - Confirm all async operations (frame extraction, Gemini calls, canvas
     enhancement) show a visible loading/progress state
   - Disable navigation buttons while a step's async work is in progress

3. Mobile Responsiveness:
   - Test on 375px, 480px, 768px, 1024px widths
   - Ensure:
     * Typography scales with clamp()
     * Buttons are ≥44px touch targets
     * Grid columns don't overflow (Thumbnail grid especially)
     * Padding/margins scale appropriately
   - Fix any issues found

4. Accessibility:
   - Add aria-labels to icon-only buttons
   - Ensure file inputs have associated <label> elements
   - Test keyboard navigation (Tab through all interactive elements)
   - Verify color contrast meets WCAG AA
   - Add alt text for thumbnail images
   - Step indicators: aria-current='step' on the active step

5. User Feedback:
   - Toast notifications for:
     * Successful copy to clipboard (✓ Copied!)
     * Pipeline errors ('Failed to analyze. Try again.')
   - Toast appears for ~1.5-2 seconds, auto-dismisses
   - Create components/ui/Toast.tsx (or small inline div notifications)

6. Keyboard Navigation:
   - All buttons keyboard-accessible (Tab, Enter)
   - File input triggers work via keyboard (Enter/Space on the label)
   - Arrow keys navigate between cards (optional but nice)

7. Performance:
   - Memoize expensive calculations (canvas-enhanced thumbnail variants)
   - Avoid unnecessary re-renders
   - Check DevTools Performance tab during the Analyzing phase and Step 2

8. Visual Polish:
   - Smooth transitions on all interactions (0.15-0.3s)
   - Hover states on all interactive elements
   - Focus rings on inputs/buttons (visible for keyboard nav)
   - Loading spinners smooth (no janky animations)

TEST CHECKLIST:
✅ No console errors in production build (npm run build && npm start)
✅ All buttons accessible via Tab navigation
✅ Color contrast passes WCAG AA
✅ Touch targets ≥44px
✅ Mobile responsive (test on a real phone if possible)
✅ Toast notifications appear for copy actions and pipeline errors
✅ Animations smooth (60fps in DevTools)
✅ Page load reasonably fast (Lighthouse score >85)

DO NOT add new features. Just polish what exists."
```

**After Prompt 11:**
- Test on multiple devices/screen sizes
- Check accessibility (keyboard nav, contrast, aria labels)
- Run `npm run build` and check for console errors in the production build
- Test error scenarios (disconnect network mid-analysis, confirm 'Try Again' works)

---

### PROMPT 12: Deploy to Vercel + Final Testing
**Duration: ~45 min | Output: Live deployed app**

```
claude "Continue RANKR Week 2.

TASK: Deploy to Vercel.

BUILD:

1. Prepare for Deployment:
   - Remove all console.log debugging (especially anything logging frame data)
   - Verify .env.local is in .gitignore (NEVER commit secrets)
   - Run 'npm run build' locally, verify no errors

2. Create Vercel Account:
   - Go to vercel.com, sign up with GitHub, authorize access

3. Deploy to Vercel:
   - Create a GitHub repo: rankr
   - Commit all code (except .env.local)
   - Push to GitHub
   - Go to vercel.com/new, import the repo
   - Vercel auto-detects Next.js, click Deploy

4. Set Environment Variables in Vercel:
   - Settings → Environment Variables
   - Add: GOOGLE_GEMINI_API_KEY=AIza..., NEXT_PUBLIC_URL=https://[your-vercel-url]
   - Redeploy after adding vars

5. Verify Production Deployment:
   - Visit the live URL
   - Run the full pipeline end-to-end with a real video
   - Check Vercel logs (Settings → Deployments → Logs) for errors
   - Check Vercel Analytics

TEST CHECKLIST:
✅ Vercel deployment successful (no build errors)
✅ Visit live URL → Upload screen loads directly (no landing page)
✅ Full pipeline works: upload → analyzing (real progress) → all 5 steps → export
✅ Console shows no errors (DevTools on live site)
✅ Mobile works on the live site
✅ Lighthouse score >85"
```

**After Prompt 12:**
- Visit your live Vercel URL
- Run the full pipeline with a real video
- Test all 5 steps and export on the deployed version
- Start using it for your own videos!

---

## END OF WEEK 2 ✅

**At this point you have:**
- ✅ Complete working app, deployed and usable
- ✅ Real two-stage Gemini pipeline (vision → text)
- ✅ Canvas-enhanced thumbnails (AI-picked frames + custom uploads)
- ✅ Mobile responsive + accessible
- ✅ No payment, no accounts, no database — just a tool you can use

---

## POST-LAUNCH (Optional, Don't Build Unless You Want To)

These are ideas for later, NOT part of the MVP:

- "Add a password/PIN gate if I share the URL with others"
- "Add Stripe + accounts if I ever want to turn this into a product"
- "Add YouTube API integration for direct publish"
- "Let me save/export a few past analyses (would need a database)"

---

## FINAL NOTE

Follow the prompts in order — each builds on the last. If you get stuck, read
CLAUDE.md, FRONTEND.md/BACKEND.md, GEMINI_API.md, and DESIGN_QUICK_REF.md for
reference.

**Cost:** Gemini free tier covers personal use entirely (~$0). Vercel hosting
is free tier. Total ongoing cost: effectively $0.

You're ready. Start with Prompt 1.
