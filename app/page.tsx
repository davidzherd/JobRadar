export default function Home() {
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex items-center gap-3">
        <span className="text-2xl text-teal-600 dark:text-teal-400">◎</span>
        <h1 className="text-2xl font-bold tracking-tight">Job Radar</h1>
      </div>

      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Your personal job digest, from the radar to your dashboard. Invite-only while in beta.
      </p>

      <span
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          supabaseReady
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        }`}
      >
        {supabaseReady
          ? "Supabase connected"
          : "Set NEXT_PUBLIC_SUPABASE_URL and _ANON_KEY in .env.local"}
      </span>

      <p className="text-sm text-zinc-500">
        Scaffold ready — screens come next: login, onboarding, dashboard, statistics.
      </p>
    </main>
  );
}
