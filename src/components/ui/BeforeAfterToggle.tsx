"use client";

// Small BEFORE/AFTER pill toggle, pinned to the top-right of a thumbnail
// preview. Swaps which image is displayed only — it never affects selection.
// Lives as a sibling of the selectable element (not nested inside it) so its
// clicks don't bubble into a parent <button>/<label>.

import { cn } from "@/lib/utils";

interface BeforeAfterToggleProps {
  value: "before" | "after";
  onChange: (value: "before" | "after") => void;
}

const OPTIONS = ["before", "after"] as const;

export default function BeforeAfterToggle({ value, onChange }: BeforeAfterToggleProps) {
  return (
    <div className="absolute right-2 top-2 z-10 flex gap-1 font-mono text-[9.5px] font-semibold tracking-[0.08em]">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onChange(option);
          }}
          aria-pressed={value === option}
          aria-label={`Show ${option} image`}
          className={cn(
            "min-h-[24px] rounded-[var(--r-full)] px-2 py-1 uppercase backdrop-blur-sm transition-colors",
            value === option
              ? "bg-[var(--accent)] text-white"
              : "bg-black/40 text-white/80 hover:bg-black/60"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
