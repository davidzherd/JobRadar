import { requireStage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { RadarScope } from "@/components/radar-scope";
import { sendCv } from "./actions";

interface Job {
  id: string;
  title: string;
  company: string | null;
  platform: string | null;
  url: string;
  found_at: string;
  score: number | null;
}

/** Compact relative time — "just now", "3h ago", "2d ago", or a date. */
function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function JobCard({ job }: { job: Job }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white/70 p-4 transition-colors hover:border-teal-500/30 dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{job.title}</h3>
          {job.score != null && (
            <span className="flex-none rounded-full bg-teal-600/10 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              {Math.round(job.score)}% match
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {job.company || "Unknown company"}
          {job.platform ? ` · ${job.platform}` : ""}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">Found {ago(job.found_at)}</p>
      </div>

      <div className="flex flex-none items-center gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-zinc-700 no-underline transition-colors hover:bg-black/5 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10"
        >
          View ↗
        </a>
        <form action={sendCv}>
          <input type="hidden" name="job_id" value={job.id} />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Send CV
          </button>
        </form>
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  const { profile } = await requireStage("app");
  const firstName = profile.full_name?.trim().split(/\s+/)[0];

  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, title, company, platform, url, found_at, score")
    .order("found_at", { ascending: false })
    .limit(100)
    .returns<Job[]>();
  const jobs = data ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader current="dashboard" isAdmin={profile.is_admin} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {firstName ? `${firstName}'s radar` : "Your radar"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {jobs.length > 0
              ? `${jobs.length} open ${jobs.length === 1 ? "match" : "matches"} · refreshed daily`
              : "Refreshed daily"}
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <RadarScope className="size-56" />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                Still scanning for jobs
              </h2>
              <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
                The radar sweeps the boards once a day. Roles that match your profile will drop in
                right here — nothing for you to do in the meantime.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
