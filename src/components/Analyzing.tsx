"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import { extractFrames } from "@/utils/frames";
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

// --- Stubbed Stage 1 / Stage 2. Real Gemini wiring lands in a later prompt. ---
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function analyzeStub(): Promise<
  Pick<AnalysisResult, "description" | "thumbnailFrameIndices">
> {
  await delay(1000);
  return { description: "placeholder", thumbnailFrameIndices: [0, 1, 2, 3] };
}

async function generateStub(): Promise<GeneratedContent> {
  await delay(1000);
  return {
    titles: ["Title 1", "Title 2", "Title 3", "Title 4"],
    description: "placeholder",
    tags: ["tag1", "tag2"],
    overallScore: 80,
  };
}

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
          analysisRef.current = await analyzeStub();
        }
        stage = "generating";
        setPhase("generating");
        const generatedContent = await generateStub();

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
      <div className="w-full max-w-[640px]">
        <h2 className="text-center font-heading text-[26px] font-bold tracking-[-0.02em] text-[var(--text)]">
          Analyzing your video…
        </h2>
        <p className="mt-2 text-center font-mono text-[11.5px] text-[var(--muted)]">
          {videoFile.name}
        </p>

        {phase === "error" ? (
          <div
            role="alert"
            className="mt-8 flex animate-[fadeIn_0.3s_ease-out] flex-col items-center gap-[var(--gap-md)] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-[var(--gap-xl)] py-[var(--gap-xl)] text-center"
          >
            <TriangleAlert
              className="h-6 w-6 text-[var(--accent)]"
              aria-hidden="true"
            />
            <p className="text-[var(--text)]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void runPipeline(failedStageRef.current)}
              className="rounded-[var(--r-md)] border border-[var(--accent)] bg-[var(--accent)] px-[var(--gap-lg)] py-[var(--gap-sm)] font-medium text-white transition-transform active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-[var(--gap-md)]">
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
                  className="flex items-center gap-[var(--gap-md)] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-[var(--gap-lg)] py-[var(--gap-md)] transition-colors"
                >
                  <StatusIcon status={status} />
                  <span
                    className={`text-[15px] transition-colors ${
                      status === "pending"
                        ? "text-[var(--muted-2)]"
                        : "text-[var(--text)]"
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
        className="h-5 w-5 shrink-0 text-[var(--win)]"
        aria-label="Done"
      />
    );
  }
  if (status === "active") {
    return (
      <LoaderCircle
        className="h-5 w-5 shrink-0 animate-spin text-[var(--accent)]"
        aria-label="In progress"
      />
    );
  }
  return (
    <Circle
      className="h-5 w-5 shrink-0 text-[var(--muted-2)]"
      aria-label="Pending"
    />
  );
}
