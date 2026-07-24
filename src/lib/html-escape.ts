/** HTML text escaping for map popups and similar string templates. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Allow only http: / https: URLs for user-supplied links.
 * Blocks javascript:, data:, vbscript:, and other schemes.
 */
export function getSafeHttpUrl(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

/** JSON-LD inside <script> — neutralize </script> breakout characters. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
