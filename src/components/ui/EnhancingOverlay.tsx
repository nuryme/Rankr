"use client";

// Full-card overlay shown while canvas enhancement runs. Shared by the AI
// frame cards and the custom-upload card so the animation is identical for
// both (DESIGN_QUICK_REF "Enhancement Steps").

import { LoaderCircle } from "lucide-react";

export default function EnhancingOverlay({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/55 px-4 text-center backdrop-blur-[1px]"
    >
      <LoaderCircle className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
      <span className="font-mono text-[11px] tracking-[0.06em] text-white">{label}</span>
    </div>
  );
}
