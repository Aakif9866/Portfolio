"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

// The renderer and highlighter (~100 KB) load only when Preview or Split is first opened.
const Markdown = dynamic(() => import("@/components/markdown").then((m) => m.Markdown), {
  loading: () => <p className="text-[13px] text-faint">Loading preview…</p>,
});
import { MAX_BYTES } from "@/lib/media";
import { uploadMedia } from "./actions";

/**
 * The Markdown editor for every admin Markdown field: Write / Preview / Split, a small
 * toolbar, ⌘B ⌘I ⌘K ⌘S, and images pasted or dropped straight into Supabase Storage.
 *
 * The textarea stays uncontrolled and named, so it submits with its form like before, and
 * edits go through the browser's own insertText: undo (⌘Z) works and the form's
 * unsaved-changes guard sees a normal input event. The preview uses the same renderer as the
 * public pages.
 */
type Mode = "write" | "preview" | "split";

export function MarkdownEditor({ id, name, defaultValue, rows = 14, required, describedBy, className = "" }: {
  id?: string; name: string; defaultValue: string; rows?: number; required?: boolean; describedBy?: string; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<Mode>("write");
  const [text, setText] = useState(defaultValue);
  const [status, setStatus] = useState<string | null>(null);

  /** Replace the selection (or insert at the caret) as if typed. */
  function insert(value: string, selectFrom?: number, selectTo?: number) {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    const start = ta.selectionStart;
    // execCommand keeps the undo stack; it's deprecated but still the only way to do that.
    if (!document.execCommand?.("insertText", false, value)) {
      ta.setRangeText(value, ta.selectionStart, ta.selectionEnd, "end");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (selectFrom !== undefined) ta.setSelectionRange(start + selectFrom, start + (selectTo ?? selectFrom));
  }

  function wrap(before: string, after = before, placeholder = "text") {
    const ta = ref.current!;
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd) || placeholder;
    insert(`${before}${sel}${after}`, before.length, before.length + sel.length);
  }

  /** Prefix every selected line (or the current one). */
  function prefixLines(prefix: string | ((i: number) => string)) {
    const ta = ref.current!;
    const lineStart = ta.value.lastIndexOf("\n", ta.selectionStart - 1) + 1;
    const lineEndIdx = ta.value.indexOf("\n", ta.selectionEnd);
    const lineEnd = lineEndIdx === -1 ? ta.value.length : lineEndIdx;
    ta.setSelectionRange(lineStart, lineEnd);
    const lines = ta.value.slice(lineStart, lineEnd).split("\n");
    insert(lines.map((l, i) => `${typeof prefix === "function" ? prefix(i) : prefix}${l}`).join("\n"));
  }

  function link() {
    const ta = ref.current!;
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd) || "link text";
    insert(`[${sel}](https://)`, sel.length + 3, sel.length + 11);
  }

  async function upload(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    for (const file of images) {
      if (file.size > MAX_BYTES) { setStatus(`${file.name} is over 4 MB.`); continue; }
      setStatus(`Uploading ${file.name}…`);
      const fd = new FormData();
      fd.set("file", file);
      try {
        const res = await uploadMedia(fd);
        if (!res.ok) { setStatus(res.message); continue; }
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
        insert(`![${alt}](${res.url})\n`);
        setStatus(null);
      } catch {
        setStatus("Upload failed. Check your connection and try again.");
      }
    }
  }

  const TOOLS: { label: string; title: string; run: () => void }[] = [
    { label: "H2", title: "Heading", run: () => prefixLines("## ") },
    { label: "B", title: "Bold (⌘B)", run: () => wrap("**") },
    { label: "I", title: "Italic (⌘I)", run: () => wrap("_") },
    { label: "Link", title: "Link (⌘K)", run: link },
    { label: "Code", title: "Code", run: () => {
      const ta = ref.current!;
      const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
      if (sel.includes("\n")) insert(`\`\`\`\n${sel}\n\`\`\``);
      else wrap("`", "`", "code");
    } },
    { label: "Quote", title: "Quote", run: () => prefixLines("> ") },
    { label: "• List", title: "Bulleted list", run: () => prefixLines("- ") },
    { label: "1. List", title: "Numbered list", run: () => prefixLines((i) => `${i + 1}. `) },
    { label: "☐ Task", title: "Checklist", run: () => prefixLines("- [ ] ") },
    { label: "Note", title: "Callout", run: () => insert("> [!NOTE]\n> ", 12) },
  ];

  const tab = (m: Mode, label: string, extra = "") => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
      className={`rounded-md px-2.5 py-1 text-[12.5px] ${mode === m ? "bg-raised font-medium text-ink" : "text-muted hover:text-ink"} ${extra}`}>
      {label}
    </button>
  );

  return (
    <div className={`overflow-hidden rounded-lg border border-line bg-surface focus-within:border-accent ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-2 py-1.5">
        <div role="tablist" aria-label="Editor view" className="flex gap-0.5">
          {tab("write", "Write")}
          {tab("preview", "Preview")}
          {tab("split", "Split", "hidden lg:inline-block")}
        </div>
        {mode !== "preview" && (
          <div className="flex flex-wrap gap-0.5" role="toolbar" aria-label="Formatting">
            {TOOLS.map((t) => (
              <button key={t.label} type="button" title={t.title} aria-label={t.title} onClick={t.run}
                className="rounded-md px-2 py-1 font-mono text-[11.5px] text-muted hover:bg-raised hover:text-ink">{t.label}</button>
            ))}
            <label className="cursor-pointer rounded-md px-2 py-1 font-mono text-[11.5px] text-muted hover:bg-raised hover:text-ink" title="Upload an image">
              Image
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" hidden onChange={(e) => { if (e.target.files) upload([...e.target.files]); e.target.value = ""; }} />
            </label>
          </div>
        )}
      </div>

      <div className={mode === "split" ? "grid lg:grid-cols-2" : ""}>
        <textarea
          ref={ref}
          id={id}
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={rows}
          spellCheck
          aria-describedby={describedBy}
          hidden={mode === "preview"}
          onInput={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (!(e.metaKey || e.ctrlKey)) return;
            const k = e.key.toLowerCase();
            if (k === "b") { e.preventDefault(); wrap("**"); }
            else if (k === "i") { e.preventDefault(); wrap("_"); }
            else if (k === "k") { e.preventDefault(); e.stopPropagation(); link(); }
            else if (k === "s") { e.preventDefault(); e.currentTarget.form?.requestSubmit(); }
          }}
          onPaste={(e) => {
            const files = [...e.clipboardData.files];
            if (files.some((f) => f.type.startsWith("image/"))) { e.preventDefault(); upload(files); }
          }}
          onDrop={(e) => {
            const files = [...e.dataTransfer.files];
            if (files.some((f) => f.type.startsWith("image/"))) { e.preventDefault(); upload(files); }
          }}
          className="block w-full resize-y bg-transparent px-3 py-2.5 font-mono text-[13px] leading-relaxed text-ink outline-none"
        />
        {mode !== "write" && (
          <div className={`max-h-[70vh] overflow-auto px-4 py-3 ${mode === "split" ? "border-t border-line lg:border-l lg:border-t-0" : ""}`} aria-label="Preview">
            {text.trim() ? <Markdown className="text-[14.5px]">{text}</Markdown> : <p className="text-[13px] text-faint">Nothing to preview yet.</p>}
          </div>
        )}
      </div>
      <p aria-live="polite" className={`border-t border-line px-3 py-1 text-[11.5px] ${status ? "text-muted" : "text-faint"}`}>
        {status ?? "Markdown · paste or drop an image to upload it · ⌘B ⌘I ⌘K ⌘S"}
      </p>
    </div>
  );
}
