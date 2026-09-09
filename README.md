# JobRadar (web app)

The multi-user web app for Job Radar: friends register, get a personal dashboard of jobs the
radar found for them, and track every CV they send. Next.js on Vercel + Supabase.

The **radar** (scraping/scoring/email) lives in a separate repo,
[WorkAutomation](https://github.com/davidzherd/WorkAutomation). The two integrate through the
Supabase database — the radar writes each user's `jobs` and reads their `search_prefs`; this app
does the reverse. This repo **owns the database schema**. Full design: `docs/webapp-plan.md` in
WorkAutomation.

## Database schema

SQL migrations live in [`supabase/migrations/`](supabase/migrations):

| File | What it creates |
|------|-----------------|
| `0001_init.sql` | `profiles` / `jobs` / `applications` tables + Row Level Security. |
| `0002_ignored_sweep.sql` | The nightly pg_cron job that marks stale Pending/Unconfirmed applications `Ignored`. Needs the pg_cron extension enabled. |

**Apply** to a Supabase project either with the Supabase CLI (`supabase db push`) or by pasting each
file into the SQL editor in order. RLS confines every query to `auth.uid() = user_id`; the
service-role key (radar + server routes) bypasses RLS to write the gated columns (`search_prefs`,
`rejected`).

## Not built yet

The Next.js app itself (auth, onboarding, waiting/rejected, dashboard, statistics, admin flow) — see
the plan's build order.
