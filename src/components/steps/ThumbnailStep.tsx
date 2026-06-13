"use client";

// Step 2 — Thumbnail selection. Renders the AI-picked real video frames as
// ThumbnailCards plus an always-visible "upload your own" card. Both the AI
// frames and a custom upload run through the same canvas enhancement pipeline
// (utils/canvas.ts) with a shared "Enhancing..." animation, then expose a
// BEFORE/AFTER toggle. Enhanced output is cached in enhancementCache (lifted
// to RankrApp) so revisiting this step — or switching steps and coming back —
// doesn't re-run canvas work or replay the animation.

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { enhanceImage } from "@/utils/canvas";
import StepHead, { type StepHeadProps } from "@/components/ui/StepHead";
import ThumbnailCard from "@/components/ui/ThumbnailCard";
import BeforeAfterToggle from "@/components/ui/BeforeAfterToggle";
import EnhancingOverlay from "@/components/ui/EnhancingOverlay";
import type { ThumbnailEnhancementCache } from "@/types";

// thumbSel sentinel meaning "the custom upload is selected".
const CUSTOM = -1;

// DESIGN_QUICK_REF "Enhancement Steps" — cycled while enhanceImage runs.
const ENHANCE_LABELS = [
  "Analyzing composition…",
  "Boosting contrast & clarity…",
  "Punching color saturation…",
  "Finalizing enhancement…",
];
const ENHANCE_ANIMATION_MS = 2000;
const LABEL_INTERVAL_MS = ENHANCE_ANIMATION_MS / ENHANCE_LABELS.length;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Same gradient-border trick as ThumbnailCard, applied to the upload card when
// the custom image is the active selection.
const selectedGradientStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--bg), var(--bg)), linear-gradient(135deg, var(--grad-a), var(--grad-b))",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

interface ThumbnailStepProps {
  head: StepHeadProps;
  frames: string[];
  thumbnailFrameIndices: number[];
  thumbSel: number;
  setThumbSel: Dispatch<SetStateAction<number>>;
  userThumb: File | null;
  setUserThumb: Dispatch<SetStateAction<File | null>>;
  enhancementCache: ThumbnailEnhancementCache;
  setEnhancementCache: Dispatch<SetStateAction<ThumbnailEnhancementCache>>;
}

