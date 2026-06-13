// POST /api/analyze — Stage 1 (vision).
// Input:  { frames: string[] }  (base64 JPEG, no data: prefix)
// Output: { description: string, thumbnailFrameIndices: number[] }

import { NextRequest, NextResponse } from "next/server";
import { analyzeFrames } from "@/lib/gemini";

const MAX_FRAMES = 12;

export async function POST(req: NextRequest) {
  let frameCount = 0;
  try {
    const body = await req.json().catch(() => null);

    // --- Validate input (never trust the client) ---
    if (typeof body !== "object" || body === null || !("frames" in body)) {
      return NextResponse.json({ error: "frames required" }, { status: 400 });
    }

    const { frames } = body as { frames: unknown };

    if (!Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: "frames must be a non-empty array" },
        { status: 400 }
      );
    }

    if (frames.length > MAX_FRAMES) {
      return NextResponse.json(
        { error: `too many frames (max ${MAX_FRAMES})` },
        { status: 400 }
      );
    }

    if (!frames.every((f) => typeof f === "string" && f.length > 0)) {
      return NextResponse.json(
        { error: "each frame must be a non-empty base64 string" },
        { status: 400 }
      );
    }

    frameCount = frames.length;
    console.log("API call:", {
      endpoint: "/api/analyze",
      frameCount,
      timestamp: new Date().toISOString(),
    });

    const result = await analyzeFrames(frames as string[]);
    return NextResponse.json(result);
  } catch (error) {
    // Log with context for debugging; never leak the message/stack to the client.
    console.error("POST /api/analyze:", {
      frameCount,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Failed to analyze video frames. Please try again." },
      { status: 500 }
    );
  }
}
