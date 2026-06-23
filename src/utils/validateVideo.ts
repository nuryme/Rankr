export const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 * 1024;
export const MAX_DURATION_SECONDS = 600;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];

export async function validateVideoFile(file: File): Promise<string | null> {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return "Please upload an MP4 or MOV video file.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Video must be smaller than 3GB.";
  }

  const duration = await getVideoDuration(file);
  if (duration > MAX_DURATION_SECONDS) {
    return "Video must be 10 minutes or shorter.";
  }

  return null;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video file."));
    };

    video.src = url;
  });
}
