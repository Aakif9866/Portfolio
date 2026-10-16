/**
 * Every public-page query goes through fetchOrThrow, so a failed query can
 * never be mistaken for "no rows".
 *
 *  - Success with zero rows → returned as-is (a genuine empty state).
 *  - Transient failure (network, timeout, 5xx) → retried, bounded.
 *  - Anything still failing → throws DataUnavailableError.
 *
 * What a throw does, by context:
 *  - `next build`: the build fails, so Vercel keeps the previous deployment
 *    instead of shipping empty pages.
 *  - ISR revalidation (every 5 min): Next keeps serving the last good page.
 *  - First on-demand render: the route's error boundary shows a retry page.
 *
 * Logs carry only the query label, an error code and the attempt count —
 * never the URL, keys or the raw database message.
 */

type DbError = { code?: string; message?: string };
type DbResponse = { data: unknown; error: DbError | null };

export class DataUnavailableError extends Error {
  constructor(what: string) {
    super(`Couldn't load ${what} from the database.`);
    this.name = "DataUnavailableError";
  }
}

/**
 * Only a well-formed database answer is final. A PostgREST code (PGRST…) or
 * a Postgres SQLSTATE (5 chars) means the query reached the database and
 * failed for a real reason — retrying would repeat it — except PostgREST's
 * connection errors (PGRST000–003) and Postgres classes 08 connection,
 * 53 resources, 57 timeout/shutdown and 40001 serialization.
 * Anything else — no code, a DOMException code ("20" abort, "23" timeout),
 * a Node/undici network code (ECONNRESET, UND_ERR_…) — never got a database
 * answer, so it is worth retrying.
 */
export function isTransient(e: DbError): boolean {
  const code = String(e.code ?? "");
  if (/^PGRST\d{3}$/.test(code)) return /^PGRST00[0-3]$/.test(code);
  if (/^[0-9A-Z]{5}$/.test(code)) return /^(08|53|57)/.test(code) || code === "40001";
  return true;
}

export type RetryOptions = { attempts?: number; timeoutMs?: number; backoffMs?: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run a Supabase query with a per-attempt timeout and bounded retries.
 * `run` receives an AbortSignal to pass to `.abortSignal(signal)` and must
 * build a fresh query each call.
 * Worst case with defaults: 3 attempts × 8 s + 0.4 s + 1.2 s backoff ≈ 26 s.
 */
export async function fetchOrThrow<R extends DbResponse>(
  what: string,
  run: (signal: AbortSignal) => PromiseLike<R>,
  { attempts = 3, timeoutMs = 8_000, backoffMs = 400 }: RetryOptions = {},
): Promise<Extract<R, { error: null }>> {
  let last: DbError = {};
  let tries = 0;
  for (let i = 1; i <= attempts; i++) {
    tries = i;
    let error: DbError | null;
    try {
      const res = await run(AbortSignal.timeout(timeoutMs));
      if (!res.error) return res as Extract<R, { error: null }>;
      error = res.error;
    } catch (e) {
      // supabase-js reports failures as { error }, but a thrown abort/network error is handled the same way
      error = { code: "", message: e instanceof Error ? e.name : "unknown" };
    }
    last = error;
    if (!isTransient(last) || i === attempts) break;
    await sleep(backoffMs * 3 ** (i - 1));
  }
  console.error(JSON.stringify({ level: "error", event: "db.unavailable", what, code: last.code || "network", attempts: tries }));
  throw new DataUnavailableError(what);
}
