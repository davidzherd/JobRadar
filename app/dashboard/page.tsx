import { requireStage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AppBackground } from "@/components/app-background";
import { RadarScope } from "@/components/radar-scope";
import { JobCard, type Job } from "@/components/job-card";

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
      <AppBackground />
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
