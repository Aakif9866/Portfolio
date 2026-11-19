import { isFetchableUrl } from "./entries";

/**
 * Fetch a public web page's HTML for link previews and AI summaries. Server-only (plain
 * module, not a Server Action, so it can't be called from the browser). Refuses private
 * hosts, stops after `maxBytes`, and returns null on any failure instead of throwing.
 */
export async function fetchPage(url: string, { timeoutMs = 4000, maxBytes = 256 * 1024 } = {}): Promise<{ html: string; url: string } | null> {
  if (!isFetchableUrl(url)) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "Mozilla/5.0 (compatible; PortfolioLinkPreview/1.0)", accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok || !res.body || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return { html: new TextDecoder().decode(Buffer.concat(chunks)), url: res.url || url };
  } catch {
    return null;
  }
}
