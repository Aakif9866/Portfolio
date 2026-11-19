/**
 * The one way the workspace talks to an AI model: a plain fetch to an OpenAI-compatible
 * `/chat/completions` endpoint. DeepSeek by default; Groq, Gemini (OpenAI-compatible
 * endpoint), OpenRouter or a local server work by changing three env values:
 *
 *   AI_API_KEY      (or DEEPSEEK_API_KEY)   server-only, never NEXT_PUBLIC_
 *   AI_BASE_URL     default https://api.deepseek.com
 *   AI_MODEL        default deepseek-chat
 *   AI_MONTHLY_TOKEN_CAP   default 2,000,000 tokens; calls are refused past it
 *
 * Server-only: imported by Server Actions behind requireAdmin(), never by a client component.
 * Only ever called when the admin presses an AI button.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatResult = { ok: true; text: string; tokens: number } | { ok: false; message: string };
type Env = Record<string, string | undefined>;

export function aiConfig(env: Env = process.env) {
  const key = env.AI_API_KEY || env.DEEPSEEK_API_KEY || "";
  return {
    enabled: key.length > 0,
    key,
    baseUrl: (env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, ""),
    model: env.AI_MODEL || "deepseek-chat",
    monthlyCap: Number(env.AI_MONTHLY_TOKEN_CAP) > 0 ? Number(env.AI_MONTHLY_TOKEN_CAP) : 2_000_000,
  };
}

export async function chat(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {},
  deps: { fetch?: typeof fetch; env?: Env } = {},
): Promise<ChatResult> {
  const cfg = aiConfig(deps.env);
  if (!cfg.enabled) return { ok: false, message: "AI isn't set up: add AI_API_KEY (or DEEPSEEK_API_KEY) to the environment." };
  const doFetch = deps.fetch ?? fetch;

  let res: Response;
  try {
    res = await doFetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({ model: cfg.model, messages, max_tokens: opts.maxTokens ?? 800, temperature: opts.temperature ?? 0.3, stream: false }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error && e.name === "TimeoutError" ? "The AI took too long to answer. Try again." : "Couldn't reach the AI provider." };
  }

  // Provider error bodies can echo request details; only the status is shown.
  if (res.status === 401 || res.status === 403) return { ok: false, message: "The AI provider rejected the API key." };
  if (res.status === 402) return { ok: false, message: "The AI account is out of credit." };
  if (res.status === 429) return { ok: false, message: "The AI provider is rate-limiting requests. Wait a minute and try again." };
  if (!res.ok) return { ok: false, message: `The AI provider returned an error (HTTP ${res.status}).` };

  try {
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, message: "The AI returned an empty answer." };
    return { ok: true, text, tokens: Number(body.usage?.total_tokens) || 0 };
  } catch {
    return { ok: false, message: "The AI returned something that wasn't valid JSON." };
  }
}

/* ── monthly usage cap ────────────────────────────────────────────────────── */

export const AI_USAGE_KEY = "ai_usage";
export type AiUsage = { month: string; tokens: number; calls: number };

export const monthOf = (now = new Date()) => now.toISOString().slice(0, 7);

/** This month's usage; a stored value from an earlier month counts as zero. */
export function currentUsage(stored: unknown, now = new Date()): AiUsage {
  const u = stored as Partial<AiUsage> | null;
  return u && u.month === monthOf(now) ? { month: u.month, tokens: Number(u.tokens) || 0, calls: Number(u.calls) || 0 } : { month: monthOf(now), tokens: 0, calls: 0 };
}

export const addUsage = (u: AiUsage, tokens: number): AiUsage => ({ ...u, tokens: u.tokens + tokens, calls: u.calls + 1 });
