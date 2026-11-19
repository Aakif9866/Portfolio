import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getVisitCount } from "@/lib/visits";
import { getContact, getPalette } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";
import { ScrollReveal } from "@/components/scroll-reveal";

export const metadata: Metadata = {
  title: { default: "Aakif — Software Engineer", template: "%s · Aakif" },
  description:
    "Software engineer working across backend systems, AI agent infrastructure and full-stack products. Case studies, stack notes and experiments.",
  openGraph: { title: "Aakif — Software Engineer", type: "website" },
  robots: { index: true, follow: true },
  metadataBase: new URL(SITE_URL),
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: "Aakif — Writing" }] } },
};

// Self-hosted at build time (no request to Google from visitors' browsers), swap so text shows at once.
const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

// Runs before paint: no theme flash, no layout shift; marks the page ready for the scroll reveal.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}try{if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('rv-ready');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [visits, contact, palette] = await Promise.all([getVisitCount(), getContact(), getPalette()]);
  return (
    <html lang="en" data-palette={palette} suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-page">
          Skip to content
        </a>
        <Nav contact={contact} />
        <main id="main">{children}</main>
        <Footer visits={visits} contact={contact} />
        <ScrollReveal />
      </body>
    </html>
  );
}
