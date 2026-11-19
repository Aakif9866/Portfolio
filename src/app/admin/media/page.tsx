import { requireAdmin } from "@/lib/auth";
import { MEDIA_BUCKET } from "@/lib/media";
import { AdminHeader } from "../ui";
import { CopyUrl, DeleteMedia, UploadAndRefresh } from "./client";

type FileRow = { path: string; size: number; mime: string; created: string | null; url: string };

export default async function AdminMedia() {
  const { supabase } = await requireAdmin();
  const bucket = supabase.storage.from(MEDIA_BUCKET);

  // Two levels: the bucket root holds year folders (and older named folders), each holding files.
  const { data: root, error } = await bucket.list("", { limit: 1000, sortBy: { column: "name", order: "desc" } });
  const folders = (root ?? []).filter((o) => o.id === null).map((o) => o.name);
  const nested = await Promise.all(folders.map(async (dir) => {
    const { data } = await bucket.list(dir, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    return (data ?? []).filter((o) => o.id !== null).map((o) => ({ ...o, name: `${dir}/${o.name}` }));
  }));
  const files: FileRow[] = [...(root ?? []).filter((o) => o.id !== null), ...nested.flat()].map((o) => ({
    path: o.name,
    size: Number(o.metadata?.size ?? 0),
    mime: String(o.metadata?.mimetype ?? ""),
    created: o.created_at ?? null,
    url: bucket.getPublicUrl(o.name).data.publicUrl,
  }));

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Media"
        description="Images and PDFs stored in Supabase Storage. Anyone with a file's link can view it, so don't upload anything private. Up to 4 MB each."
        actions={<UploadAndRefresh />}
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13.5px] text-rose-700 dark:text-rose-300">
          Couldn&apos;t list files: {error.message}
        </p>
      ) : files.length === 0 ? (
        <p className="card rounded-2xl px-6 py-12 text-center text-[14px] text-muted">No files yet. Upload one, or use the Upload button on any image field.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <li key={f.path} className="card flex flex-col overflow-hidden rounded-2xl">
              {f.mime.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element -- thumbnails of stored files
                <img src={f.url} alt="" loading="lazy" className="h-36 w-full border-b border-line bg-raised object-contain" />
              ) : (
                <div className="grid h-36 place-items-center border-b border-line bg-raised font-mono text-[13px] text-muted">PDF</div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="break-all font-mono text-[12px] text-ink">{f.path}</p>
                <p className="text-[12px] text-faint">
                  {(f.size / 1024).toFixed(0)} KB{f.created && ` · ${new Date(f.created).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <CopyUrl url={f.url} />
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-[13px] text-muted hover:bg-raised hover:text-ink">Open</a>
                  <DeleteMedia path={f.path} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
