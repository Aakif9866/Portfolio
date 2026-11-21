import Link from "next/link";
import { ArrowUpRight, FileText, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./icons";
import { profile } from "@/data/profile";

const base =
  "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-accent";
export const btn = {
  primary: `${base} bg-accent text-accent-ink hover:opacity-90`,
  ghost: `${base} border border-line text-heading hover:border-accent hover:text-accent`,
};

/** External profile links. Anything left empty in profile.ts is simply not rendered. */
export function SocialLinks({ withEmail = false }: { withEmail?: boolean }) {
  const items = [
    withEmail && profile.email && { href: `mailto:${profile.email}`, label: "Email", icon: <Mail className="size-4" /> },
    profile.github && { href: profile.github, label: "GitHub", icon: <GithubIcon /> },
    profile.linkedin && { href: profile.linkedin, label: "LinkedIn", icon: <LinkedinIcon /> },
    profile.resume && { href: profile.resume, label: "Resume", icon: <FileText className="size-4" />, download: true },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; download?: boolean }[];

  return (
    <>
      {items.map((i) => (
        <a
          key={i.label}
          href={i.href}
          className={btn.ghost}
          {...(i.download ? { download: "" } : i.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {i.icon}
          {i.label}
        </a>
      ))}
    </>
  );
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1 text-sm text-accent">
      {children}
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
