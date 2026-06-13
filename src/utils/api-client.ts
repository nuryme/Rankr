// Frontend → API route client. Each call throws on a non-OK response, carrying
// the server's user-friendly error message so the Analyzing screen can show it
// next to a "Try Again" button. No fallback data — a throw is the contract.

import type { AnalysisResult, GeneratedContent } from "@/types";

type Stage1Result = Pick<AnalysisResult, "description" | "thumbnailFrameIndices">;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Surface the server's message when present, otherwise a generic fallback.
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error || `Request to ${url} failed.`);
  }

  return response.json() as Promise<T>;
}

export function fetchAnalysis(frames: string[]): Promise<Stage1Result> {
  return postJson<Stage1Result>("/api/analyze", { frames });
}

export function fetchGeneration(description: string): Promise<GeneratedContent> {
  return postJson<GeneratedContent>("/api/generate", { description });
}
