"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CAREER_FIELDS, SKILL_LEVELS, type Career, type SkillNote } from "@/lib/career";
import { saveCareer, setSkill, toggleMilestone } from "../workspace-actions";
import { BTN, Banner, INPUT } from "../ui";
import type { ActionResult } from "../actions";

export function CareerForm({ career }: { career: Career }) {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="space-y-4" action={(fd) => start(async () => {
      const res = await saveCareer(fd);
      setResult(res);
      if (res.ok) router.refresh();
    })}>
      <div className="grid gap-4 sm:grid-cols-3">
        {CAREER_FIELDS.filter((f) => f.rows === 1).map((f) => (
          <label key={f.key} className="block">
            <span className="block text-[13px] font-medium">{f.label}</span>
            <input name={`career.${f.key}`} defaultValue={career[f.key] ?? ""} maxLength={f.max} placeholder={"placeholder" in f ? f.placeholder : undefined} className={`${INPUT} mt-1.5`} />
          </label>
        ))}
      </div>
      {CAREER_FIELDS.filter((f) => f.rows > 1).map((f) => (
        <label key={f.key} className="block">
          <span className="block text-[13px] font-medium">{f.label}</span>
          <textarea name={`career.${f.key}`} defaultValue={career[f.key] ?? ""} maxLength={f.max} rows={f.rows} className={`${INPUT} mt-1.5`} />
        </label>
      ))}
      <Banner result={result} />
      <button type="submit" disabled={pending} className={BTN.primary}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

/** A goal's `- [ ]` items as real checkboxes; ticking one saves immediately. */
export function Milestones({ id, items }: { id: string; items: { done: boolean; text: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <ul className="mt-2 space-y-1">
      {items.map((t, i) => (
        <li key={i}>
          <label className="flex cursor-pointer items-start gap-2 text-[13.5px]">
            <input
              type="checkbox"
              checked={t.done}
              disabled={pending}
              onChange={() => start(async () => {
                const fd = new FormData();
                fd.set("id", id);
                fd.set("index", String(i));
                const res = await toggleMilestone(fd);
                if (res.ok) { setError(null); router.refresh(); } else setError(res.message);
              })}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span className={t.done ? "text-faint line-through" : "text-ink"}>{t.text}</span>
          </label>
        </li>
      ))}
      {error && <li role="alert" className="text-[12px] text-rose-600 dark:text-rose-400">{error}</li>}
    </ul>
  );
}

/** Level, "want to learn" and a short note for one skill. Each change saves on its own. */
export function SkillRow({ name, note, related }: { name: string; note?: SkillNote; related?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const save = (next: SkillNote) => start(async () => {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("level", next.level ?? "");
    fd.set("want", String(Boolean(next.want)));
    fd.set("note", next.note ?? "");
    const res = await setSkill(fd);
    if (res.ok) { setError(null); router.refresh(); } else setError(res.message);
  });
  const current = note ?? {};
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
      <span className="min-w-[9rem] flex-1 text-[14px]">{name}</span>
      {related !== undefined && related > 0 && <span className="text-[12px] text-faint">{related} resource{related === 1 ? "" : "s"}</span>}
      <label className="sr-only" htmlFor={`lvl-${name}`}>Level for {name}</label>
      <select id={`lvl-${name}`} value={current.level ?? ""} disabled={pending} onChange={(e) => save({ ...current, level: e.target.value || undefined })} className="rounded-lg border border-line bg-surface px-2 py-1 text-[13px]">
        <option value="">—</option>
        {Object.entries(SKILL_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <button
        type="button"
        disabled={pending}
        aria-pressed={Boolean(current.want)}
        onClick={() => save({ ...current, want: !current.want })}
        className={`rounded-full border px-2.5 py-0.5 text-[12px] transition-colors ${current.want ? "border-ink bg-ink text-page" : "border-line text-muted hover:text-ink"}`}
      >
        Want to learn
      </button>
      {error && <span role="alert" className="w-full text-[12px] text-rose-600 dark:text-rose-400">{error}</span>}
    </li>
  );
}

/** Add a skill that isn't on the public tech list (e.g. "System design", "Kafka"). */
export function AddSkill() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="flex gap-2" action={(fd) => start(async () => {
      fd.set("want", "true");
      const res = await setSkill(fd);
      if (res.ok) { setError(null); router.refresh(); } else setError(res.message);
    })}>
      <label htmlFor="add-skill" className="sr-only">Skill name</label>
      <input id="add-skill" name="name" required maxLength={60} placeholder="Add a skill to learn, e.g. Kafka" className={INPUT} />
      <button type="submit" disabled={pending} className={BTN.secondary}>Add</button>
      {error && <span role="alert" className="text-[12px] text-rose-600 dark:text-rose-400">{error}</span>}
    </form>
  );
}
