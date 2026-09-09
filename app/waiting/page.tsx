import { requireStage } from "@/lib/auth/session";
import { signout } from "@/app/auth/actions";
import { RadarScope } from "@/components/radar-scope";

const STEPS = [
  { n: "1", label: "We read your CV", sub: "and the details you sent us" },
  { n: "2", label: "We tune your radar", sub: "roles, skills and where to look" },
  { n: "3", label: "You get the go-ahead", sub: "an email the moment it's live" },
];

export default async function WaitingPage() {
  const { profile } = await requireStage("waiting");
  const firstName = profile.full_name?.trim().split(/\s+/)[0];

  return (
    <main className="auth-bg relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div className="glass-card relative z-10 my-6 w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-lg text-teal-600 dark:text-teal-400">◎</span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Job Radar
          </span>
        </div>

        <div className="flex justify-center">
          <RadarScope />
        </div>

        <span className="mt-6 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300">
          Application under review
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {firstName ? `You're on the radar, ${firstName}` : "You're on the radar"}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          We&apos;ve got your details and CV. Someone will review them and switch your radar on —
          there&apos;s nothing else you need to do right now.
        </p>

        <ol className="mx-auto mt-7 flex max-w-xs flex-col gap-3 text-start">
          {STEPS.map((step) => (
            <li key={step.n} className="flex items-center gap-3">
              <span className="grid size-7 flex-none place-items-center rounded-full bg-teal-600/10 text-sm font-semibold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                {step.n}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {step.label}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{step.sub}</span>
              </span>
            </li>
          ))}
        </ol>

        <form action={signout} className="mt-8">
          <button className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
