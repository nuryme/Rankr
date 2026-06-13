"use client";

// Step 4 — renders the real generated tags as multi-select pills. Tags start
// all selected (default set in RankrApp when generatedContent loads); clicking
// a pill toggles it. A live count sits above the grid.

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import StepHead, { type StepHeadProps } from "@/components/ui/StepHead";
import TagPill from "@/components/ui/TagPill";

interface TagsStepProps {
  head: StepHeadProps;
  tags: string[];
  tagsSel: string[];
  setTagsSel: Dispatch<SetStateAction<string[]>>;
}

export default function TagsStep({
  head,
  tags,
  tagsSel,
  setTagsSel,
}: TagsStepProps) {
  const toggleTag = useCallback(
    (tag: string) => {
      setTagsSel((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    },
    [setTagsSel]
  );

  return (
    <section>
      <StepHead {...head} />

      <p
        aria-live="polite"
        className="mb-[var(--gap-md)] font-mono text-[11px] tracking-[0.06em] text-[var(--muted-2)]"
      >
        Selected: {tagsSel.length} of {tags.length}
      </p>

      <div className="flex flex-wrap gap-[var(--gap-xs)]">
        {tags.map((tag) => (
          <TagPill
            key={tag}
            label={tag}
            isSelected={tagsSel.includes(tag)}
            onToggle={() => toggleTag(tag)}
          />
        ))}
      </div>
    </section>
  );
}
