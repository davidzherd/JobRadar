import { requireStage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { StatusSelect } from "@/components/status-select";
import {
  SENT_STATUSES,
  IN_PROGRESS_STATUSES,
  STATUS_FLOW,
  STATUS_PILL,
  type AppStatus,
} from "@/lib/applications";
import { confirmApplication, deleteApplication, updateStatus, addManualApplication } from "./actions";

interface AppRow {
  id: string;
  title: string;
  company: string | null;
  platform: string | null;
  url: string | null;
  status: AppStatus;
  source: string;
  applied_at: string;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function DeleteButton({ id, label }: { id: string; label: string }) {
  return (
    <form action={deleteApplication} className="flex-none">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={label}
        title={label}
        className="grid size-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
          <path strokeLinecap="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      </button>
    </form>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

export default async function StatisticsPage() {
  const { profile } = await requireStage("app");

  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id, title, company, platform, url, status, source, applied_at")
    .order("applied_at", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<AppRow[]>();
  const rows = data ?? [];

  // Jobs still waiting in the dashboard inbox (radar-managed, ≤100).
  const { count: openJobs } = await supabase.from("jobs").select("id", { count: "exact", head: true });

  const unconfirmed = rows.filter((r) => r.status === "Unconfirmed");
  const confirmed = rows.filter((r) => r.status !== "Unconfirmed");

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);
  const sent = rows.filter((r) => SENT_STATUSES.includes(r.status));
  const sentCount = sent.length;
  const inProgress = rows.filter((r) => IN_PROGRESS_STATUSES.includes(r.status)).length;
  const sentLast3 = sent.filter((r) => new Date(r.applied_at) >= cutoff).length;

  // "Jobs suggested" = open inbox + suggested jobs already acted on (a Send CV
  // moves a radar job into applications; email-link clicks land there too). It
  // grows as the radar works and doesn't shrink when the user applies.
  const suggestedActedOn = rows.filter((r) => r.source === "radar" || r.source === "email").length;
  const jobsSuggested = (openJobs ?? 0) + suggestedActedOn;

  const breakdown = STATUS_FLOW.map((s) => ({ status: s, count: rows.filter((r) => r.status === s).length }));

  const today = new Date().toISOString().slice(0, 10);
  const inputCls =
    "rounded-xl border border-black/15 bg-white/70 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-zinc-50";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader current="statistics" isAdmin={profile.is_admin} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Applications</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Every CV you&apos;ve sent — from the radar, email links, or logged by hand.
        </p>

        {/* Widgets */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={jobsSuggested} label="Jobs suggested" />
          <StatTile value={sentCount} label="CVs sent" />
          <StatTile value={inProgress} label="In progress" />
          <StatTile value={sentLast3} label="Sent last 3 months" />
        </div>

        {sentCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {breakdown.map(({ status, count }) => (
              <span
                key={status}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[status]}`}
              >
                {status} · {count}
              </span>
            ))}
          </div>
        )}

        {/* Unconfirmed — email clicks awaiting "I sent the CV" */}
        {unconfirmed.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Did you send these? <span className="font-normal text-zinc-400">({unconfirmed.length})</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              You opened these from an email. Confirm the ones you actually applied to — they don&apos;t
              count until you do.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {unconfirmed.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{r.title}</h3>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {r.company || "—"}
                      {r.platform ? ` · ${r.platform}` : ""} · opened {fmtDate(r.applied_at)}
                    </p>
                  </div>
                  <form action={confirmApplication} className="flex-none">
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
                      I sent the CV
                    </button>
                  </form>
                  <DeleteButton id={r.id} label="Dismiss" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Confirmed ledger */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Sent <span className="font-normal text-zinc-400">({confirmed.length})</span>
          </h2>

          {confirmed.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-zinc-400 dark:border-white/10">
              No applications yet. Hit “Send CV” on the dashboard, or log one below.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {confirmed.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm font-semibold text-zinc-900 no-underline hover:underline dark:text-zinc-50"
                        >
                          {r.title}
                        </a>
                      ) : (
                        <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{r.title}</h3>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {r.company || "—"}
                      {r.platform ? ` · ${r.platform}` : ""} · sent {fmtDate(r.applied_at)}
                      {r.source === "manual" ? " · manual" : ""}
                    </p>
                  </div>
                  <StatusSelect id={r.id} current={r.status} action={updateStatus} />
                  <DeleteButton id={r.id} label="Delete application" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Manual add */}
        <details className="mt-8 rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Log an application sent elsewhere
          </summary>
          <form action={addManualApplication} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Job title
              <input name="title" required placeholder="QA Engineer" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Company
              <input name="company" placeholder="Acme" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Platform
              <input name="platform" placeholder="LinkedIn / Indeed / …" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Date sent
              <input type="date" name="applied_at" defaultValue={today} className={inputCls} />
            </label>
            <button
              type="submit"
              className="mt-1 justify-self-start rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 sm:col-span-2"
            >
              Add application
            </button>
          </form>
        </details>
      </main>
    </div>
  );
}
