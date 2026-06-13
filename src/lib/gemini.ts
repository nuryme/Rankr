// Gemini API client — the two-stage pipeline lives here, server-side only.
// Stage 1 (vision): frames[] -> { description, thumbnailFrameIndices }
// Stage 2 (text):   description -> { titles, description, tags, overallScore }
//
// Both functions parse + validate Gemini's response and THROW on malformed
// data. There is no mock fallback — the caller (the API route) turns a throw
// into a 500 the frontend surfaces as a "Try Again" button.

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult, GeneratedContent } from "@/types";

// Read the key lazily so an import never throws at module load. If the key is
// missing we want a clean, logged error from the call site, not a crash that
// takes down the whole route module.
function getApiKey(): string {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured.");
  }
  return key;
}

export function getModel(modelName = "gemini-2.5-flash") {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({
    model: modelName,
    // Ask Gemini for raw JSON so we don't have to fight markdown fences. We
    // still extract + parse defensively below in case a model ignores this.
    generationConfig: { responseMimeType: "application/json" },
  });
}

type Stage1Result = Pick<AnalysisResult, "description" | "thumbnailFrameIndices">;

// --- Stage 1: vision -------------------------------------------------------

export async function analyzeFrames(
  frames: string[] /* base64 JPEG, no data: prefix */
): Promise<Stage1Result> {
  const model = getModel();
  const thumbCount = Math.min(4, frames.length);

  const prompt = `These are ${frames.length} frames sampled evenly from a YouTube video.
Look at all of them and describe what the video is about: topic, setting,
key visuals, and overall tone/style.

IMPORTANT — read the text in the frames: title cards, captions/subtitles,
slides, on-screen labels, signs, product names, code, handwriting, or any UI.
This text is often the single strongest clue to the video's exact topic.
Transcribe the important on-screen text and work it into the description —
this description is the ONLY input to the next stage, which writes the titles,
tags, and YouTube description, so anything you omit here is lost.

Then pick the ${thumbCount} frame indices (0-based, between 0 and ${frames.length - 1})
that would make the BEST YouTube thumbnails — prioritize clear faces, readable
visuals, strong contrast, and emotional/interesting moments.

Return ONLY valid JSON (no markdown, no explanation):
{
  "description": "3-5 sentence description of the video's content and style, incorporating any key on-screen text you read",
  "thumbnailFrameIndices": [0, 3, 5, 7]
}`;

  const imageParts = frames.map((frame) => ({
    inlineData: { data: frame, mimeType: "image/jpeg" },
  }));

  const result = await model.generateContent([prompt, ...imageParts]);
  logUsage("analyzeFrames", result, { frameCount: frames.length });

  const parsed = extractJson(result.response.text(), "Stage 1");
  return validateStage1(parsed, frames.length);
}

// --- Stage 2: text ---------------------------------------------------------

export async function generateContent(
  description: string
): Promise<GeneratedContent> {
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

  const result = await model.generateContent(prompt);
  logUsage("generateContent", result);

  const parsed = extractJson(result.response.text(), "Stage 2");
  return validateStage2(parsed);
}

// --- Parsing & validation helpers ------------------------------------------

// Pull the JSON object out of a model response. With responseMimeType set this
// is usually already clean JSON, but we stay defensive against a stray fence
// or prose wrapper.
function extractJson(text: string, stage: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`No JSON found in ${stage} response.`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error(`${stage} response was not valid JSON.`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`${stage} response was not a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

function validateStage1(
  data: Record<string, unknown>,
  frameCount: number
): Stage1Result {
  const { description, thumbnailFrameIndices } = data;

  if (typeof description !== "string" || description.trim().length < 5) {
    throw new Error("Stage 1 description missing or too short.");
  }

  if (!Array.isArray(thumbnailFrameIndices)) {
    throw new Error("Stage 1 thumbnailFrameIndices missing.");
  }

  // Keep only valid in-range integer indices and de-dupe. A model occasionally
  // hallucinates an out-of-bounds index; dropping it is safer than trusting it
  // downstream as an array offset.
  const indices = Array.from(
    new Set(
      thumbnailFrameIndices.filter(
        (i): i is number =>
          typeof i === "number" &&
          Number.isInteger(i) &&
          i >= 0 &&
          i < frameCount
      )
    )
  );

  if (indices.length === 0) {
    throw new Error("Stage 1 returned no valid thumbnail frame indices.");
  }

  return { description: description.trim(), thumbnailFrameIndices: indices };
}

function validateStage2(data: Record<string, unknown>): GeneratedContent {
  const { titles, description, tags, overallScore } = data;

  if (
    !Array.isArray(titles) ||
    titles.length === 0 ||
    !titles.every((t) => typeof t === "string")
  ) {
    throw new Error("Stage 2 titles missing or invalid.");
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    throw new Error("Stage 2 description missing.");
  }

  if (
    !Array.isArray(tags) ||
    tags.length === 0 ||
    !tags.every((t) => typeof t === "string")
  ) {
    throw new Error("Stage 2 tags missing or invalid.");
  }

  if (
    typeof overallScore !== "number" ||
    !Number.isFinite(overallScore) ||
    overallScore < 0 ||
    overallScore > 100
  ) {
    throw new Error("Stage 2 overallScore must be a number between 0 and 100.");
  }

  return {
    titles: titles as string[],
    description: description.trim(),
    tags: tags as string[],
    overallScore: Math.round(overallScore),
  };
}

// Log token usage + context for debugging/cost monitoring. Never logs frame
// data (base64 images) — only counts and metadata.
function logUsage(
  fn: string,
  result: Awaited<ReturnType<ReturnType<typeof getModel>["generateContent"]>>,
  extra: Record<string, unknown> = {}
) {
  const usage = result.response.usageMetadata;
  console.log("Gemini call:", {
    fn,
    ...extra,
    inputTokens: usage?.promptTokenCount,
    outputTokens: usage?.candidatesTokenCount,
    totalTokens: usage?.totalTokenCount,
    timestamp: new Date().toISOString(),
  });
}
