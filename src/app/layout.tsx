import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { supabasePublic } from "@/lib/supabase/server";
import { getVisitCount } from "@/lib/visits";

export const metadata: Metadata = {
  title: { default: "Aakif — Software Engineer", template: "%s · Aakif" },
  description:
    "Software engineer working across backend systems, AI agent infrastructure and full-stack products. Case studies, stack notes and experiments.",
  openGraph: { title: "Aakif — Software Engineer", type: "website" },
  robots: { index: true, follow: true },
};

// Runs before paint: no theme flash, no layout shift.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

async function searchIndex() {
  const sb = supabasePublic();
  const [projects, articles, experiments, tech] = await Promise.all([
    sb.from("projects").select("slug,title").eq("state", "published"),
    sb.from("articles").select("slug,title").eq("state", "published"),
    sb.from("experiments").select("slug,title").eq("state", "published"),
    sb.from("technologies").select("slug,name,category"),
  ]);

  return [
    { label: "Home", href: "/", group: "Page" },
    { label: "All work", href: "/projects", group: "Page" },
    { label: "Stack", href: "/system", group: "Page" },
    { label: "Lab", href: "/lab", group: "Page" },
    { label: "Writing", href: "/articles", group: "Page" },
    { label: "Experience", href: "/experience", group: "Page" },
    { label: "About", href: "/about", group: "Page" },
    ...(projects.data ?? []).map((p) => ({ label: p.title, href: `/projects/${p.slug}`, group: "Project" })),
    ...(articles.data ?? []).map((a) => ({ label: a.title, href: `/articles/${a.slug}`, group: "Article" })),
    ...(experiments.data ?? []).map((e) => ({ label: e.title, href: `/lab/${e.slug}`, group: "Lab" })),
    ...(tech.data ?? []).map((t) => ({ label: t.name, href: `/system#${t.slug}`, group: "Tech", hint: t.category })),
  ];
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [items, visits] = await Promise.all([searchIndex(), getVisitCount()]);
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-page">
          Skip to content
        </a>
        <Nav searchItems={items} />
        <main id="main">{children}</main>
        <Footer visits={visits} />
      </body>
    </html>
  );
}
