"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createJob } from "../workspace-actions";
import { BTN, Banner, INPUT } from "../ui";
import type { ActionResult } from "../actions";

/** Three optional boxes and a button. Everything else can be filled in later from the entry. */
export function AddJob() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={form}
      className="card space-y-3 rounded-2xl p-4"
      action={(fd) => start(async () => {
        const res = await createJob(fd);
        setResult(res);
        if (res.ok) { form.current?.reset(); router.refresh(); }
      })}
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
        <label className="sr-only" htmlFor="job-role">Role</label>
        <input id="job-role" name="job.role" placeholder="Role" maxLength={120} className={INPUT} />
        <label className="sr-only" htmlFor="job-company">Company</label>
        <input id="job-company" name="job.company" placeholder="Company" maxLength={120} className={INPUT} />
        <label className="sr-only" htmlFor="job-url">Link to the posting</label>
        <input id="job-url" name="url" type="url" placeholder="Link to the posting (optional)" className={INPUT} />
        <button type="submit" disabled={pending} className={BTN.primary}>{pending ? "Saving…" : "Add job"}</button>
      </div>
      <Banner result={result} />
    </form>
  );
}
