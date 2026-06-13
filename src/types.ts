// Shared app types. The full shape is defined here up front (per
// FRONTEND.md "State Management"); most fields are wired up by later prompts.

export type Phase = "upload" | "analyzing" | "results";

export type AnalysisProgress =
  | "extracting"
  | "analyzing"
  | "generating"
  | "error";

export type Theme = "sunset" | "forest" | "midnight";

// Stage 1 (vision) output + the frames extracted client-side.
export interface AnalysisResult {
  frames: string[]; // base64 JPEGs extracted client-side
  description: string; // Stage 1 output
  thumbnailFrameIndices: number[]; // Stage 1 output
}

// Stage 2 (text) output.
export interface GeneratedContent {
  titles: string[];
  description: string;
  tags: string[];
  overallScore: number; // static 0-100, does not recompute on selection change
}
