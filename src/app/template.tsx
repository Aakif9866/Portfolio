// Re-mounts on navigation, so the CSS fade replays per page. Disabled under reduced motion.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
