import { requireStage } from "@/lib/auth/session";
import { signout } from "@/app/auth/actions";
import { submitOnboarding } from "./actions";
import { TagInput } from "@/components/tag-input";
import { authInput, authLabel } from "@/components/auth-shell";

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const { profile } = await requireStage("onboarding");
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <main className="auth-bg relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div className="glass-card relative z-10 my-6 w-full max-w-lg rounded-3xl p-7">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-lg text-teal-600 dark:text-teal-400">◎</span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Job Radar
          </span>
          <span className="ml-auto text-xs text-zinc-400">One-time setup</span>
        </div>

        <h1 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Set up your radar
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A few essentials, then we review your details and switch the radar on for you. You
          won&apos;t see this screen again.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <form action={submitOnboarding} className="mt-5 flex flex-col gap-4">
          <label className={authLabel}>
            Full name
            <input
              type="text"
              name="full_name"
              required
              defaultValue={profile.full_name ?? ""}
              className={authInput}
            />
          </label>

          <div className={authLabel}>
            Email
            <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-2.5 text-base text-zinc-500 dark:border-white/10 dark:bg-white/5">
              {profile.email ?? "—"}
            </div>
          </div>

          <div className={authLabel}>
            Roles you&apos;re applying for
            <span className="text-xs font-normal text-zinc-400">
              Press Enter or comma to add each one.
            </span>
            <TagInput name="roles" initial={profile.target_roles} placeholder="QA Automation Engineer" />
          </div>

          <div className={authLabel}>
            Languages you know
            <TagInput name="languages" initial={profile.languages} placeholder="Hebrew, English…" />
          </div>

          <label className={authLabel}>
            Your CV (PDF)
            <span className="text-xs font-normal text-zinc-400">
              Stored privately and sent to the team to build your match profile. PDF, max 5 MB.
            </span>
            <input
              type="file"
              name="cv"
              accept="application/pdf"
              required
              className="rounded-xl border border-black/15 bg-white/60 px-3 py-2.5 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:font-semibold file:text-white hover:file:bg-teal-700 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300"
            />
          </label>

          <button
            type="submit"
            className="mt-1 rounded-xl bg-teal-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            Submit for review →
          </button>
        </form>

        <form action={signout} className="mt-4 text-center">
          <button className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
