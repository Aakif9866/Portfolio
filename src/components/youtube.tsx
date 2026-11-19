import { youtubeEmbed, youtubeId, youtubeStart } from "@/lib/blog";

/**
 * A responsive YouTube player for articles. Uses the privacy-enhanced youtube-nocookie
 * domain (no tracking cookies until play) and loads lazily, so a post with several videos
 * stays fast. Renders nothing for a URL that isn't a YouTube video.
 */
export function YouTube({ url, title }: { url: string; title?: string }) {
  const id = youtubeId(url);
  if (!id) return null;
  return (
    <span className="video-embed">
      <iframe
        src={youtubeEmbed(id, youtubeStart(url))}
        title={title ?? "YouTube video"}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </span>
  );
}
