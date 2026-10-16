"use client";
import { useActionState, useId, useState } from "react";
import type { ActionResult } from "../actions";
import { BTN, Banner, INPUT } from "../ui";

type Setting = { key: string; label: string; group: string; multiline: boolean; usedOn: string; help: string };

export function SiteConfigRow({
  setting, value, exists, action,
}: { setting: Setting; value: string; exists: boolean; action: (fd: FormData) => Promise<ActionResult> }) {
  const id = useId();
  const [dirty, setDirty] = useState(false);
  const [result, submit, pending] = useActionState(async (_p: ActionResult | null, fd: FormData) => {
    const r = await action(fd);
    if (r.ok) setDirty(false);
    return r;
  }, null);

  return (
    <form action={submit} onInput={() => setDirty(true)} className="card rounded-xl p-5">
      {/* site_config is keyed on `key`, not an id — upsert by primary key. */}
      <input type="hidden" name="__table" value="site_config" />
      <input type="hidden" name="key" value={setting.key} />
      <input type="hidden" name="label" value={setting.label} />
      <input type="hidden" name="group" value={setting.group} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[14px] font-medium">{setting.label}</label>
        <span className="text-[12.5px] text-muted">Shown on: {setting.usedOn}</span>
      </div>
      <p id={`${id}-help`} className="mt-1 text-[12.5px] text-muted">
        {setting.help}{!exists && " Not set yet — the built-in default is in use."}
      </p>

      {setting.multiline ? (
        <textarea id={id} name="value" defaultValue={value} rows={10} aria-describedby={`${id}-help`} className={`${INPUT} mt-2.5 font-mono text-[13px]`} />
      ) : (
        <input id={id} name="value" defaultValue={value} aria-describedby={`${id}-help`} type={setting.key === "contact.email" ? "email" : "url"} className={`${INPUT} mt-2.5`} />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button disabled={pending} className={BTN.primary}>{pending ? "Saving…" : "Save"}</button>
        {dirty && !pending && <span className="text-[12.5px] text-amber-600 dark:text-amber-400">Unsaved changes</span>}
      </div>
      {result && (!result.ok || !dirty) && <div className="mt-3"><Banner result={result} /></div>}
    </form>
  );
}
