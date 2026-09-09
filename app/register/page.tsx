import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { AuthShell, authInput, authLabel } from "@/components/auth-shell";

export default async function RegisterPage(props: PageProps<"/register">) {
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const pending = sp.pending === "1";

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Create your account</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Job Radar is invite-only — enter the code from your invite to join.
      </p>

      {pending ? (
        <p className="mt-5 rounded-xl bg-teal-500/10 px-3 py-3 text-sm text-teal-800 dark:text-teal-200">
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
            <label className={authLabel}>
              Invite code
              <input
                type="text"
                name="invite"
                required
                placeholder="RADAR-XXXX"
                className={authInput}
              />
            </label>
            <label className={authLabel}>
              Email
              <input type="email" name="email" required autoComplete="email" className={authInput} />
            </label>
            <label className={authLabel}>
              Password
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={authInput}
              />
            </label>
            <button
              type="submit"
              className="mt-2 rounded-xl bg-teal-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              Create account
            </button>
          </form>
        </>
      )}

      <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-teal-600 dark:text-teal-400">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