export default function ThumbnailStep({
  head,
  frames,
  thumbnailFrameIndices,
  thumbSel,
  setThumbSel,
  userThumb,
  setUserThumb,
  enhancementCache,
  setEnhancementCache,
}: ThumbnailStepProps) {
  const picks = useMemo(
    () =>
      thumbnailFrameIndices.length > 0
        ? thumbnailFrameIndices
        : frames.map((_, i) => i).slice(0, 4),
    [thumbnailFrameIndices, frames]
  );

  // Build an object URL for the uploaded file; revoke it when it changes/unmounts.
  const previewUrl = useMemo(
    () => (userThumb ? URL.createObjectURL(userThumb) : null),
    [userThumb]
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const customSelected = thumbSel === CUSTOM;

  // --- Enhancement state -------------------------------------------------
  // "Pending" doubles as "currently enhancing" — it's true from first render
  // until enhancementCache holds a result, whether that result came from a
  // successful enhance or the error fallback below.
  const [labelIdx, setLabelIdx] = useState(0);
  const [customShowBefore, setCustomShowBefore] = useState(false);

  const framesPending = picks.some((idx) => !(idx in enhancementCache.frames));

  const customPending =
    userThumb !== null && enhancementCache.custom?.file !== userThumb;

  // Enhance the 4 AI-picked frames once (cached in enhancementCache).
  useEffect(() => {
    if (!framesPending) return;

    let cancelled = false;
    const start = Date.now();

    Promise.all(
      picks.map(async (idx) => {
        const enhanced = await enhanceImage(`data:image/jpeg;base64,${frames[idx]}`);
        return [idx, enhanced] as const;
      })
    )
      .then(async (entries) => {
        const remaining = ENHANCE_ANIMATION_MS - (Date.now() - start);
        if (remaining > 0) await wait(remaining);
        if (cancelled) return;
        setEnhancementCache((prev) => ({
          ...prev,
          frames: Object.fromEntries(entries),
        }));
      })
      .catch((err) => {
        console.error("Thumbnail enhancement failed:", err);
        if (cancelled) return;
        // Fall back to the unenhanced frames so the UI doesn't stay stuck
        // showing the "Enhancing..." overlay.
        setEnhancementCache((prev) => ({
          ...prev,
          frames: Object.fromEntries(
            picks.map((idx) => [idx, `data:image/jpeg;base64,${frames[idx]}`])
          ),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [framesPending, picks, frames, setEnhancementCache]);

  // Enhance a freshly uploaded custom thumbnail (same pipeline + animation).
  // Reuses the memoized previewUrl as the enhancement input — no separate
  // object URL to create/revoke.
  useEffect(() => {
    if (!customPending || !userThumb || !previewUrl) return;

    let cancelled = false;
    const start = Date.now();

    enhanceImage(previewUrl)
      .then(async (enhanced) => {
        const remaining = ENHANCE_ANIMATION_MS - (Date.now() - start);
        if (remaining > 0) await wait(remaining);
        if (cancelled) return;
        setCustomShowBefore(false);
        setEnhancementCache((prev) => ({
          ...prev,
          custom: { file: userThumb, enhanced },
        }));
      })
      .catch((err) => {
        console.error("Custom thumbnail enhancement failed:", err);
        if (cancelled) return;
        // Fall back to the original upload so the UI doesn't stay stuck
        // showing the "Enhancing..." overlay.
        setCustomShowBefore(false);
        setEnhancementCache((prev) => ({
          ...prev,
          custom: { file: userThumb, enhanced: previewUrl },
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [customPending, userThumb, previewUrl, setEnhancementCache]);

  // Cycle the status label while either enhancement is in flight.
  useEffect(() => {
    if (!framesPending && !customPending) return;
    const id = setInterval(() => {
      setLabelIdx((i) => (i + 1) % ENHANCE_LABELS.length);
    }, LABEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [framesPending, customPending]);

  const enhancingLabel = ENHANCE_LABELS[labelIdx];

  const selectFrame = (index: number) => {
    setThumbSel(index);
    setUserThumb(null); // picking a frame clears any custom upload
  };

  const onUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUserThumb(file);
    setThumbSel(CUSTOM);
    event.target.value = ""; // allow re-picking the same file later
  };

  const customEnhancedSrc = customPending
    ? null
    : enhancementCache.custom?.enhanced ?? null;
  const showCustomOverlay = customPending;
  const customDisplaySrc =
    customShowBefore || !customEnhancedSrc ? previewUrl : customEnhancedSrc;

  return (
    <section>
      <StepHead {...head} />

      <div
        className="grid items-start gap-[var(--gap-md)]"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
        }}
      >
        {picks.map((frameIdx) => {
          const enhancedSrc = framesPending
            ? null
            : enhancementCache.frames[frameIdx] ?? null;
          return (
            <ThumbnailCard
              key={frameIdx}
              originalSrc={`data:image/jpeg;base64,${frames[frameIdx]}`}
              enhancedSrc={enhancedSrc}
              isEnhancing={framesPending}
              enhancingLabel={enhancingLabel}
              isSelected={!customSelected && thumbSel === frameIdx}
              onSelect={() => selectFrame(frameIdx)}
              label={`frame ${frameIdx + 1} as thumbnail`}
            />
          );
        })}

        {/* Upload-your-own card — always last, always visible. A <label> wraps
            the hidden input so clicking anywhere on the card opens the picker.
            The BEFORE/AFTER toggle + enhancing overlay are siblings of the
            <label>, positioned on top, so they don't trigger the file picker. */}
        <div
          style={customSelected ? selectedGradientStyle : undefined}
          className={cn(
            "relative aspect-video w-full overflow-hidden rounded-[var(--r-lg)] transition-all",
            customSelected
              ? "border-2 border-transparent shadow-[0_6px_18px_-10px_var(--accent)]"
              : "border-[1.5px] border-dashed border-[var(--border)] hover:border-[var(--accent)]"
          )}
        >
          <label
            className={cn(
              "absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-[var(--gap-sm)] p-[var(--gap-xl)] text-center",
              "focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--accent)]"
            )}
          >
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onUpload}
              aria-label="Upload your own thumbnail"
            />

            {customDisplaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- object-url/data-url preview, not a static asset
              <img
                src={customDisplaySrc}
                alt="Custom thumbnail preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[var(--surface-2)]">
                  <Upload className="h-5 w-5 text-[var(--text)]" aria-hidden="true" />
                </span>
                <span className="text-[16px] font-semibold text-[var(--text)]">
                  Upload your own thumbnail
                </span>
                <span className="font-mono text-[11px] tracking-[0.1em] text-[var(--muted)]">
                  PNG / JPG
                </span>
              </>
            )}
          </label>

          {previewUrl && showCustomOverlay ? (
            <EnhancingOverlay label={enhancingLabel} />
          ) : null}

          {previewUrl && !showCustomOverlay && customEnhancedSrc ? (
            <BeforeAfterToggle
              value={customShowBefore ? "before" : "after"}
              onChange={(value) => setCustomShowBefore(value === "before")}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
