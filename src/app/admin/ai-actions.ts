"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { AI_USAGE_KEY, addUsage, aiConfig, chat, currentUsage, type ChatMessage } from "@/lib/ai";
import { emailPrompt, htmlToText, improvePrompt, parseTailored, splitResume, structureLogPrompt, summarizePrompt, tailorPrompt, type EmailKind } from "@/lib/ai-prompts";
import { resumeKey, type StoredResume } from "@/lib/resume";
import { MAX_BODY } from "@/lib/entries";
import { fetchPage } from "@/lib/fetch-page";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * AI buttons in the entry editor. Each runs only when pressed, uses only that entry's own
 * fields (never the career profile or salary), checks the monthly token cap first, and
 * records usage after. Suggestions are returned for the admin to accept or discard; only a
 * link summary is saved directly, into that entry's meta.
 */
export type AiResult = { ok: true; text: string; tokens: number; month: number; cap: number } | { ok: false; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Db = Awaited<ReturnType<typeof supabaseServer>>;

async function run(supabase: Db, messages: ChatMessage[], maxTokens: number): Promise<AiResult> {
  const cfg = aiConfig();
  if (!cfg.enabled) return { ok: false, message: "AI isn't set up: add AI_API_KEY (or DEEPSEEK_API_KEY) to the environment." };

  const { data } = await supabase.from("private_config").select("value").eq("key", AI_USAGE_KEY).maybeSingle();
  const usage = currentUsage(data?.value);
  if (usage.tokens >= cfg.monthlyCap) {
    return { ok: false, message: `This month's AI limit (${cfg.monthlyCap.toLocaleString("en-IN")} tokens) is used up. Raise AI_MONTHLY_TOKEN_CAP to allow more.` };
  }

  const res = await chat(messages, { maxTokens });
  if (!res.ok) return res;
  // ponytail: read-modify-write; two simultaneous AI calls could undercount by one call.
  const next = addUsage(usage, res.tokens);
  await supabase.from("private_config").upsert({ key: AI_USAGE_KEY, value: next }, { onConflict: "key" });
  return { ok: true, text: res.text, tokens: res.tokens, month: next.tokens, cap: cfg.monthlyCap };
}

async function load(id: string) {
  const { supabase } = await requireAdmin();
  if (!UUID_RE.test(id)) return { supabase, entry: null, error: "Invalid entry." };
  const { data, error } = await supabase.from("entries").select("id, kind, title, body_md, url, meta").eq("id", id).maybeSingle();
  if (error || !data) return { supabase, entry: null, error: error ? "Couldn't load the entry." : "That entry no longer exists." };
  return { supabase, entry: data as { id: string; kind: string; title: string; body_md: string; url: string | null; meta: Record<string, unknown> }, error: null };
}

/** Read the linked page and save a short summary on the entry. */
export async function aiSummarize(id: string): Promise<AiResult> {
  const { supabase, entry, error } = await load(id);
  if (!entry) return { ok: false, message: error! };
  if (!entry.url) return { ok: false, message: "This entry has no link to summarise." };

  const page = await fetchPage(entry.url, { timeoutMs: 8000, maxBytes: 1024 * 1024 });
  const text = page ? htmlToText(page.html) : "";
  if (text.length < 200) {
    return { ok: false, message: "Couldn't read enough text from that page (it may need a login or render with JavaScript). Paste the key parts into the notes and use Improve writing instead." };
  }

  const res = await run(supabase, summarizePrompt(entry.title, entry.url, text), 500);
  if (!res.ok) return res;
  await supabase.from("entries").update({ meta: { ...entry.meta, summary: res.text } }).eq("id", entry.id);
  revalidatePath("/admin", "layout");
  return res;
}

/** Rough log notes → structured sections + resume bullets (a suggestion, not saved). */
export async function aiStructureLog(id: string): Promise<AiResult> {
  const { supabase, entry, error } = await load(id);
  if (!entry) return { ok: false, message: error! };
  if (!entry.title && !entry.body_md) return { ok: false, message: "Write a few words about the work first." };
  return run(supabase, structureLogPrompt(entry.title, entry.body_md), 900);
}

/** A cleaner version of the notes (a suggestion, not saved). */
export async function aiImprove(id: string): Promise<AiResult> {
  const { supabase, entry, error } = await load(id);
  if (!entry) return { ok: false, message: error! };
  if (entry.body_md.trim().length < 20) return { ok: false, message: "There isn't enough text in the notes to improve." };
  return run(supabase, improvePrompt(entry.body_md), Math.min(4000, Math.ceil(entry.body_md.length / 2) + 200));
}

/** Follow-up or thank-you email for a job (returned to copy, never sent or saved). */
export async function aiDraftEmail(id: string, kind: EmailKind): Promise<AiResult> {
  const { supabase, entry, error } = await load(id);
  if (!entry) return { ok: false, message: error! };
  if (entry.kind !== "job") return { ok: false, message: "Emails can be drafted from job entries." };
  if (kind !== "follow_up" && kind !== "thank_you") return { ok: false, message: "Unknown email type." };
  const m = entry.meta;
  const s = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : undefined);
  return run(supabase, emailPrompt(kind, { role: s("role"), company: s("company"), contact: s("contact"), applied_on: s("applied_on"), notes: entry.body_md }), 400);
}

/** Accept a suggestion: replace the entry's notes with it. */
export async function acceptNotes(id: string, body: string): Promise<{ ok: boolean; message: string }> {
  const { supabase } = await requireAdmin();
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid entry." };
  if (typeof body !== "string" || body.length > MAX_BODY) return { ok: false, message: "That's too long to save as one entry." };
  const { error } = await supabase.from("entries").update({ body_md: body }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Notes replaced." };
}

/**
 * Tailor a resume version to its linked job's description (a suggestion, not saved). Only the
 * resume's sections and the job description are sent; the name and contact line are not.
 */
export async function aiTailorResume(param: string): Promise<AiResult & { missing?: string[] }> {
  const { supabase } = await requireAdmin();
  const key = resumeKey(param);
  if (!key) return { ok: false, message: "Invalid resume." };
  const { data } = await supabase.from("private_config").select("value").eq("key", key).maybeSingle();
  const resume = data?.value as StoredResume | undefined;
  if (!resume) return { ok: false, message: "That resume no longer exists." };
  if (!resume.job_id) return { ok: false, message: "Link this version to a job first." };

  const { data: job } = await supabase.from("entries").select("meta").eq("id", resume.job_id).maybeSingle();
  const jd = typeof job?.meta?.jd === "string" ? (job.meta.jd as string) : "";
  if (jd.trim().length < 100) return { ok: false, message: "Paste the job description into the job (Job details → Job description) first." };

  const { header, body } = splitResume(resume.text);
  if (!body.trim()) return { ok: false, message: "This resume has no sections to tailor." };
  const res = await run(supabase, tailorPrompt(body, jd), 2500);
  if (!res.ok) return res;
  const { body: tailored, missing } = parseTailored(res.text);
  return { ...res, text: `${header.trimEnd()}\n\n${tailored}\n`, missing };
}
