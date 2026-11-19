"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteMedia } from "../actions";
import { BTN, ConfirmButton, UploadButton } from "../ui";

export function UploadAndRefresh() {
  const router = useRouter();
  return <UploadButton label="Upload file" onUploaded={() => router.refresh()} />;
}

export function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={BTN.secondary}
      onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

export function DeleteMedia({ path }: { path: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <ConfirmButton
        label="Delete"
        title="Delete this file?"
        body="Any page that links to it will show a broken image. This can't be undone."
        confirmLabel="Delete file"
        onConfirm={async () => {
          const fd = new FormData();
          fd.set("path", path);
          const res = await deleteMedia(fd);
          if (res.ok) router.refresh();
          else setError(res.message);
        }}
      />
      {error && <p role="alert" className="w-full text-[12.5px] text-rose-600 dark:text-rose-400">{error}</p>}
    </>
  );
}
