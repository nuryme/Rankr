# RANKR

A personal YouTube optimization tool — drop in a video and get AI-generated
titles, thumbnails, a description, tags, and an overall optimization score.

**Live:** [rankr-chi.vercel.app](https://rankr-chi.vercel.app)

---

## How it works

1. **Upload** — drop a video file (up to 10 minutes / 300MB)
2. **Analyzing** — frames are extracted client-side, then sent through a two-stage Gemini pipeline:
   - **Stage 1 (vision):** frames → video description + best thumbnail frame picks
   - **Stage 2 (text):** description → titles, description, tags, overall score
3. **Results wizard** — a 5-step flow to review and pick:
   - Title (4 AI options)
   - Thumbnail (4 AI-picked frames, canvas-enhanced, or upload your own)
   - Description
   - Tags
   - Overall score + export
4. **Export** — copy the final title, description, and tags straight into YouTube Studio

## Tech stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** Google Gemini API (multimodal vision + text)
- **Hosting:** Vercel

## Privacy & constraints

- Video files are **never uploaded** — frames are extracted in the browser and only frames/text are sent to Gemini
- Nothing is persisted — no database, no accounts; everything lives in memory for the session and clears on refresh
- Personal-use project: no payments, no rate limiting, no access gate

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` (see `.env.example`):

```
GOOGLE_GEMINI_API_KEY=your_key_here
```

Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Deployment

Deployed on Vercel. `GOOGLE_GEMINI_API_KEY` must be set in the project's
Environment Variables (Settings → Environment Variables) — `.env.local` is
not used in production.
