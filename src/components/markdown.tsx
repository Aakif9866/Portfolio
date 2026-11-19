import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { headingSlugger, remarkCallouts } from "@/lib/markdown";
import { CopyCode } from "./copy-code";

/**
 * The one Markdown renderer: public articles and case studies, admin previews and the
 * workspace. GFM (tables, task lists), highlighted code with a language label and copy
 * button, GitHub-style `> [!NOTE]` callouts, linkable headings whose ids match the table of
 * contents (lib/markdown.ts headings()), and images with captions from their title.
 * No raw HTML is rendered, so stored Markdown can't inject markup.
 */
type HastNode = { type: string; value?: string; tagName?: string; properties?: Record<string, unknown>; children?: HastNode[] };
const textOf = (n?: HastNode): string => (!n ? "" : n.type === "text" ? n.value ?? "" : (n.children ?? []).map(textOf).join(""));

export function Markdown({ children, className = "", anchors = false }: { children: string; className?: string; anchors?: boolean }) {
  // One slugger per render, called for every heading in document order, exactly like headings().
  const slug = headingSlugger();
  const heading = (Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") =>
    function H({ node, children }: { node?: HastNode; children?: ReactNode }) {
      const id = slug(textOf(node));
      return (
        <Tag id={id}>
          {children}
          {anchors && (Tag === "h2" || Tag === "h3") && <a href={`#${id}`} className="heading-anchor" aria-label="Link to this section">#</a>}
        </Tag>
      );
    };

  const components: Components = {
    h1: heading("h1"), h2: heading("h2"), h3: heading("h3"), h4: heading("h4"), h5: heading("h5"), h6: heading("h6"),
    pre: ({ children, node }) => {
      const code = (node as HastNode | undefined)?.children?.[0];
      const lang = ((code?.properties?.className as string[] | undefined) ?? []).find((c) => c.startsWith("language-"))?.slice(9);
      return (
        <div className="code-block">
          <div className="code-bar">
            <span>{lang ?? "code"}</span>
            <CopyCode />
          </div>
          {/* wide code scrolls sideways; tabIndex lets keyboard users scroll it */}
          <pre tabIndex={0}>{children}</pre>
        </div>
      );
    },
    a: ({ href, children }) => (
      <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{children}</a>
    ),
    // Spans, not <figure>: Markdown wraps images in <p>, and a figure inside a p is invalid HTML.
    img: ({ src, alt, title }) => (
      <span className="md-figure">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary hosted images in user content */}
        <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" />
        {title && <span className="md-caption">{title}</span>}
      </span>
    ),
  };

  return (
    <div className={`prose-doc ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkCallouts]} rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
