import Link from "next/link";
import type { ReactNode } from "react";

/** Shared input styling for the auth forms. */
export const authInput =
  "rounded-xl border border-black/15 bg-white/60 px-3 py-2.5 text-base text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-zinc-50";

export const authLabel =
  "flex flex-col gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300";

/** The small ◎ radar wordmark. */
function RadarMark() {
  return (
    <svg viewBox="0 0 26 26" fill="none" className="size-6 flex-none" aria-hidden="true">
      <circle cx="13" cy="13" r="12" stroke="var(--brand)" strokeWidth="1.4" opacity="0.5" />
      <circle cx="13" cy="13" r="7.5" stroke="var(--brand)" strokeWidth="1.2" opacity="0.4" />
      <circle cx="13" cy="13" r="2" fill="var(--brand)" />
      <path d="M13 13V1" stroke="var(--brand)" strokeWidth="1.4" />
      <circle cx="19" cy="7" r="1.6" fill="var(--accent)" />
    </svg>
  );
}

/** Faint full-bleed radar scope with a slow sweep, behind the card. */
function RadarScope() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 grid place-items-center opacity-40"
      aria-hidden="true"
    >
      <svg viewBox="0 0 600 600" className="w-[min(680px,120vw)]" fill="none">
        <circle cx="300" cy="300" r="270" stroke="var(--brand)" strokeWidth="1" opacity="0.35" />
        <circle cx="300" cy="300" r="200" stroke="var(--brand)" strokeWidth="1" opacity="0.3" />
        <circle cx="300" cy="300" r="130" stroke="var(--brand)" strokeWidth="1" opacity="0.25" />
        <line x1="30" y1="300" x2="570" y2="300" stroke="var(--brand)" strokeWidth="1" opacity="0.18" />
        <line x1="300" y1="30" x2="300" y2="570" stroke="var(--brand)" strokeWidth="1" opacity="0.18" />
        <g className="radar-sweep">
          <path d="M300 300 L300 30 A270 270 0 0 1 490 110 Z" fill="var(--brand)" opacity="0.12" />
        </g>
        <circle cx="430" cy="180" r="4" fill="var(--accent)" />
      </svg>
    </div>
  );
}

/** Full-screen glass auth layout used by /login and /register. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-bg relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <RadarScope />
      <div className="glass-card relative z-10 w-full max-w-sm rounded-3xl p-7">
        <Link href="/" className="mb-5 flex items-center gap-2 no-underline">
          <RadarMark />
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Job Radar
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}
