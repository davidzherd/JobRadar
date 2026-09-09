import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { signout } from "@/app/auth/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/avatar";

interface Applicant {
  id: string;
  full_name: string | null;
  email: string | null;
  target_roles: string[] | null;
  onboarded_at: string | null;
  cv_uploaded_at: string | null;
  search_prefs: unknown | null;
  rejected: boolean;
  is_admin: boolean;
}

function when(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ApplicantRow({ a, action }: { a: Applicant; action?: boolean }) {
  return (
    <Link
      href={`/admin/${a.id}`}
      className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/60 px-4 py-3 no-underline transition-colors hover:border-teal-500/40 hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      <Avatar name={a.full_name} seed={a.id} size={38} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {a.full_name || "Unnamed"}
        </span>
        <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {a.email || "no email"}
          {a.target_roles?.length ? ` · ${a.target_roles.join(", ")}` : ""}
        </span>
      </span>
      <span className="flex-none text-xs text-zinc-400">{when(a.onboarded_at)}</span>
      {action && <span className="flex-none text-sm font-semibold text-teal-600 dark:text-teal-400">Review →</span>}
    </Link>
  );
}

export default async function AdminPage(props: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const approved = typeof sp.approved === "string" ? sp.approved : undefined;
  const rejected = sp.rejected === "1";

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, target_roles, onboarded_at, cv_uploaded_at, search_prefs, rejected, is_admin")
    .order("onboarded_at", { ascending: false })
    .returns<Applicant[]>();

  // Everyone who actually applied — admins included. An admin who applied (like
  // David, user #1) needs their own radar configured here too; a bare admin who
  // never onboarded matches none of the partitions below, so nothing to filter.
  const rows = data ?? [];
  const waiting = rows.filter((a) => a.onboarded_at && !a.search_prefs && !a.rejected);
  const live = rows.filter((a) => a.search_prefs && !a.rejected);
  const rejectedRows = rows.filter((a) => a.rejected);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10">
      <header className="flex items-center gap-2">
        <span className="text-lg text-teal-600 dark:text-teal-400">◎</span>
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Job Radar</span>
        <span className="rounded-full bg-teal-600/10 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
          Admin
        </span>
        <div className="ms-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-zinc-500 no-underline hover:text-zinc-800 dark:hover:text-zinc-200">
            Dashboard
          </Link>
          <ThemeToggle />
          <form action={signout}>
            <button className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">Sign out</button>
          </form>
        </div>
      </header>

      {approved && (
        <p className="rounded-lg bg-teal-500/10 px-3 py-2 text-sm text-teal-700 dark:text-teal-300">
          Radar switched on for {approved} — a go-live email is on its way.
        </p>
      )}
      {rejected && (
        <p className="rounded-lg bg-zinc-500/10 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Application rejected.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Waiting for review</h1>
          <span className="text-sm text-zinc-400">{waiting.length}</span>
        </div>
        {waiting.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-zinc-400 dark:border-white/10">
            No applications waiting. All caught up.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {waiting.map((a) => (
              <ApplicantRow key={a.id} a={a} action />
            ))}
          </div>
        )}
      </section>

      {live.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Live</h2>
            <span className="text-sm text-zinc-400">{live.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {live.map((a) => (
              <ApplicantRow key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      {rejectedRows.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-zinc-500 dark:text-zinc-400">Rejected</h2>
            <span className="text-sm text-zinc-400">{rejectedRows.length}</span>
          </div>
          <div className="flex flex-col gap-2 opacity-70">
            {rejectedRows.map((a) => (
              <ApplicantRow key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
