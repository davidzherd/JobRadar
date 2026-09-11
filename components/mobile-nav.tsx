"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signout } from "@/app/auth/actions";

type Current = "dashboard" | "statistics" | "admin";

/**
 * Mobile-only (sm:hidden) burger menu. Tapping the burger opens a fullscreen
 * panel below the (sticky) header. The panel is rendered through a portal to
 * <body> — the header has a backdrop-filter, which would otherwise become the
 * containing block for this fixed panel and collapse it. Locks body scroll and
 * closes on Escape.
 */
export function MobileNav({ current, isAdmin = false }: { current: Current; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      aria-current={active ? "page" : undefined}
      className={
        "block border-b border-black/5 py-4 text-lg no-underline transition-colors dark:border-white/10 " +
        (active ? "font-semibold text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-300")
      }
    >
      {label}
    </Link>
  );

  const panel = (
    <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-[var(--background)] px-5 py-4">
      <nav className="flex flex-col">
        {item("/dashboard", "Dashboard", current === "dashboard")}
        {item("/statistics", "Statistics", current === "statistics")}
        {isAdmin && item("/admin", "Admin", current === "admin")}
      </nav>
      <form action={signout} className="mt-auto">
        <button className="w-full rounded-xl border border-black/15 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10">
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="relative z-50 grid size-8 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {mounted && open && createPortal(panel, document.body)}
    </div>
  );
}
