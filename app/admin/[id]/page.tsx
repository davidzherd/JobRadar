import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Avatar } from "@/components/avatar";
import { skeletonPrefs } from "@/lib/admin/prefs-template";
import { approveApplicant, rejectApplicant } from "../actions";

interface Detail {
  id: string;
  full_name: string | null;
  email: string | null;
  target_roles: string[] | null;
  languages: string[] | null;
  onboarded_at: string | null;
  cv_path: string | null;
  cv_uploaded_at: string | null;
  search_prefs: unknown | null;
  rejected: boolean;
  rejection_reason: string | null;
}

function when(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</span>
      <span className="text-sm text-zinc-800 dark:text-zinc-100">{children}</span>
    </div>
  );
}

export default async function ApplicantDetailPage(props: PageProps<"/admin/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const admin = createAdminClient();
  const { data: p } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, target_roles, languages, onboarded_at, cv_path, cv_uploaded_at, search_prefs, rejected, rejection_reason",
    )
    .eq("id", id)
    .single<Detail>();

  if (!p) notFound();

  // Short-lived signed URL for the private CV (service-role only).
  let cvUrl: string | null = null;
  if (p.cv_path) {
    const { data: signed } = await admin.storage.from("cv").createSignedUrl(p.cv_path, 60 * 30);
    cvUrl = signed?.signedUrl ?? null;
  }

  const status = p.rejected ? "rejected" : p.search_prefs ? "live" : "waiting";
  const prefsValue = p.search_prefs
    ? JSON.stringify(p.search_prefs, null, 2)
    : skeletonPrefs(p.target_roles ?? []);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      <Link href="/admin" className="text-sm text-zinc-500 no-underline hover:text-zinc-800 dark:hover:text-zinc-200">
        ← Back to queue
      </Link>

      <div className="flex items-center gap-3">
        <Avatar name={p.full_name} seed={p.id} size={44} />
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {p.full_name || "Unnamed applicant"}
        </h1>
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-xs font-semibold " +
            (status === "live"
              ? "bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300"
              : status === "rejected"
                ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300")
          }
        >
          {status === "live" ? "Live" : status === "rejected" ? "Rejected" : "Waiting"}
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      )}

      <section className="grid grid-cols-2 gap-4 rounded-2xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <Field label="Email">{p.email || "—"}</Field>
        <Field label="Submitted">{when(p.onboarded_at)}</Field>
        <Field label="Roles">{p.target_roles?.length ? p.target_roles.join(", ") : "—"}</Field>
        <Field label="Languages">{p.languages?.length ? p.languages.join(", ") : "—"}</Field>
        <div className="col-span-2 flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">CV</span>
          {cvUrl ? (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-teal-600 no-underline hover:underline dark:text-teal-400"
            >
              Open CV (PDF) · uploaded {when(p.cv_uploaded_at)} ↗
            </a>
          ) : (
            <span className="text-sm text-zinc-500">No CV on file</span>
          )}
        </div>
      </section>

      {p.rejected && p.rejection_reason && (
        <p className="rounded-lg bg-zinc-500/10 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Rejection reason: {p.rejection_reason}
        </p>
      )}

      {/* Approve — author search_prefs, which opens the gate + emails the user. */}
      <section className="flex flex-col gap-3 rounded-2xl border border-teal-500/25 bg-teal-500/[0.04] p-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {status === "live" ? "Update radar config" : "Approve — write search_prefs"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            One radar profile block (minus email). Seeded from their roles — tune the skills,
            title weights and AllJobs category ids, then save. Saving switches the radar on and
            emails the user.
          </p>
        </div>
        <form action={approveApplicant} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={p.id} />
          <textarea
            name="search_prefs"
            defaultValue={prefsValue}
            spellCheck={false}
            rows={20}
            dir="ltr"
            className="w-full rounded-xl border border-black/15 bg-white/80 p-3 font-mono text-xs leading-relaxed text-zinc-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-white/15 dark:bg-black/30 dark:text-zinc-100"
          />
          <button
            type="submit"
            className="self-start rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            {status === "live" ? "Save config" : "Approve & switch on →"}
          </button>
        </form>
      </section>

      {/* Reject — flag the profile; no email. */}
      {status !== "rejected" && (
        <section className="flex flex-col gap-3 rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">Reject</h2>
          <form action={rejectApplicant} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={p.id} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Reason <span className="text-xs font-normal text-zinc-400">(optional — shown to the user)</span>
              <textarea
                name="reason"
                rows={2}
                className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/15 dark:bg-white/5 dark:text-zinc-100"
              />
            </label>
            <button
              type="submit"
              className="self-start rounded-xl border border-red-500/40 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              Reject application
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
