# GEMINI API Integration Guide

**For: Wiring Google Gemini API, handling responses, error cases**

---

## Setup

### 1. Get Free API Key
```bash
# No credit card needed
# Visit: https://aistudio.google.com/app/apikey
# Click "Create API Key"
# Copy: AIza...

# Add to .env.local:
GOOGLE_GEMINI_API_KEY=AIza...
```

### 2. Install SDK
```bash
npm install @google/generative-ai
```

### 3. Initialize Client
```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY!
);

export function getModel(modelName = "gemini-2.0-flash") {
  return genAI.getGenerativeModel({ model: modelName });
}
```

---

## Models & Pricing

### Available Models

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| **gemini-2.0-flash** | ⚡ Fastest | Excellent | $0.075/1M | **RANKR (vision + text)** |
| gemini-1.5-flash | Fast | Very good | $0.075/1M | Budget |
| gemini-1.5-pro | Slower | Best | $1.50/1M | Advanced reasoning |

**Use `gemini-2.0-flash` for both stages.** It's multimodal — the same model
handles the image frames in Stage 1 and the text generation in Stage 2.

### Free Tier Limits
```
Rate: 15 requests per minute
Tokens: 1.5M per day
Cost: $0
```

For personal use (a handful of analyses per day), the free tier is more than
enough — no need to set up Cloud billing.

---

## The Two-Stage Pipeline

RANKR never sends the video file itself to Gemini. Instead:

1. **Client-side**: extract ~8-10 frames from the video using `<video>` + `<canvas>`, encode as base64 JPEG.
2. **Stage 1 (Vision)**: send the frames to Gemini, get back a text description of the video plus which frames make good thumbnails.
3. **Stage 2 (Text)**: send that description to Gemini, get back titles, a description, tags, and an overall score.

```
frames[] (base64 JPEG) ──▶ POST /api/analyze ──▶ { description, thumbnailFrameIndices[] }
                                                          │
                                                          ▼
                              POST /api/generate ──▶ { titles[4], description, tags[], overallScore }
```

---

## Stage 1: Video Frame Analysis (Vision)

### Implementation
```typescript
// lib/gemini.ts
export async function analyzeFrames(frames: string[] /* base64 JPEG, no data: prefix */) {
  const model = getModel();

  const prompt = `These are frames sampled evenly from a YouTube video.
Look at all of them and describe what the video is about: topic, setting,
key visuals, and overall tone/style.

Then pick the ${Math.min(4, frames.length)} frame indices (0-based) that would
make the BEST YouTube thumbnails — prioritize clear faces, readable visuals,
strong contrast, and emotional/interesting moments.

Return ONLY valid JSON (no markdown, no explanation):
{
  "description": "2-4 sentence description of the video's content and style",
  "thumbnailFrameIndices": [0, 3, 5, 7]
}`;

  const imageParts = frames.map((frame) => ({
    inlineData: { data: frame, mimeType: "image/jpeg" },
  }));

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Stage 1 response");

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.description || !Array.isArray(parsed.thumbnailFrameIndices)) {
      throw new Error("Stage 1 response missing required fields");
    }

    return parsed as { description: string; thumbnailFrameIndices: number[] };
  } catch (error) {
    console.error("analyzeFrames error:", error);
    throw error;
  }
}
```

### API Route
```typescript
// app/api/analyze/route.ts
import { analyzeFrames } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { frames } = await req.json();

    if (!Array.isArray(frames) || frames.length === 0) {
      return Response.json({ error: "frames required" }, { status: 400 });
    }

    const result = await analyzeFrames(frames);
    return Response.json(result);
  } catch (error) {
    console.error("POST /api/analyze:", error);
    return Response.json(
      { error: "Failed to analyze video frames" },
      { status: 500 }
    );
  }
}
```

---

## Stage 2: Generate Titles, Description, Tags & Score

### Implementation
```typescript
// lib/gemini.ts
export async function generateContent(description: string) {
  const model = getModel();

  const prompt = `Here is a description of a YouTube video:
"${description}"

Based on this, generate optimized YouTube metadata.

Return ONLY valid JSON (no markdown, no explanation):
{
  "titles": ["Title 1", "Title 2", "Title 3", "Title 4"],
  "description": "A 2-3 paragraph YouTube description, engaging and optimized for discovery.",
  "tags": ["tag1", "tag2", "tag3", "..."],
  "overallScore": 87
}

