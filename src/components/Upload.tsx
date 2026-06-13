"use client";

import { useId, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { validateVideoFile } from "@/utils/validateVideo";

interface UploadProps {
  onFileAccepted: (file: File) => void;
}

export default function Upload({ onFileAccepted }: UploadProps) {
  const inputId = useId();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setError(null);
    setIsValidating(true);
    const validationError = await validateVideoFile(file);
    setIsValidating(false);

    if (validationError) {
      setError(validationError);
      return;
    }

    onFileAccepted(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    void handleFiles(event.dataTransfer.files);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-160 text-center">
        <h1 className="font-heading text-[clamp(40px,5vw,48px)] font-bold tracking-[-0.02em] text-(--text)">
          RANKR
        </h1>
        <p className="mt-3 text-[clamp(16px,2.2vw,19px)] leading-[1.55] text-muted">
          Drop a video to get AI-generated titles, thumbnails, descriptions, and tags.
        </p>

        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`mt-8 flex cursor-pointer flex-col items-center gap-(--gap-md) rounded-(--r-xl) border-2 border-dashed bg-(--surface) px-8 py-12 text-center transition-colors hover:border-accent hover:bg-(--surface-2) sm:px-12 ${
            isDragOver
              ? "border-accent bg-(--surface-2)"
              : "border-border"
          }`}
        >
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-(--surface-2)">
            <UploadCloud className="h-5 w-5 text-muted" aria-hidden="true" />
          </div>

          <p className="text-(--text)">
            <span className="font-medium">Drop your video here or click to upload</span>
            <span className="text-muted"> · MP4 / MOV · up to 10 min, 1GB</span>
          </p>

          {isValidating && (
            <p className="text-sm text-muted" role="status">
              Checking video...
            </p>
          )}

          <input
            id={inputId}
            type="file"
            accept="video/mp4,video/quicktime"
            className="sr-only"
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-(--gap-md) rounded-(--r-md) border border-accent bg-(--surface) px-(--gap-md) py-(--gap-sm) text-sm text-(--text)"
          >
            {error}
          </p>
        )}

        <p className="mt-(--gap-xl) text-sm leading-[1.55] text-(--muted-2)">
          Frames from your video are sent to Google&apos;s Gemini API for analysis.
          Nothing is uploaded to or stored on a server.
        </p>
      </div>
    </main>
  );
}
