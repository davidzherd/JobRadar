"use client";

import { useState } from "react";
import Link from "next/link";
import { signout } from "@/app/auth/actions";

/**
 * Mobile-only (sm:hidden) burger menu for the app header. Collapses the nav
 * links + admin + sign out into a dropdown, so the header stays uncrowded on
 * narrow screens. The theme toggle stays out in the header (quick access).
 */
export function MobileNav({
  current,
  isAdmin = false,
}: {
  current: "dashboard" | "statistics";
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const item = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      aria-current={active ? "page" : undefined}
      className={
        "block rounded-lg px-3 py-2 text-sm no-underline transition-colors hover:bg-black/5 dark:hover:bg-white/10 " +
        (active ? "font-semibold text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-300")
      }
    >
      {label}
    </Link>
  );

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="grid size-8 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute end-0 top-full z-50 mt-2 w-44 rounded-xl border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
            {item("/dashboard", "Dashboard", current === "dashboard")}
            {item("/statistics", "Statistics", current === "statistics")}
            {isAdmin && item("/admin", "Admin", false)}
            <div className="my-1 border-t border-black/5 dark:border-white/10" />
            <form action={signout}>
              <button className="block w-full rounded-lg px-3 py-2 text-start text-sm text-zinc-600 transition-colors hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10">
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
