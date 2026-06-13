"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import { extractFrames } from "@/utils/frames";
import { fetchAnalysis, fetchGeneration } from "@/utils/api-client";
import type { AnalysisProgress, AnalysisResult, GeneratedContent } from "@/types";

interface AnalyzingProps {
  videoFile: File;
  onComplete: (result: {
    analysisResult: AnalysisResult;
    generatedContent: GeneratedContent;
  }) => void;
  onError?: (message: string) => void;
}

// The three sequential pipeline stages, in order. The "error" phase from
// AnalysisProgress is a UI state, not a stage you can run from.
type Stage = "extracting" | "analyzing" | "generating";
const STAGE_ORDER: Stage[] = ["extracting", "analyzing", "generating"];

const STEPS: { stage: Stage; label: string }[] = [
  { stage: "extracting", label: "Extracting frames" },
  { stage: "analyzing", label: "Analyzing video content" },
  { stage: "generating", label: "Generating titles, tags & description" },
];

export default function Analyzing({
  videoFile,
  onComplete,
  onError,
}: AnalyzingProps) {
  const [phase, setPhase] = useState<AnalysisProgress>("extracting");
  const [errorMessage, setErrorMessage] = useState("");

  // Cache completed-stage outputs so "Try Again" only re-runs the failed stage.
  const framesRef = useRef<string[] | null>(null);
  const analysisRef = useRef<Pick<
    AnalysisResult,
    "description" | "thumbnailFrameIndices"
  > | null>(null);
  const failedStageRef = useRef<Stage>("extracting");
  const startedRef = useRef(false);

  const runPipeline = useCallback(
    async (fromStage: Stage) => {
      const fromIdx = STAGE_ORDER.indexOf(fromStage);
      let stage: Stage = fromStage;
      try {
        if (fromIdx <= 0) {
          stage = "extracting";
          setPhase("extracting");
          framesRef.current = await extractFrames(videoFile);
          // Verify count/sizes without dumping base64 to the console. Dev-only
          // so the .map() allocation + log never run in production.
          if (process.env.NODE_ENV !== "production") {
            console.log(
              `[frames] extracted ${framesRef.current.length} frames`,
              framesRef.current.map((f) => `${f.length} chars`)
            );
          }
        }
        if (fromIdx <= 1) {
          stage = "analyzing";
          setPhase("analyzing");
          // Stage 1 (vision). Frames are already extracted above (or cached from
          // a previous run on a Stage-1 retry), so we never re-extract here.
          analysisRef.current = await fetchAnalysis(framesRef.current!);
        }
        stage = "generating";
        setPhase("generating");
        // Stage 2 (text). On a Stage-2-only retry we reuse the cached Stage 1
        // description, so "Try Again" never re-calls /api/analyze.
        const generatedContent = await fetchGeneration(
          analysisRef.current!.description
        );

        onComplete({
          analysisResult: {
            frames: framesRef.current!,
            description: analysisRef.current!.description,
            thumbnailFrameIndices: analysisRef.current!.thumbnailFrameIndices,
          },
          generatedContent,
        });
      } catch (err) {
        failedStageRef.current = stage;
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setErrorMessage(message);
        setPhase("error");
        onError?.(message);
      }
    },
    [videoFile, onComplete, onError]
  );

  // Kick off the pipeline once on mount (the ref guard survives StrictMode's
  // dev double-invoke so we never extract frames twice).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runPipeline("extracting");
  }, [runPipeline]);

  const currentIdx = STAGE_ORDER.indexOf(phase as Stage);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-160">
        <h2 className="text-center font-heading text-[26px] font-bold tracking-[-0.02em] text-(--text)">
          Analyzing your video…
        </h2>
        <p className="mt-2 text-center font-mono text-[11.5px] text-muted">
          {videoFile.name}
        </p>

        {phase === "error" ? (
          <div
            role="alert"
            className="mt-8 flex animate-[fadeIn_0.3s_ease-out] flex-col items-center gap-(--gap-md) rounded-(--r-lg) border border-border bg-(--surface) px-(--gap-xl) py-(--gap-xl) text-center"
          >
            <TriangleAlert
              className="h-6 w-6 text-accent"
              aria-hidden="true"
            />
            <p className="text-(--text)">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void runPipeline(failedStageRef.current)}
              className="rounded-(--r-md) border border-accent bg-accent px-(--gap-lg) py-(--gap-sm) font-medium text-white transition-transform active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-(--gap-md)">
            {STEPS.map(({ stage, label }, idx) => {
              const status =
                idx < currentIdx
                  ? "done"
                  : idx === currentIdx
                    ? "active"
                    : "pending";
              return (
                <li
                  key={stage}
                  className="flex items-center gap-(--gap-md) rounded-(--r-lg) border border-border bg-(--surface) px-(--gap-lg) py-(--gap-md) transition-colors"
                >
                  <StatusIcon status={status} />
                  <span
                    className={`text-[15px] transition-colors ${
                      status === "pending"
                        ? "text-(--muted-2)"
                        : "text-(--text)"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function StatusIcon({ status }: { status: "pending" | "active" | "done" }) {
  if (status === "done") {
    return (
      <CircleCheck
        className="h-5 w-5 shrink-0 text-(--win)"
        aria-label="Done"
      />
    );
  }
  if (status === "active") {
    return (
      <LoaderCircle
        className="h-5 w-5 shrink-0 animate-spin text-accent"
        aria-label="In progress"
      />
    );
  }
  return (
    <Circle
      className="h-5 w-5 shrink-0 text-(--muted-2)"
      aria-label="Pending"
    />
  );
}
