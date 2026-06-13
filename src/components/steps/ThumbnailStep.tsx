"use client";

// Step 2 — Thumbnail selection. Renders the AI-picked real video frames as
// ThumbnailCards plus an always-visible "upload your own" card. Canvas
// enhancement + BEFORE/AFTER toggle land in a later prompt; for now we show the
// raw frames / upload preview and wire up the thumbSel + userThumb selection.

import {
  useEffect,
  useMemo,
  type ChangeEvent,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import StepHead, { type StepHeadProps } from "@/components/ui/StepHead";
import ThumbnailCard from "@/components/ui/ThumbnailCard";

// thumbSel sentinel meaning "the custom upload is selected".
const CUSTOM = -1;

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
}

export default function ThumbnailStep({
  head,
  frames,
  thumbnailFrameIndices,
  thumbSel,
  setThumbSel,
  userThumb,
  setUserThumb,
}: ThumbnailStepProps) {
  const picks =
    thumbnailFrameIndices.length > 0
      ? thumbnailFrameIndices
      : frames.map((_, i) => i).slice(0, 4);

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

  return (
    <section>
      <StepHead {...head} />

      <div
        className="grid items-start gap-[var(--gap-md)]"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
        }}
      >
        {picks.map((frameIdx) => (
          <ThumbnailCard
            key={frameIdx}
            imageSrc={`data:image/jpeg;base64,${frames[frameIdx]}`}
            isSelected={!customSelected && thumbSel === frameIdx}
            onSelect={() => selectFrame(frameIdx)}
            label={`frame ${frameIdx + 1} as thumbnail`}
          />
        ))}

        {/* Upload-your-own card — always last, always visible. A <label> wraps
            the hidden input so clicking anywhere on the card opens the picker. */}
        <label
          style={customSelected ? selectedGradientStyle : undefined}
          className={cn(
            "relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-[var(--gap-sm)] overflow-hidden rounded-[var(--r-lg)] p-[var(--gap-xl)] text-center transition-all",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--accent)]",
            customSelected
              ? "border-2 border-transparent shadow-[0_6px_18px_-10px_var(--accent)]"
              : "border-[1.5px] border-dashed border-[var(--border)] hover:border-[var(--accent)]"
          )}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onUpload}
            aria-label="Upload your own thumbnail"
          />

          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- object-url preview, not a static asset
            <img
              src={previewUrl}
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
      </div>
    </section>
  );
}
