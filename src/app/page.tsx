"use client";

import { useState } from "react";
import Upload from "@/components/Upload";
import Analyzing from "@/components/Analyzing";
import type {
  AnalysisProgress,
  AnalysisResult,
  GeneratedContent,
  Phase,
  Theme,
} from "@/types";

export default function Home() {
  // Phase / navigation
  const [phase, setPhase] = useState<Phase>("upload");
  const [step, setStep] = useState(0); // 0-4, used once phase === "results"

  // Pipeline state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisProgress, setAnalysisProgress] =
    useState<AnalysisProgress>("extracting");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);

  // Wizard selections (wired up in later prompts)
  const [titleSel, setTitleSel] = useState(0);
  const [thumbSel, setThumbSel] = useState(0);
  const [tagsSel, setTagsSel] = useState<string[]>([]);
  const [userThumb, setUserThumb] = useState<File | null>(null);
  const [theme, setTheme] = useState<Theme>("sunset");

  // Keep the stubbed state referenced until later prompts wire it up.
  // Each binding moves out of this list as the corresponding step is built.
  void [
    step, setStep,
    analysisProgress, setAnalysisProgress,
    titleSel, setTitleSel,
    thumbSel, setThumbSel,
    tagsSel, setTagsSel,
    userThumb, setUserThumb,
    theme, setTheme,
  ];

  const handleFileAccepted = (file: File) => {
    setVideoFile(file);
    setPhase("analyzing");
  };

  const handleAnalysisComplete = (result: {
    analysisResult: AnalysisResult;
    generatedContent: GeneratedContent;
  }) => {
    setAnalysisResult(result.analysisResult);
    setGeneratedContent(result.generatedContent);
    setPhase("results");
  };

  if (phase === "analyzing" && videoFile) {
    return (
      <Analyzing videoFile={videoFile} onComplete={handleAnalysisComplete} />
    );
  }

  if (phase === "results") {
    // Placeholder — the Results wizard comes in a later prompt.
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-[var(--gap-md)] px-4 py-12">
        <p className="font-heading text-[26px] font-bold text-[var(--text)]">
          Results
        </p>
        <pre className="max-w-[640px] overflow-auto rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-[var(--gap-md)] text-xs text-[var(--muted)]">
          {JSON.stringify(
            {
              frameCount: analysisResult?.frames.length,
              thumbnailFrameIndices: analysisResult?.thumbnailFrameIndices,
              generatedContent,
            },
            null,
            2
          )}
        </pre>
      </main>
    );
  }

  return <Upload onFileAccepted={handleFileAccepted} />;
}
