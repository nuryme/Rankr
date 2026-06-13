// Client-side frame extraction. The video is never uploaded — we decode it
// locally in an off-screen <video>, sample evenly-spaced frames onto a <canvas>,
// and return raw base64 JPEGs (the form Gemini's vision API expects).
//
// This targets large, high-resolution sources (up to ~1GB / 4K / 10 min), so it
// is written defensively: every wait has a timeout (a stalled seek surfaces as a
// normal error + "Try Again" rather than an infinite spinner), and we wait for
// each frame to actually be *presented* before drawing, because on 4K sources the
// decoder often lags the `seeked` event and an immediate draw grabs a stale frame.

const FRAME_COUNT = 8;
// 1280px wide = YouTube's 1280×720 thumbnail standard. These frames double as the
// user's selectable thumbnails, so we keep enough resolution for that export while
// still being small enough to send to Gemini. Downscaled from 4K by the canvas.
const FRAME_WIDTH = 1280;
const JPEG_QUALITY = 0.8;

// Generous ceilings — a 4K seek can legitimately take a few seconds. These exist
// to catch a genuinely stuck decode, not to rush a slow-but-working one.
const METADATA_TIMEOUT_MS = 30_000;
const SEEK_TIMEOUT_MS = 30_000;
// The frame is usually ready the moment `seeked` fires; this is a short safety
// wait for the presented frame, after which we draw anyway rather than stall.
const FRAME_PRESENT_TIMEOUT_MS = 2_000;

export async function extractFrames(videoFile: File): Promise<string[]> {
  const video = document.createElement("video");
  const url = URL.createObjectURL(videoFile);

  // Muted + inline so browsers don't block the off-screen element.
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await waitForEvent(video, "loadedmetadata", METADATA_TIMEOUT_MS);

    const { duration, videoWidth, videoHeight } = video;
    if (!duration || !Number.isFinite(duration) || !videoWidth || !videoHeight) {
      throw new Error("Could not read video metadata.");
    }

    // Downscale to FRAME_WIDTH, preserving aspect ratio. Never upscale a source
    // smaller than the target.
    const scale = Math.min(FRAME_WIDTH / videoWidth, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(videoWidth * scale);
    canvas.height = Math.round(videoHeight * scale);

    // willReadFrequently: we read the canvas back via toDataURL once per frame, so
    // a CPU-backed canvas avoids repeated GPU readbacks on large images.
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not create canvas context.");

    const timestamps = pickTimestamps(duration);
    const frames: string[] = [];

    for (const t of timestamps) {
      video.currentTime = t;
      await waitForEvent(video, "seeked", SEEK_TIMEOUT_MS);
      await waitForPresentedFrame(video, FRAME_PRESENT_TIMEOUT_MS);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      frames.push(stripDataPrefix(dataUrl));
    }

    return frames;
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

// Evenly spaced timestamps, trimming a small margin off both ends so we don't
// grab the black frames that often bookend a clip.
function pickTimestamps(duration: number): number[] {
  const margin = Math.min(0.5, duration / 20);
  const start = margin;
  const end = duration - margin;
  const span = Math.max(end - start, 0);

  return Array.from(
    { length: FRAME_COUNT },
    (_, i) => start + (span * i) / (FRAME_COUNT - 1)
  );
}

function stripDataPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
}

// Resolves when `event` fires, rejects on a media error or if the wait exceeds
// `timeoutMs` (the case that would otherwise hang on a stuck large-file seek).
function waitForEvent(
  video: HTMLVideoElement,
  event: "loadedmetadata" | "seeked",
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Timed out waiting for "${event}". The video may be too large or in an unsupported format.`
        )
      );
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(event, onDone);
      video.removeEventListener("error", onError);
    };
    const onDone = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Failed to decode video for frame extraction."));
    };

    video.addEventListener(event, onDone, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

// Waits for the browser to actually present a decoded frame after a seek. Uses
// requestVideoFrameCallback where available (the precise signal that a new frame
// is on screen); otherwise falls back to a couple of animation frames. Always
// resolves — if the presented-frame signal never comes, we draw what we have
// rather than block extraction.
function waitForPresentedFrame(
  video: HTMLVideoElement,
  timeoutMs: number
): Promise<void> {
  const rvfc = (
    video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    }
  ).requestVideoFrameCallback;

  if (typeof rvfc === "function") {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, timeoutMs);
      rvfc.call(video, finish);
    });
  }

  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}
