import { requireStage } from "@/lib/auth/session";
import { signout } from "@/app/auth/actions";

/** Big animated radar scope — the hero of the waiting room. */
function RadarHero() {
  return (
    <svg
      viewBox="0 0 600 600"
      className="size-44 flex-none"
      fill="none"
      role="img"
      aria-label="Radar scanning"
    >
      <defs>
        <linearGradient id="sweepFade" x1="300" y1="300" x2="300" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="300" cy="300" r="270" stroke="var(--brand)" strokeWidth="1.5" opacity="0.35" />
      <circle cx="300" cy="300" r="195" stroke="var(--brand)" strokeWidth="1.5" opacity="0.3" />
      <circle cx="300" cy="300" r="120" stroke="var(--brand)" strokeWidth="1.5" opacity="0.25" />
      <circle cx="300" cy="300" r="45" stroke="var(--brand)" strokeWidth="1.5" opacity="0.2" />
      <line x1="30" y1="300" x2="570" y2="300" stroke="var(--brand)" strokeWidth="1" opacity="0.16" />
      <line x1="300" y1="30" x2="300" y2="570" stroke="var(--brand)" strokeWidth="1" opacity="0.16" />

      <g className="radar-sweep">
        <path d="M300 300 L300 30 A270 270 0 0 1 505 130 Z" fill="url(#sweepFade)" />
        <line x1="300" y1="300" x2="300" y2="30" stroke="var(--brand)" strokeWidth="2" opacity="0.55" />
      </g>

      <circle className="radar-blip" cx="418" cy="205" r="6" fill="var(--accent)" />
      <circle className="radar-blip radar-blip-2" cx="210" cy="392" r="5" fill="var(--brand-2)" />
      <circle cx="300" cy="300" r="6" fill="var(--brand)" />
    </svg>
  );
}

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
          <RadarHero />
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
