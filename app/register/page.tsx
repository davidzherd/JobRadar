import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default async function RegisterPage(props: PageProps<"/register">) {
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const pending = sp.pending === "1";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <div className="mb-5 flex items-center gap-2">
          <span className="text-xl text-teal-600 dark:text-teal-400">◎</span>
          <span className="text-lg font-bold tracking-tight">Job Radar</span>
        </div>

        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Job Radar is invite-only — enter the code from your invite to join.
        </p>

        {pending ? (
          <p className="mt-5 rounded-lg bg-teal-500/10 px-3 py-3 text-sm text-teal-800 dark:text-teal-200">
            Almost there — check your email for a confirmation link, then sign in.
          </p>
        ) : (
          <>
            {error && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}

            <form action={signup} className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Invite code
                <input
                  type="text"
                  name="invite"
                  required
                  placeholder="RADAR-XXXX"
                  className="rounded-lg border border-black/15 bg-zinc-50 px-3 py-2 text-base text-black outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-white/15 dark:bg-zinc-800 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="rounded-lg border border-black/15 bg-zinc-50 px-3 py-2 text-base text-black outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-white/15 dark:bg-zinc-800 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Password
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="rounded-lg border border-black/15 bg-zinc-50 px-3 py-2 text-base text-black outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-white/15 dark:bg-zinc-800 dark:text-white"
                />
              </label>
              <button
                type="submit"
                className="mt-2 rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Create account
              </button>
            </form>
          </>
        )}

        <p className="mt-5 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-teal-600 dark:text-teal-400">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
