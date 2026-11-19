/**
 * Rules for files uploaded to the Supabase Storage bucket `media`.
 *
 * The bucket enforces its own size and MIME limits, and storage RLS lets only the admin
 * write. This module is the app-side check before that: the type is decided from the
 * file's first bytes, not from its name or the browser-reported type, and the stored name
 * is generated, so a file can't pick its own path or extension.
 */
export const MEDIA_BUCKET = "media";

// 4 MB: Vercel rejects request bodies over 4.5 MB before the action runs.
export const MAX_BYTES = 4 * 1024 * 1024;

const TYPES: { mime: string; ext: string; magic: (b: Uint8Array) => boolean }[] = [
  { mime: "image/png", ext: "png", magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/jpeg", ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/gif", ext: "gif", magic: (b) => ascii(b, 0, 4) === "GIF8" },
  { mime: "image/webp", ext: "webp", magic: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  { mime: "image/avif", ext: "avif", magic: (b) => ascii(b, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 12)) },
  { mime: "application/pdf", ext: "pdf", magic: (b) => ascii(b, 0, 5) === "%PDF-" },
];
// SVG is deliberately absent: it can carry script.

export const ACCEPT = TYPES.map((t) => t.mime).join(",");

function ascii(b: Uint8Array, from: number, to: number) {
  return String.fromCharCode(...b.subarray(from, to));
}

/** The type of a file from its first 16 bytes, or null if it isn't one we accept. */
export function sniff(head: Uint8Array): { mime: string; ext: string } | null {
  const t = TYPES.find((t) => t.magic(head));
  return t ? { mime: t.mime, ext: t.ext } : null;
}

/** Name part of the stored path: lowercase, hyphenated, at most 40 chars, never empty. */
export function slugifyName(filename: string) {
  const base = filename.replace(/\.[^.]*$/, "");
  const slug = base.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return slug || "file";
}

/** `2026/<uuid>-<name>.<ext>`. The year folder keeps the bucket browsable. */
export function mediaPath(filename: string, ext: string, now = new Date(), id: string = crypto.randomUUID()) {
  return `${now.getUTCFullYear()}/${id}-${slugifyName(filename)}.${ext}`;
}

/** A stored path from the Media page: folders and a file name, no traversal. */
export function isMediaPath(path: string) {
  return /^[\w-]+(\/[\w-]+)*\/[\w-]+\.[a-z0-9]+$/i.test(path);
}

export type UploadCheck = { ok: true; mime: string; ext: string } | { ok: false; message: string };

export function checkUpload(size: number, head: Uint8Array): UploadCheck {
  if (size === 0) return { ok: false, message: "That file is empty." };
  if (size > MAX_BYTES) return { ok: false, message: "Files can be at most 4 MB." };
  const type = sniff(head);
  if (!type) return { ok: false, message: "Only PNG, JPEG, GIF, WebP, AVIF images and PDFs can be uploaded." };
  return { ok: true, ...type };
}
