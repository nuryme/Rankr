"use client";

// Step 1 — Title selection. Renders the 4 real titles from
// generatedContent.titles as SelectCards in a 2x2 grid, staggered fade-in.

import type { Dispatch, SetStateAction } from "react";
import StepHead, { type StepHeadProps } from "@/components/ui/StepHead";
import SelectCard from "@/components/ui/SelectCard";

interface TitleStepProps {
  head: StepHeadProps;
  titles: string[];
  titleSel: number;
  setTitleSel: Dispatch<SetStateAction<number>>;
}

export default function TitleStep({
  head,
  titles,
  titleSel,
  setTitleSel,
}: TitleStepProps) {
  return (
    <section>
      <StepHead {...head} />
      <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2">
        {titles.map((title, i) => (
          <div
            key={i}
            className="animate-stagger-fade-in"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <SelectCard
              title={title}
              isSelected={i === titleSel}
              onSelect={() => setTitleSel(i)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
