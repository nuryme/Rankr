// Browser download helpers. Triggers a file download from a data URL or object
// URL via a synthetic <a download> click. Object URLs are revoked after; pass
// `revoke: true` for those (data URLs need no cleanup).

export function downloadImage(
  src: string,
  filename: string,
  revoke = false
): void {
  const a = document.createElement("a");
  a.href = src;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) URL.revokeObjectURL(src);
}

// Turn a title into a safe, lowercase, hyphenated filename stem. Falls back to
// "thumbnail" when the title has no usable characters.
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "thumbnail";
}
