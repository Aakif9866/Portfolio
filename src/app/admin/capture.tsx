"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { captureEntry } from "./workspace-actions";

/**
 * Quick capture: one box on every admin page, ⌘J / Ctrl J to focus. Paste a link or type
 * anything; `log:` `idea:` `goal:` `job:` set the kind and `#tags` are pulled out. Everything
 * else (kind, status, dates) can be sorted out later, or never.
 */
export function QuickCapture() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!msg?.ok) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);

  return (
    <form
      className="mb-6"
      action={(fd) => start(async () => {
        const res = await captureEntry(fd);
        setMsg({ ok: res.ok, text: res.ok ? "Saved to Inbox." : res.message });
        if (res.ok) {
          if (input.current) input.current.value = "";
          router.refresh();
        }
      })}
    >
      <label htmlFor="quick-capture" className="sr-only">Quick capture</label>
      <div className="flex gap-2">
        <input
          ref={input}
          id="quick-capture"
          name="text"
          autoComplete="off"
          maxLength={5000}
          placeholder="Capture anything — paste a link, or try “log: fixed the cache bug #backend”   (⌘J)"
          className="w-full rounded-xl border border-line bg-card px-4 py-3 text-[14.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
        />
        <button type="submit" disabled={pending} className="btn-grad shrink-0 rounded-xl px-4 text-[14px] font-medium disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <p aria-live="polite" className={`mt-1.5 min-h-[18px] text-[12.5px] ${msg && !msg.ok ? "text-rose-600 dark:text-rose-400" : "text-muted"}`}>
        {msg?.text}
      </p>
    </form>
  );
}