Where:
- titles: 4 distinct, clickable titles, each under 60 characters
- description: ready to paste into YouTube Studio
- tags: 10-15 relevant search tags, lowercase
- overallScore: a single 0-100 score estimating how well-optimized this metadata is`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Stage 2 response");

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      !Array.isArray(parsed.titles) || parsed.titles.length === 0 ||
      typeof parsed.description !== "string" ||
      !Array.isArray(parsed.tags) ||
      typeof parsed.overallScore !== "number"
    ) {
      throw new Error("Stage 2 response missing required fields");
    }

    return parsed as {
      titles: string[];
      description: string;
      tags: string[];
      overallScore: number;
    };
  } catch (error) {
    console.error("generateContent error:", error);
    throw error;
  }
}
```

### API Route
```typescript
// app/api/generate/route.ts
import { generateContent } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    if (!description) {
      return Response.json({ error: "description required" }, { status: 400 });
    }

    const result = await generateContent(description);
    return Response.json(result);
  } catch (error) {
    console.error("POST /api/generate:", error);
    return Response.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
```

---

## Frontend Usage

```typescript
// utils/api-client.ts
export async function fetchAnalysis(frames: string[]) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frames }),
  });

  if (!response.ok) throw new Error("Failed to analyze frames");
  return response.json() as Promise<{ description: string; thumbnailFrameIndices: number[] }>;
}

export async function fetchGeneration(description: string) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) throw new Error("Failed to generate content");
  return response.json() as Promise<{
    titles: string[];
    description: string;
    tags: string[];
    overallScore: number;
  }>;
}
```

### In the Analyzing Component
```typescript
// components/Analyzing.tsx
const [phase, setPhase] = useState<"extracting" | "analyzing" | "generating" | "error">("extracting");
const [error, setError] = useState<string | null>(null);

async function runPipeline() {
  try {
    setPhase("extracting");
    const frames = await extractFrames(videoFile); // utils/frames.ts

    setPhase("analyzing");
    const analysis = await fetchAnalysis(frames);

    setPhase("generating");
    const generated = await fetchGeneration(analysis.description);

    onComplete({ frames, analysis, generated });
  } catch (err) {
    setError(err instanceof Error ? err.message : "Something went wrong");
    setPhase("error");
  }
}
```

On error, show the failed phase with a "Try Again" button that re-runs only
that phase (e.g. if Stage 2 failed, retry `fetchGeneration` with the
already-computed `analysis.description` — no need to re-extract frames or
re-run Stage 1).

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `API_KEY_INVALID` | Wrong or missing key | Check `.env.local` |
| `RATE_LIMIT_EXCEEDED` | 15 requests/min exceeded | Wait a minute and retry (personal use rarely hits this) |
| `INVALID_ARGUMENT` | Bad prompt or image payload | Check frame encoding (base64, no `data:` prefix) |
| `RESOURCE_EXHAUSTED` | Daily token quota hit | Wait until quota resets |
| `JSON parse error` | Response not JSON | Response might be markdown-wrapped; the regex extraction above handles most cases |

### No Mock Fallback

If either stage fails, surface the error to the user with a manual
**"Try Again"** button. Do not fall back to mock/example data — for a
personal tool, a clear error is more useful than silently-wrong AI output.

---

## Cost Monitoring

### Calculate Your Costs (Personal Use)
```
Stage 1 (vision, ~8 frames @ ~258 tokens/image + prompt):
- Input tokens: ~2,200
- Output tokens: ~150
- Total: ~2,350 tokens

Stage 2 (text):
- Input tokens: ~150
- Output tokens: ~400
- Total: ~550 tokens

Per full analysis: ~2,900 tokens
Cost: 2,900 / 1,000,000 * $0.075 = $0.0002

Even at 20 analyses/day: ~$0.004/day — effectively free on the paid tier,
and well within the free tier's daily token limit.
```

### Monitor Token Usage (Optional)
```typescript
console.log("Gemini API call:", {
  endpoint: "/api/analyze",
  inputTokens: response.usageMetadata?.promptTokenCount,
  outputTokens: response.usageMetadata?.candidatesTokenCount,
  totalTokens: response.usageMetadata?.totalTokenCount,
});
```

---

## Testing Locally

```bash
# Test Stage 2 directly through your endpoint
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description":"A 10-minute vlog showing a day trip to a mountain town, hiking and coffee shops."}'

# Stage 1 needs real base64 frame data — easiest to test via the UI
# (Upload a short video and watch the Network tab for /api/analyze)
```

---

**Reference this when implementing Gemini API calls. All implementations use patterns above.**
