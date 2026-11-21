import Link from "next/link";
import { HeroDiagram } from "@/components/HeroDiagram";
import { Section } from "@/components/Section";
import { ArrowLink, SocialLinks, btn } from "@/components/LinkButtons";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Timeline } from "@/components/Timeline";
import { Terminal } from "@/components/Terminal";
import { ContactForm } from "@/components/ContactForm";
import { PostRow } from "@/components/JournalList";
import { about, profile } from "@/data/profile";
import { skills } from "@/data/skills";
import { projects } from "@/data/projects";
import { getPosts } from "@/lib/journal";
import { tone, toneAt } from "@/lib/tone";

export default async function Home() {
  const posts = (await getPosts()).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-32 sm:px-6 md:pt-40 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{profile.role}</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-heading sm:text-5xl lg:text-6xl">
            <span className="text-(--c-blue)">Backend systems</span>,{" "}
            <span className="text-(--c-violet)">retrieval pipelines</span> and{" "}
            <span className="text-(--c-green)">applied AI</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">{profile.hero}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/projects" className={btn.primary}>View Projects</Link>
            <Link href="/journal" className={btn.ghost}>Explore Technical Writing</Link>
            <SocialLinks />
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface/40 p-4">
          <HeroDiagram />
        </div>
      </section>

      <Section id="about" index="01" label="About" title="Engineering interests, not buzzwords" intro={profile.intro}>
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {about.map((a, i) => (
            <div key={a.title} style={toneAt(i)} className="border-t-2 border-t-(--tone) bg-bg bg-linear-to-b from-(--tone)/8 to-transparent to-60% p-6">
              <p className="font-mono text-xs text-(--tone)">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 font-semibold text-heading">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="skills" index="02" label="Skills" title="Technical toolkit" tone="blue">
        <dl className="divide-y divide-line border-y border-line">
          {skills.map((g, gi) => (
            <div key={g.title} style={toneAt(gi)} className="grid gap-3 py-6 md:grid-cols-[260px_1fr]">
              <dt className="border-l-2 border-(--tone) pl-4">
                <span className="font-medium text-(--tone)">{g.title}</span>
                <span className="mt-1 block text-sm text-muted">{g.focus}</span>
              </dt>
              <dd className="font-mono text-sm leading-7 text-text">
                {g.items.map((s, i) => (
                  <span key={s}>
                    {s}
                    {i < g.items.length - 1 && <span className="px-2 text-(--tone)">/</span>}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="projects" index="03" label="Projects" tone="violet" title="Selected projects" intro="Each project page covers the problem, architecture, engineering decisions and trade-offs.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.05}>
              <ProjectCard project={p} index={i} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="showcase" index="04" label="Showcase" title="How the systems work underneath" tone="amber">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { href: "/backend", tone: "blue" as const, title: "Backend Engineering", body: "Interactive walkthroughs of request lifecycles, JWT auth, query execution, caching, queues, microservices, rate limiting, load balancing and observability." },
            { href: "/ai", tone: "violet" as const, title: "AI & RAG Engineering", body: "The full RAG pipeline from ingestion to evaluation, plus how Recall@K, MRR, correctness and faithfulness are measured." },
          ].map((c) => (
            <Link key={c.href} href={c.href} style={tone(c.tone)} className="group rounded-lg border border-line border-l-4 border-l-(--tone) bg-surface p-8 transition-colors hover:bg-(--tone)/5">
              <h3 className="text-xl font-semibold text-heading group-hover:text-(--tone)">{c.title} →</h3>
              <p className="mt-3 text-sm text-muted">{c.body}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="experience" index="05" label="Experience" title="Experience" tone="coral">
        <Timeline />
      </Section>

      <Section id="journal" index="06" label="Journal" title="Latest from the technical journal" tone="blue">
        <ul>{posts.map((p) => <PostRow key={p.slug} post={p} />)}</ul>
        <div className="mt-6"><ArrowLink href="/journal">All articles</ArrowLink></div>
      </Section>

      <Section id="terminal" index="07" tone="amber" label="Terminal" title="Explore from the command line" intro="Type help to see the available commands.">
        <Terminal />
      </Section>

      <Section id="contact" index="08" label="Contact" title="Get in touch">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-muted">Open to backend and AI engineering conversations: roles, collaborations, or questions about anything here.</p>
            <div className="mt-6 flex flex-wrap gap-3"><SocialLinks withEmail /></div>
          </div>
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
