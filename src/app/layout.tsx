import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { SocialLinks } from "@/components/LinkButtons";
import { themeScript } from "@/components/ThemeToggle";
import { profile } from "@/data/profile";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: `${profile.name} · ${profile.role}`, template: `%s · ${profile.name}` },
  description: profile.hero,
  openGraph: { type: "website", siteName: profile.name, title: `${profile.name} · ${profile.role}`, description: profile.hero },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0b0c0b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        <a href="#main" className="sr-only z-[60] rounded-md bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-mono text-xs">
              © {profile.name}. Built with Next.js.
            </p>
            <div className="flex flex-wrap gap-2">
              <SocialLinks />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
