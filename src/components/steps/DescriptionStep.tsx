"use client";

// Step 3 — Description. A single read-only block of the AI-generated
// description (formatting preserved) plus a Copy button that flashes green for
// 1.5s on success. No toggles, no sections — one static block.

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepHead, { type StepHeadProps } from "@/components/ui/StepHead";

interface DescriptionStepProps {
  head: StepHeadProps;
  description: string;
}

export default function DescriptionStep({
  head,
  description,
}: DescriptionStepProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the pending reset if the step unmounts mid-flash.
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / permission denied) — no-op.
    }
  };

  return (
    <section>
      <StepHead {...head} />

      <div className="mb-[var(--gap-md)] flex justify-end">
        <Button
          onClick={onCopy}
          aria-label="Copy description to clipboard"
          className={`h-auto min-h-[44px] border px-[var(--gap-lg)] text-white transition-colors ${
            copied
              ? "border-[var(--win)] bg-[var(--win)] hover:bg-[var(--win)]"
              : "border-[var(--accent)] bg-[var(--accent)] hover:bg-[var(--accent)]"
          }`}
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-[var(--gap-md)] text-[14px] leading-[1.6] text-[var(--text)]">
        {description}
      </div>

      {/* Screen-reader announcement of the copy result. */}
      <p role="status" aria-live="polite" className="sr-only">
        {copied ? "Description copied to clipboard" : ""}
      </p>
    </section>
  );
}
