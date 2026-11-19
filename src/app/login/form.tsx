"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Deliberately generic: do not confirm whether the address exists.
      setError("Those credentials were not accepted.");
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="block text-[14px] font-medium text-ink">Email</label>
        <input
          id="email" type="email" required autoComplete="username" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-line bg-raised/60 px-4 text-[16px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_20%,transparent)]"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-[14px] font-medium text-ink">Password</label>
        <input
          id="password" type="password" required autoComplete="current-password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-line bg-raised/60 px-4 text-[16px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_20%,transparent)]"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[14px] text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit" disabled={busy}
        className="btn-grad mt-2 h-12 w-full rounded-xl text-[16px] font-semibold disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
