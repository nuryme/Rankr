"use client";

// Reusable thumbnail option card. Shows the original frame/upload at 16:9,
// or — once enhancement finishes — the canvas-enhanced ('graphics') version
// with a BEFORE/AFTER toggle. While enhancement runs, an EnhancingOverlay
// covers the card with the cycling status label.
// Selected = 2px gradient border + glow; unselected = 1px border, lighten on hover.

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import BeforeAfterToggle from "@/components/ui/BeforeAfterToggle";
import EnhancingOverlay from "@/components/ui/EnhancingOverlay";

interface ThumbnailCardProps {
  originalSrc: string;
  enhancedSrc: string | null;
  isEnhancing: boolean;
  enhancingLabel: string;
  isSelected: boolean;
  onSelect: () => void;
  label?: string;
}

// 2px gradient border via the dual-background / background-clip trick: the
// inner solid layer fills the padding box, the gradient fills the border box.
const selectedGradientStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--bg), var(--bg)), linear-gradient(135deg, var(--grad-a), var(--grad-b))",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

export default function ThumbnailCard({
  originalSrc,
  enhancedSrc,
  isEnhancing,
  enhancingLabel,
  isSelected,
  onSelect,
  label = "thumbnail option",
}: ThumbnailCardProps) {
  const [showBefore, setShowBefore] = useState(false);
  const displaySrc = showBefore || !enhancedSrc ? originalSrc : enhancedSrc;

  return (
    <div
      style={isSelected ? selectedGradientStyle : undefined}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-[var(--r-lg)] transition-all",
        isSelected
          ? "border-2 border-transparent shadow-[0_6px_18px_-10px_var(--accent)]"
          : "border border-[var(--border)] hover:border-[var(--muted-2)]"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        aria-label={`Select ${label}`}
        className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- base64/data-url image, not a static asset */}
        <img
          src={displaySrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </button>

      {isEnhancing ? (
        <EnhancingOverlay label={enhancingLabel} />
      ) : enhancedSrc ? (
        <BeforeAfterToggle
          value={showBefore ? "before" : "after"}
          onChange={(value) => setShowBefore(value === "before")}
        />
      ) : null}
    </div>
  );
}
