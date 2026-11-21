"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { profile } from "@/data/profile";
import { btn } from "./LinkButtons";

type Status = "idle" | "sending" | "success" | "error";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";
  if (message.length < 10) errors.message = "Message should be at least 10 characters.";
  return errors;
}

const field = "mt-2 w-full rounded-md border border-line bg-surface px-3 py-2.5 text-heading placeholder:text-muted/70 focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const configured = Boolean(profile.formspreeId);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length) {
      form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${profile.formspreeId}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const err = (k: keyof Errors) =>
    errors[k] && (
      <p id={`${k}-error`} className="mt-1.5 text-sm text-red-400 light:text-red-700">
        {errors[k]}
      </p>
    );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {!configured && (
        <p role="note" className="rounded-md border border-line bg-surface p-4 text-sm text-muted">
          The contact form isn&apos;t connected yet, so messages can&apos;t be sent from here.
          {profile.email && (
            <>
              {" "}Email me directly at{" "}
              <a className="text-accent underline" href={`mailto:${profile.email}`}>{profile.email}</a>.
            </>
          )}
        </p>
      )}
      <fieldset disabled={!configured || status === "sending"} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="text-sm text-heading">Name</label>
            <input id="name" name="name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
            {err("name")}
          </div>
          <div>
            <label htmlFor="email" className="text-sm text-heading">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
            {err("email")}
          </div>
        </div>
        <div>
          <label htmlFor="message" className="text-sm text-heading">Message</label>
          <textarea id="message" name="message" rows={5} className={field} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} />
          {err("message")}
        </div>
        <button type="submit" className={`${btn.primary} disabled:cursor-not-allowed`}>
          {status === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </fieldset>
      <p aria-live="polite" className="text-sm">
        {status === "success" && <span className="text-accent">Thanks, your message was sent. I&apos;ll get back to you soon.</span>}
        {status === "error" && <span className="text-red-400 light:text-red-700">Something went wrong sending your message. Please try again{profile.email ? ` or email ${profile.email}` : ""}.</span>}
      </p>
    </form>
  );
}
