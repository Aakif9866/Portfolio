"use client";

import { Moon, Sun } from "lucide-react";

// Icon visibility is pure CSS (light: variant), so there's no hydration mismatch.
export function ThemeToggle() {
  const toggle = () => {
    const light = document.documentElement.classList.toggle("light");
    try {
      localStorage.setItem("theme", light ? "light" : "dark");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      className="grid size-9 place-items-center rounded-md border border-line text-muted transition-colors hover:text-heading"
    >
      <Sun className="size-4 light:hidden" aria-hidden />
      <Moon className="hidden size-4 light:block" aria-hidden />
    </button>
  );
}

// Inlined in <head> so the saved theme applies before first paint.
export const themeScript = `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}`;
