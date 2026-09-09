import Link from "next/link";
import { login } from "@/app/auth/actions";
import { AuthShell, authInput, authLabel } from "@/components/auth-shell";

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Welcome back</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Sign in to see the jobs the radar found for you.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <form action={login} className="mt-5 flex flex-col gap-3">
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
            autoComplete="current-password"
            className={authInput}
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-xl bg-teal-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          Sign in
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
        New here?{" "}
        <Link href="/register" className="font-semibold text-teal-600 dark:text-teal-400">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
