"use client";

// Reusable thumbnail option card. Shows a raw image (base64 frame or an
// uploaded preview) at 16:9. Canvas enhancement + BEFORE/AFTER toggle land in
// a later prompt; for now this just renders the image and the selection state.
// Selected = 2px gradient border + glow; unselected = 1px border, lighten on hover.

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface ThumbnailCardProps {
  imageSrc: string;
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
  imageSrc,
  isSelected,
  onSelect,
  label = "thumbnail option",
}: ThumbnailCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Select ${label}`}
      style={isSelected ? selectedGradientStyle : undefined}
      className={cn(
        "relative block aspect-video w-full overflow-hidden rounded-[var(--r-lg)] transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        isSelected
          ? "border-2 border-transparent shadow-[0_6px_18px_-10px_var(--accent)]"
          : "border border-[var(--border)] hover:border-[var(--muted-2)]"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- base64/object-url image, not a static asset */}
      <img
        src={imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    </button>
  );
}
