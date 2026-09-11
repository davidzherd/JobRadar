import Link from "next/link";
import { signout } from "@/app/auth/actions";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

/** Shared top nav for the signed-in app surfaces (Dashboard, Statistics). */
export function AppHeader({
  current,
  isAdmin = false,
}: {
  current: "dashboard" | "statistics";
  isAdmin?: boolean;
}) {
  const tab = (href: string, label: string, key: "dashboard" | "statistics") => (
    <Link
      href={href}
      className={
        "text-sm no-underline transition-colors " +
        (key === current
          ? "font-semibold text-zinc-900 dark:text-zinc-50"
          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200")
      }
      aria-current={key === current ? "page" : undefined}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 flex items-center gap-2 border-b border-black/5 bg-[var(--background)]/70 px-5 py-4 backdrop-blur-md dark:border-white/10">
      <span className="text-lg text-teal-600 dark:text-teal-400">◎</span>
      <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Job Radar</span>

      {/* Desktop nav */}
      <nav className="ms-6 hidden items-center gap-4 sm:flex">
        {tab("/dashboard", "Dashboard", "dashboard")}
        {tab("/statistics", "Statistics", "statistics")}
      </nav>

      <div className="ms-auto flex items-center gap-3 sm:gap-4">
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden text-sm text-zinc-500 no-underline hover:text-zinc-800 sm:inline dark:hover:text-zinc-200"
          >
            Admin
          </Link>
        )}
        <ThemeToggle />
        <form action={signout} className="hidden sm:block">
          <button className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">Sign out</button>
        </form>

        {/* Mobile burger */}
        <MobileNav current={current} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
