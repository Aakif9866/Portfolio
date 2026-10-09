"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname === "/login") return null;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-xs">
            <p className="text-[15px] font-semibold">Aakif</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Backend systems, AI agent infrastructure and full-stack products.
              Everything on this site is backed by a row in Postgres.
            </p>
          </div>
          <nav className="flex gap-14 text-[13.5px]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Site</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li><Link href="/projects" className="ul hover:text-ink">Work</Link></li>
                <li><Link href="/system" className="ul hover:text-ink">Stack</Link></li>
                <li><Link href="/lab" className="ul hover:text-ink">Lab</Link></li>
                <li><Link href="/articles" className="ul hover:text-ink">Writing</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Elsewhere</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li><a href="https://github.com/Aakif9866" target="_blank" rel="noopener" className="ul hover:text-ink">GitHub</a></li>
                <li><a href="mailto:aakif9866@gmail.com" className="ul hover:text-ink">Email</a></li>
                <li><Link href="/about" className="ul hover:text-ink">About</Link></li>
                <li><Link href="/login" className="ul hover:text-ink">Admin</Link></li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[12.5px] text-faint">
          <p>© {new Date().getFullYear()} Aakif. Next.js · Supabase · Tailwind CSS.</p>
          <p className="font-mono">Content served from PostgreSQL with row-level security.</p>
        </div>
      </div>
    </footer>
  );
}
