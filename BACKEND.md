# BACKEND API Patterns & Routes

**For: Building API routes, error handling, data validation**

---

## API Route Structure

All routes live in `/app/api/` and use Next.js App Router:

```
app/api/
├── analyze/route.ts           # POST: Stage 1 (vision) - frames -> description + thumbnail picks
├── generate/route.ts          # POST: Stage 2 (text) - description -> titles/description/tags/score
└── enhance-thumbnail/route.ts # POST: enhance an image (if moved server-side)
```

---

## Standard Route Pattern

```typescript
// app/api/[feature]/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request
    const { description } = await req.json();

    // 2. Validate input
    if (!description) {
      return NextResponse.json(
        { error: "description required" },
        { status: 400 }
      );
    }

    // 3. Call external service (Gemini API)
    const result = await externalService(description);

    // 4. Return response
    return NextResponse.json(result);

  } catch (error) {
    // 5. Error handling
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Error Handling Pattern

```typescript
// Always wrap in try-catch
try {
  // Do something
} catch (error) {
  // Log with context
  console.error("Feature failed:", {
    error: error.message,
    timestamp: new Date().toISOString()
  });

  // Return user-friendly error
  return NextResponse.json(
    {
      error: "Failed to [feature]. Please try again.",
      code: "FEATURE_ERROR"
    },
    { status: 500 }
  );
}
```

No mock-data fallback — if Gemini fails, return the error and let the
frontend show a manual "Try Again" button (see GEMINI_API.md).

---

## Request/Response Validation

### Stage 1 (`/api/analyze`)
```typescript
// Validate before processing
const validateAnalyzeInput = (data: unknown) => {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid input");
  }

  const { frames } = data as any;

  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error("frames must be a non-empty array");
  }

  if (frames.length > 12) {
    throw new Error("too many frames (max 12)");
  }

  frames.forEach((frame, idx) => {
    if (typeof frame !== "string") {
      throw new Error(`frame ${idx} must be a base64 string`);
    }
  });

  return { frames };
};

// Validate the Gemini response before returning to the client
const validateAnalyzeResponse = (data: unknown) => {
  const { description, thumbnailFrameIndices } = data as any;

  if (typeof description !== "string" || description.length < 5) {
    throw new Error("description missing or too short");
  }

  if (!Array.isArray(thumbnailFrameIndices) || thumbnailFrameIndices.length === 0) {
    throw new Error("thumbnailFrameIndices missing or empty");
  }

  return { description, thumbnailFrameIndices };
};
```

### Stage 2 (`/api/generate`)
```typescript
const validateGenerateInput = (data: unknown) => {
  const { description } = data as any;

  if (!description || typeof description !== "string") {
    throw new Error("description must be a string");
  }

  return { description };
};

const validateGenerateResponse = (data: unknown) => {
  const { titles, description, tags, overallScore } = data as any;

  if (!Array.isArray(titles) || titles.length === 0) {
    throw new Error("titles missing or empty");
  }

  if (typeof description !== "string") {
    throw new Error("description missing");
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    throw new Error("tags missing or empty");
  }

  if (typeof overallScore !== "number" || overallScore < 0 || overallScore > 100) {
    throw new Error("overallScore must be 0-100");
  }

  return { titles, description, tags, overallScore };
};
```

---

## API Client Pattern (Frontend)

```typescript
// utils/api-client.ts

export async function fetchAnalysis(frames: string[]) {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frames })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to analyze frames");
    }

    return response.json() as Promise<{
      description: string;
      thumbnailFrameIndices: number[];
    }>;
  } catch (error) {
    console.error("fetchAnalysis error:", error);
    throw error; // Let caller handle (Analyzing screen shows "Try Again")
  }
}

export async function fetchGeneration(description: string) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate content");
    }

    return response.json() as Promise<{
      titles: string[];
      description: string;
      tags: string[];
      overallScore: number;
    }>;
  } catch (error) {
    console.error("fetchGeneration error:", error);
    throw error;
  }
}
```

---

## Common Routes

### 1. Stage 1 — Frame Analysis
```typescript
// POST /api/analyze
// See GEMINI_API.md for implementation
// Input: { frames: string[] }  (base64 JPEG, no data: prefix)
// Output: { description: string, thumbnailFrameIndices: number[] }
```

### 2. Stage 2 — Content Generation
```typescript
// POST /api/generate
// Input: { description: string }
// Output: { titles: string[4], description: string, tags: string[], overallScore: number }
```

### 3. Thumbnail Enhancement
```typescript
// POST /api/enhance-thumbnail
// Input: FormData with image file
// Output: { variants: { grade: blob, graphics: blob } }
// Note: prefer doing this client-side with Canvas (see DESIGN_QUICK_REF.md).
// Only move to a backend route if Canvas processing proves too slow/heavy.
```

---

## Environment Variables

Routes need this in `.env.local`:

```bash
# Gemini API
GOOGLE_GEMINI_API_KEY=AIza...

# App
NEXT_PUBLIC_URL=http://localhost:3000 (dev) or https://rankr.vercel.app (prod)
```

---

## Logging & Monitoring

```typescript
// Log API calls for debugging
console.log("API call:", {
  endpoint: "/api/analyze",
  frameCount: frames.length,
  timestamp: new Date().toISOString()
});

// Log errors with context
console.error("API error:", {
  endpoint: "/api/analyze",
  error: error.message,
  timestamp: new Date().toISOString()
});
```

---

## Security Best Practices

- ✅ Always validate input (type, length, format)
- ✅ Always validate output from Gemini before sending to the client
- ✅ Never expose the Gemini API key in responses
- ✅ Use HTTPS in production (Vercel does this)
- ✅ Log errors but don't expose stack traces to the client
- ❌ Don't trust client input (cap frame count/size server-side too)
- ❌ Don't expose sensitive error messages
- ❌ Don't log frame data (base64 images) to console

---

## Testing Routes Locally

```bash
# Stage 2 is easy to test with curl
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description":"A 10-minute vlog about a day trip to a mountain town."}'

# Stage 1 needs real base64 frame data — test through the UI
# (Upload a short video and watch the Network tab for /api/analyze)
```

---

**Reference this when building API routes. Pair with GEMINI_API.md for Gemini-specific code.**
