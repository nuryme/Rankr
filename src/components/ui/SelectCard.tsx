"use client";

// Reusable selection card (titles). Just the title text — no scores, no badges.
// Selected = 2px accent border + glow; unselected = 1px border, lighten on hover.

import { cn } from "@/lib/utils";

interface SelectCardProps {
  title: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function SelectCard({
  title,
  isSelected,
  onSelect,
}: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "w-full rounded-[var(--r-lg)] bg-[var(--surface)] px-5 py-[18px] text-left",
        "text-[19px] font-semibold leading-[1.25] text-[var(--text)] transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        isSelected
          ? "border-2 border-[var(--accent)] shadow-[0_6px_18px_-10px_var(--accent)]"
          : "border border-[var(--border)] hover:bg-[var(--surface-2)]"
      )}
    >
      {title}
    </button>
  );
}
