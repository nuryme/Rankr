// POST /api/generate — Stage 2 (text).
// Input:  { description: string }
// Output: { titles: string[], description: string, tags: string[], overallScore: number }

import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

const MAX_DESCRIPTION_LENGTH = 5_000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    // --- Validate input ---
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "description required" },
        { status: 400 }
      );
    }

    const { description } = body as { description: unknown };

    if (typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { error: "description must be a non-empty string" },
        { status: 400 }
      );
    }

    // Cap length so a runaway client can't blow up the prompt / token budget.
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `description too long (max ${MAX_DESCRIPTION_LENGTH} chars)` },
        { status: 400 }
      );
    }

    console.log("API call:", {
      endpoint: "/api/generate",
      descriptionLength: description.length,
      timestamp: new Date().toISOString(),
    });

    const result = await generateContent(description);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/generate:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
