"use client";

// The app state machine: upload → analyzing → results. Lives in a client
// component so app/page.tsx can stay a Server Component (only this subtree
// ships as client JS). Handlers are memoized so Analyzing's effect deps stay
// stable across renders.

import { useCallback, useState } from "react";
import Upload from "@/components/Upload";
import Analyzing from "@/components/Analyzing";
import ResultsWizard from "@/components/ResultsWizard";
import ErrorBoundary from "@/components/ErrorBoundary";
import type {
  AnalysisResult,
  GeneratedContent,
  Phase,
  ThumbnailEnhancementCache,
} from "@/types";

export default function RankrApp() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [step, setStep] = useState(0);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);

  // Wizard selections.
  const [titleSel, setTitleSel] = useState(0);
  const [thumbSel, setThumbSel] = useState(0);
  const [tagsSel, setTagsSel] = useState<string[]>([]);
  const [userThumb, setUserThumb] = useState<File | null>(null);

  // Canvas-enhanced thumbnails, cached across step navigation so Step 2's
  // "Enhancing..." animation only runs once.
  const [enhancementCache, setEnhancementCache] = useState<ThumbnailEnhancementCache>({
    frames: {},
    custom: null,
  });

  const handleFileAccepted = useCallback((file: File) => {
    setVideoFile(file);
    setPhase("analyzing");
  }, []);

  const handleAnalysisComplete = useCallback(
    (result: {
      analysisResult: AnalysisResult;
      generatedContent: GeneratedContent;
    }) => {
      setAnalysisResult(result.analysisResult);
      setGeneratedContent(result.generatedContent);
      // Default: every generated tag starts selected.
      setTagsSel(result.generatedContent.tags);
      setTitleSel(0);
      setThumbSel(0);
      setStep(0);
      setPhase("results");
    },
    []
  );

  if (phase === "analyzing" && videoFile) {
    return (
      <ErrorBoundary>
        <Analyzing videoFile={videoFile} onComplete={handleAnalysisComplete} />
      </ErrorBoundary>
    );
  }

  if (phase === "results" && analysisResult && generatedContent) {
    return (
      <ErrorBoundary>
        <ResultsWizard
          step={step}
          setStep={setStep}
          analysisResult={analysisResult}
          generatedContent={generatedContent}
          titleSel={titleSel}
          setTitleSel={setTitleSel}
          thumbSel={thumbSel}
          setThumbSel={setThumbSel}
          tagsSel={tagsSel}
          setTagsSel={setTagsSel}
          userThumb={userThumb}
          setUserThumb={setUserThumb}
          enhancementCache={enhancementCache}
          setEnhancementCache={setEnhancementCache}
        />
      </ErrorBoundary>
    );
  }

  return <Upload onFileAccepted={handleFileAccepted} />;
}
