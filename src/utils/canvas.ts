// Canvas-based thumbnail enhancement. Runs entirely client-side: load the
// source image (data: or object: URL — both same-origin, so the canvas never
// taints) into an offscreen <canvas>, apply a color grade via ctx.filter, and
// return a JPEG data URL ready to display or download.

// Color grade: +16% contrast, +45% saturation, +5% brightness (DESIGN_QUICK_REF
// "Color Grade Variant"). Canvas's 2D `filter` accepts the same syntax as CSS
// filter, so this is a single draw — no per-pixel manipulation needed.
const GRADE_FILTER = "contrast(116%) saturate(145%) brightness(105%)";

export function enhanceImage(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not create canvas context."));
          return;
        }

        ctx.filter = GRADE_FILTER;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch (err) {
        reject(
          err instanceof Error ? err : new Error("Canvas enhancement failed.")
        );
      }
    };

    img.onerror = () => reject(new Error("Could not load image for enhancement."));
    img.src = imageSrc;
  });
}
