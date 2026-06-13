"use client";

// Final export panel: the selected title, the description, and the selected
// tags composed into one paste-ready block, plus a thumbnail download (YouTube
// requires the thumbnail as a file upload — it can't be pasted). "Copy All"
// uses the async Clipboard API; if that fails it reveals a textarea fallback
// for manual select + copy.

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/utils/clipboard";
import { downloadImage, slugify } from "@/utils/download";
import type { ThumbnailEnhancementCache } from "@/types";

interface ExportPackageProps {
  title: string;
  description: string;
  tags: string[];
  // Selected thumbnail: a raw video frame (base64 JPEG) or a custom upload.
  frames: string[];
  thumbSel: number;
  userThumb: File | null;
  // Canvas-enhanced ('graphics') versions, keyed the same way as the
  // selection above — used in preference to the raw frame/upload when ready.
  enhancementCache: ThumbnailEnhancementCache;
}

// thumbSel sentinel meaning "the custom upload is selected" (matches ThumbnailStep).
const CUSTOM = -1;

export default function ExportPackage({
  title,
  description,
  tags,
  frames,
  thumbSel,
  userThumb,
  enhancementCache,
}: ExportPackageProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackRef = useRef<HTMLTextAreaElement | null>(null);

  const exportText = useMemo(
    () =>
      `TITLE\n${title}\n\nDESCRIPTION\n${description}\n\nTAGS\n${tags.join(", ")}`,
    [title, description, tags]
  );

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (dlTimeoutRef.current) clearTimeout(dlTimeoutRef.current);
    };
  }, []);

  // Auto-select the fallback text so the user can copy immediately.
  useEffect(() => {
    if (showFallback && fallbackRef.current) {
      fallbackRef.current.focus();
      fallbackRef.current.select();
    }
  }, [showFallback]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(exportText);
    if (ok) {
      setShowFallback(false);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } else {
      setShowFallback(true);
    }
  };

  const handleDownloadThumbnail = () => {
    const stem = slugify(title);
    if (thumbSel === CUSTOM && userThumb) {
      const enhanced =
        enhancementCache.custom?.file === userThumb
          ? enhancementCache.custom.enhanced
          : null;
      if (enhanced) {
        // Canvas-enhanced ('graphics') version of the custom upload.
        downloadImage(enhanced, `${stem}.jpg`);
      } else {
        // Enhancement not ready (or failed) — download the original file untouched.
        const ext = userThumb.name.split(".").pop()?.toLowerCase() || "png";
        const url = URL.createObjectURL(userThumb);
        downloadImage(url, `${stem}.${ext}`, true);
      }
    } else {
      // Canvas-enhanced ('graphics') frame, falling back to the raw video
      // frame if enhancement hasn't finished (or failed).
      const enhanced = enhancementCache.frames[thumbSel];
      const frame = frames[thumbSel];
      if (!enhanced && !frame) return;
      downloadImage(enhanced ?? `data:image/jpeg;base64,${frame}`, `${stem}.jpg`);
    }
    setDownloaded(true);
    if (dlTimeoutRef.current) clearTimeout(dlTimeoutRef.current);
    dlTimeoutRef.current = setTimeout(() => setDownloaded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-[var(--gap-md)]">
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-[var(--gap-lg)] font-mono text-[12px] leading-[1.6] text-[var(--text)]">
        {exportText}
      </pre>

      <div className="flex flex-wrap items-center gap-[var(--gap-md)]">
        <Button
          onClick={handleCopy}
          className="h-auto min-h-[44px] border border-[var(--accent)] bg-[var(--accent)] px-[var(--gap-lg)] text-white hover:bg-[var(--accent)] hover:brightness-110"
        >
          Copy All
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadThumbnail}
          className="h-auto min-h-[44px] border border-[var(--border)] bg-transparent px-[var(--gap-lg)] text-[var(--text)] hover:bg-[var(--surface)] dark:border-[var(--border)] dark:bg-transparent dark:hover:bg-[var(--surface)]"
        >
          Download Thumbnail
        </Button>

        {/* Polite live region so confirmations are announced. */}
        <span aria-live="polite" className="font-mono text-[12px] text-[var(--win)]">
          {copied
            ? "✓ Copied! Paste in YouTube Studio"
            : downloaded
              ? "✓ Thumbnail downloaded"
              : ""}
        </span>
      </div>

      {showFallback ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Copy metadata manually"
          className="flex flex-col gap-[var(--gap-sm)] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-[var(--gap-lg)]"
        >
          <p className="text-[14px] text-[var(--muted)]">
            Couldn&apos;t access the clipboard. Select the text below and copy it
            manually (Ctrl/Cmd + C).
          </p>
          <label htmlFor="export-fallback" className="sr-only">
            Export metadata
          </label>
          <textarea
            id="export-fallback"
            ref={fallbackRef}
            readOnly
            value={exportText}
            rows={10}
            className="w-full resize-y rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)] p-[var(--gap-md)] font-mono text-[12px] leading-[1.6] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          />
          <div>
            <Button
              variant="outline"
              onClick={() => setShowFallback(false)}
              className="h-auto min-h-[44px] border border-[var(--border)] bg-transparent px-[var(--gap-lg)] text-[var(--text)] hover:bg-[var(--surface-2)] dark:border-[var(--border)] dark:bg-transparent dark:hover:bg-[var(--surface-2)]"
            >
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
