import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isFetchableUrl } from "./entries";

const MAX_REDIRECTS = 5;

/** The host check, applied to the URL and to every address its name resolves to. */
async function isSafeTarget(url: string) {
  if (!isFetchableUrl(url)) return false;
  const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return true;
  try {
    const addrs = await lookup(host, { all: true });
    return addrs.length > 0 && addrs.every((a) => isFetchableUrl(a.family === 6 ? `http://[${a.address}]/` : `http://${a.address}/`));
  } catch {
    return false;
  }
}

/**
 * Fetch a public web page's HTML for link previews and AI summaries. Server-only (plain
 * module, not a Server Action, so it can't be called from the browser). Refuses private
 * hosts (checked again on every redirect hop and on resolved addresses), stops after
 * `maxBytes`, and returns null on any failure instead of throwing.
 *
 * ponytail: DNS is checked, then fetch resolves again, so a rebinding DNS server could still
 * swap the address in between; pin the resolved IP with a custom agent if that ever matters.
 */
export async function fetchPage(url: string, { timeoutMs = 4000, maxBytes = 256 * 1024 } = {}): Promise<{ html: string; url: string } | null> {
  try {
    const signal = AbortSignal.timeout(timeoutMs);
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isSafeTarget(url))) return null;
      res = await fetch(url, {
        signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; PortfolioLinkPreview/1.0)", accept: "text/html" },
        redirect: "manual",
      });
      const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!location) break;
      url = new URL(location, url).toString();
      res = null;
    }
    if (!res) return null;
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
    return { html: new TextDecoder().decode(Buffer.concat(chunks)), url };
  } catch {
    return null;
  }
}
