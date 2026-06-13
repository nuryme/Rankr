// Step 5 — animated overall score ring + the final paste-ready export package
// (selected title, description, selected tags). The score is the static Stage 2
// value; it animates to the same number every time the step is entered.

import StepHead, { type StepHeadProps } from "@/components/ui/StepHead";
import ScoreRing from "@/components/ui/ScoreRing";
import ExportPackage from "@/components/ui/ExportPackage";

interface RankStepProps {
  head: StepHeadProps;
  overallScore: number;
  title: string;
  description: string;
  tags: string[];
  frames: string[];
  thumbSel: number;
  userThumb: File | null;
}

export default function RankStep({
  head,
  overallScore,
  title,
  description,
  tags,
  frames,
  thumbSel,
  userThumb,
}: RankStepProps) {
  return (
    <section>
      <StepHead {...head} />

      <div className="flex flex-col items-center gap-[var(--gap-sm)] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-[var(--gap-2xl)]">
        <ScoreRing score={overallScore} />
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
          Overall score
        </p>
      </div>

      <div className="mt-[var(--gap-2xl)]">
        <ExportPackage
          title={title}
          description={description}
          tags={tags}
          frames={frames}
          thumbSel={thumbSel}
          userThumb={userThumb}
        />
      </div>
    </section>
  );
}
