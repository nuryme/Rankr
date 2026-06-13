"use client";

// The 5-step results wizard shell: a clickable numbered step nav, the active
// step's content, and a Back / Next footer. Selection state is owned by
// RankrApp and threaded through to each step.

import type { Dispatch, SetStateAction } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepHeadProps } from "@/components/ui/StepHead";
import TitleStep from "@/components/steps/TitleStep";
import ThumbnailStep from "@/components/steps/ThumbnailStep";
import DescriptionStep from "@/components/steps/DescriptionStep";
import TagsStep from "@/components/steps/TagsStep";
import RankStep from "@/components/steps/RankStep";
import type { AnalysisResult, GeneratedContent } from "@/types";

const STEPS: StepHeadProps[] = [
  {
    eyebrow: "STEP 01",
    title: "Choose Your Title",
    subtitle: "Pick the title you'll use on YouTube.",
  },
  {
    eyebrow: "STEP 02",
    title: "Pick a thumbnail",
    subtitle: "Choose one of the AI-selected frames, or upload your own.",
  },
  {
    eyebrow: "STEP 03",
    title: "Description",
    subtitle: "Your AI-generated, ready-to-paste YouTube description.",
  },
  {
    eyebrow: "STEP 04",
    title: "Tags",
    subtitle: "Select the tags to publish with your video.",
  },
  {
    eyebrow: "STEP 05",
    title: "Your Score",
    subtitle: "A static estimate of how well-optimized this metadata is.",
  },
];
const LAST_STEP = STEPS.length - 1;

interface ResultsWizardProps {
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  analysisResult: AnalysisResult;
  generatedContent: GeneratedContent;
  titleSel: number;
  setTitleSel: Dispatch<SetStateAction<number>>;
  thumbSel: number;
  setThumbSel: Dispatch<SetStateAction<number>>;
  tagsSel: string[];
  setTagsSel: Dispatch<SetStateAction<string[]>>;
  userThumb: File | null;
  setUserThumb: Dispatch<SetStateAction<File | null>>;
}

export default function ResultsWizard({
  step,
  setStep,
  analysisResult,
  generatedContent,
  titleSel,
  setTitleSel,
  thumbSel,
  setThumbSel,
  tagsSel,
  setTagsSel,
  userThumb,
  setUserThumb,
}: ResultsWizardProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[920px] flex-col px-4 py-8 sm:px-6">
      {/* Step nav — clickable, wraps on mobile */}
      <nav
        aria-label="Wizard steps"
        className="flex flex-wrap items-center justify-center gap-[var(--gap-sm)]"
      >
        {STEPS.map((s, idx) => {
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <button
              key={s.eyebrow}
              type="button"
              onClick={() => setStep(idx)}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Step ${idx + 1}: ${s.title}`}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-[var(--r-full)] px-3 font-mono text-[13px] tracking-[0.08em] transition-colors ${
                isActive
                  ? "font-bold text-[var(--accent)]"
                  : isDone
                    ? "text-[var(--text)]"
                    : "text-[var(--muted-2)] hover:text-[var(--text)]"
              }`}
            >
              {isDone ? (
                <Check className="h-4 w-4 text-[var(--win)]" aria-hidden="true" />
              ) : null}
              <span>{String(idx + 1).padStart(2, "0")}</span>
            </button>
          );
        })}
      </nav>

      {/* Active step — keyed by step so the slide-up animation replays on change */}
      <div
        key={step}
        className="mt-[var(--gap-2xl)] flex-1 animate-[slideUp_0.4s_ease-out]"
      >
        {step === 0 ? (
          <TitleStep
            head={STEPS[0]}
            titles={generatedContent.titles}
            titleSel={titleSel}
            setTitleSel={setTitleSel}
          />
        ) : null}
        {step === 1 ? (
          <ThumbnailStep
            head={STEPS[1]}
            frames={analysisResult.frames}
            thumbnailFrameIndices={analysisResult.thumbnailFrameIndices}
            thumbSel={thumbSel}
            setThumbSel={setThumbSel}
            userThumb={userThumb}
            setUserThumb={setUserThumb}
          />
        ) : null}
        {step === 2 ? (
          <DescriptionStep
            head={STEPS[2]}
            description={generatedContent.description}
          />
        ) : null}
        {step === 3 ? (
          <TagsStep
            head={STEPS[3]}
            tags={generatedContent.tags}
            tagsSel={tagsSel}
            setTagsSel={setTagsSel}
          />
        ) : null}
        {step === 4 ? (
          <RankStep
            head={STEPS[4]}
            overallScore={generatedContent.overallScore}
            title={generatedContent.titles[titleSel]}
            description={generatedContent.description}
            tags={tagsSel}
            frames={analysisResult.frames}
            thumbSel={thumbSel}
            userThumb={userThumb}
          />
        ) : null}
      </div>

      {/* Footer — Back hidden on first step, Next hidden on last step */}
      <div className="mt-[var(--gap-2xl)] flex items-center justify-between">
        {step > 0 ? (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="h-auto min-h-[44px] border border-[var(--border)] bg-transparent px-[var(--gap-lg)] text-[var(--text)] hover:bg-[var(--surface)] dark:border-[var(--border)] dark:bg-transparent dark:hover:bg-[var(--surface)]"
          >
            ← Back
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}
        {step < LAST_STEP ? (
          <Button
            onClick={() => setStep(step + 1)}
            className="h-auto min-h-[44px] border border-[var(--accent)] bg-[var(--accent)] px-[var(--gap-lg)] text-white hover:bg-[var(--accent)]"
          >
            Next →
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </main>
  );
}
