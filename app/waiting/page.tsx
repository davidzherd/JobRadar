import { requireStage } from "@/lib/auth/session";
import { signout } from "@/app/auth/actions";

export default async function WaitingPage() {
  await requireStage("waiting");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-2xl text-teal-600 dark:text-teal-400">◎</span>
      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300">
        Application under review
      </span>
      <h1 className="text-2xl font-bold tracking-tight">You&apos;re in the queue</h1>
      <p className="max-w-md text-zinc-500">
        We&apos;ve got your details and CV. Someone will review them and switch your radar on —
        you&apos;ll get an email the moment it&apos;s live.
      </p>
      <form action={signout}>
        <button className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">
          Sign out
        </button>
      </form>
    </main>
  );
}
