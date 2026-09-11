import Link from "next/link";
import { signout } from "@/app/auth/actions";
import { ThemeToggle } from "./theme-toggle";

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
    <header className="flex items-center gap-2 border-b border-black/5 px-5 py-4 dark:border-white/10">
      <span className="text-lg text-teal-600 dark:text-teal-400">◎</span>
      <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Job Radar</span>
      <nav className="ms-6 flex items-center gap-4">
        {tab("/dashboard", "Dashboard", "dashboard")}
        {tab("/statistics", "Statistics", "statistics")}
      </nav>
      <div className="ms-auto flex items-center gap-4">
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm text-zinc-500 no-underline hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Admin
          </Link>
        )}
        <ThemeToggle />
        <form action={signout}>
          <button className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">Sign out</button>
        </form>
      </div>
    </header>
  );
}
