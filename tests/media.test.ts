import { describe, expect, it } from "vitest";
import { MAX_BYTES, checkUpload, isMediaPath, mediaPath, slugifyName, sniff } from "@/lib/media";

const bytes = (...xs: (number | string)[]) =>
  new Uint8Array(xs.flatMap((x) => (typeof x === "string" ? [...x].map((c) => c.charCodeAt(0)) : [x])));

describe("sniff", () => {
  it.each([
    ["png", bytes(0x89, "PNG", 0x0d, 0x0a), "image/png"],
    ["jpeg", bytes(0xff, 0xd8, 0xff, 0xe0), "image/jpeg"],
    ["gif", bytes("GIF89a"), "image/gif"],
    ["webp", bytes("RIFF", 0, 0, 0, 0, "WEBP"), "image/webp"],
    ["avif", bytes(0, 0, 0, 0x1c, "ftypavif"), "image/avif"],
    ["pdf", bytes("%PDF-1.7"), "application/pdf"],
  ])("recognises %s from its bytes", (_n, head, mime) => {
    expect(sniff(head)?.mime).toBe(mime);
  });

  it("rejects SVG, HTML and anything unknown, whatever the name says", () => {
    expect(sniff(bytes("<svg xmlns="))).toBeNull();
    expect(sniff(bytes("<!doctype html>"))).toBeNull();
    expect(sniff(bytes("PK", 3, 4))).toBeNull();
  });
});

describe("checkUpload", () => {
  const png = bytes(0x89, "PNG");
  it("accepts a normal image", () => expect(checkUpload(1000, png)).toEqual({ ok: true, mime: "image/png", ext: "png" }));
  it("rejects empty and oversized files", () => {
    expect(checkUpload(0, png).ok).toBe(false);
    expect(checkUpload(MAX_BYTES + 1, png).ok).toBe(false);
    expect(checkUpload(MAX_BYTES, png).ok).toBe(true);
  });
});

describe("stored paths", () => {
  it("generates year/uuid-name.ext with the sniffed extension, not the uploaded one", () => {
    const p = mediaPath("My Hero Shot (final).JPG.exe", "png", new Date("2026-11-19T00:00:00Z"), "abc");
    expect(p).toBe("2026/abc-my-hero-shot-final-jpg.png");
  });
  it("never produces an empty name", () => expect(slugifyName("...")).toBe("file"));
  it("accepts stored paths and refuses traversal or bare names", () => {
    expect(isMediaPath("2026/abc-hero.png")).toBe(true);
    expect(isMediaPath("architecture-diagrams/klyro-mern-blog-gitdiagram.png")).toBe(true);
    expect(isMediaPath("../secrets.png")).toBe(false);
    expect(isMediaPath("2026/../../x.png")).toBe(false);
    expect(isMediaPath("hero.png")).toBe(false);
  });
});
