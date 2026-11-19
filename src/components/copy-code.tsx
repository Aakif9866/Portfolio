"use client";
import { useState } from "react";

/** Copy button for a rendered code block: copies the text of the <pre> beside it. */
export function CopyCode() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="code-copy"
      aria-label="Copy code"
      onClick={(e) => {
        const pre = e.currentTarget.closest(".code-block")?.querySelector("pre");
        if (!pre) return;
        navigator.clipboard.writeText(pre.innerText).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
