"use client";

import { useEffect, useState } from "react";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Light/dark switch for the navbar. Writes an explicit choice to
 * <html data-theme> (which globals.css and Tailwind's dark: variant read) and
 * persists it to localStorage. The pre-paint script in the root layout replays
 * that choice on the next load; with no choice, the OS preference governs.
 */
export function ThemeToggle() {
  // null until mounted, so server and first client render match (no hydration
  // mismatch) — the icon resolves once we can read the real theme.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("theme") : null;
    setDark(stored ? stored === "dark" : systemPrefersDark());
  }, []);

  function toggle() {
    const next = !(dark ?? systemPrefersDark());
    setDark(next);
    const value = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", value);
    try {
      localStorage.setItem("theme", value);
    } catch {
      /* private mode / storage blocked — the choice just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
      className="grid size-8 flex-none place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
    >
      {dark === null ? (
        <span className="size-4" />
      ) : dark ? (
        // Sun — click to go light
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        // Moon — click to go dark
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
