import { requireStage } from "@/lib/auth/session";
import { signout } from "@/app/auth/actions";

export default async function OnboardingPage() {
  await requireStage("onboarding");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-2xl text-teal-600 dark:text-teal-400">◎</span>
      <h1 className="text-2xl font-bold tracking-tight">Set up your radar</h1>
      <p className="max-w-md text-zinc-500">
        The one-time onboarding form (name, roles, languages, CV) goes here next. Submitting it
        will email your details to the admin and move you to the waiting stage.
      </p>
      <form action={signout}>
        <button className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">
          Sign out
        </button>
      </form>
    </main>
  );
}
