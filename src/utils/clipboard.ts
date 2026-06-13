// Clipboard helper. Returns false instead of throwing so callers can fall back
// to a manual-copy UI when the async Clipboard API is unavailable (insecure
// origin, permissions denied, older browsers).

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
