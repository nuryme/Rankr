"use client";

// Reusable multi-select tag pill. Selected = accent bg + white bold text;
// unselected = 1px border, transparent bg, muted text. Both states lighten
// on hover. Mono 11px label per DESIGN_QUICK_REF tag spec.

import { cn } from "@/lib/utils";

interface TagPillProps {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
}

export default function TagPill({ label, isSelected, onToggle }: TagPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      className={cn(
        "inline-flex min-h-[44px] items-center rounded-[var(--r-full)] px-[var(--gap-md)]",
        "font-mono text-[11px] tracking-[0.06em] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        isSelected
          ? "border border-[var(--accent)] bg-[var(--accent)] font-bold text-white hover:brightness-110"
          : "border border-[var(--border)] bg-transparent text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
      )}
    >
      {label}
    </button>
  );
}
