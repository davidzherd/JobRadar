import { requireStage } from "@/lib/auth/session";
import { signout } from "@/app/auth/actions";

export default async function RejectedPage() {
  const { profile } = await requireStage("rejected");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-2xl text-zinc-400">◎</span>
      <h1 className="text-2xl font-bold tracking-tight">Application not approved</h1>
      <p className="max-w-md text-zinc-500">
        Thanks for your interest in Job Radar. We&apos;re not able to switch your radar on right now.
      </p>
      {profile.rejection_reason && (
        <p className="max-w-md rounded-lg bg-black/5 px-4 py-3 text-sm text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
          {profile.rejection_reason}
        </p>
      )}
      <form action={signout}>
        <button className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">
          Sign out
        </button>
      </form>
    </main>
  );
}
