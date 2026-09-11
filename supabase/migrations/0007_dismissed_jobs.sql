-- Job Radar — "Not Interested" dismissals
-- When a user dismisses a job from the dashboard we delete the inbox row, but
-- the radar re-syncs the full current match set each day and would re-surface
-- it. This table is the tombstone list the radar checks: dismissed URLs are
-- skipped forever (same idea as skipping URLs already in `applications`).
--
-- Keyed by (user_id, url): url is the stable per-user identity of a listing,
-- matching the unique (user_id, url) on `jobs`. Radar reads these via the
-- service-role key (bypasses RLS).

create table public.dismissed_jobs (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  url          text not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, url)
);

alter table public.dismissed_jobs enable row level security;

-- The user owns their dismissals: they can read, add, and (should they ever
-- want a job back) delete them. Inserts happen server-side under the user's own
-- session, so an owner check is all that's needed.
create policy dismissed_jobs_select_own on public.dismissed_jobs
  for select using (auth.uid() = user_id);
create policy dismissed_jobs_insert_own on public.dismissed_jobs
  for insert with check (auth.uid() = user_id);
create policy dismissed_jobs_delete_own on public.dismissed_jobs
  for delete using (auth.uid() = user_id);
