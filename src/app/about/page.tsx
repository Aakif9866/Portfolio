import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { supabasePublic } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "About" };
export const revalidate = 300;

export default async function AboutPage() {
  const { data } = await supabasePublic().from("site_config").select("key,value").eq("key", "about_md").maybeSingle();
  const body = (data?.value as string | null) ?? null;

  return (
    <>
      <PageHeader eyebrow="About" title="Aakif" />
      <div className="mx-auto max-w-3xl px-6 py-14">
        {body ? (
          <Markdown>{body}</Markdown>
        ) : (
          <div className="prose-doc">
            <p>
              I&apos;m a software engineer working across backend systems, AI agent infrastructure and
              full-stack products. The work I care about is the layer underneath the demo: request
              routing, failover, guardrails, object storage, idempotent sync, row-level security.
            </p>
            <p>
              This site is itself one of those systems. The content is served from a PostgreSQL
              database on Supabase, with row-level security policies that let anonymous visitors read
              published rows and nothing else. The admin area is a single account enforced by a
              database allowlist rather than a client-side flag. Writing it that way was the point —
              a portfolio that claims production thinking should be able to survive someone reading
              its own source.
            </p>
            <h2>What I&apos;m looking for</h2>
            <p>
              A software engineering role where I can work on real systems and be reviewed by people
              who are better than me. I&apos;d rather own one service properly than touch ten
              superficially.
            </p>
            <h2>Contact</h2>
            <p>
              <a href="mailto:aakif9866@gmail.com">aakif9866@gmail.com</a> ·{" "}
              <a href="https://github.com/Aakif9866" target="_blank" rel="noopener">github.com/Aakif9866</a>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
