-- Job Radar — cumulative "jobs suggested" counter on profiles.
--
-- A lifetime tally of how many jobs the radar has surfaced for a user, shown on
-- the Statistics page. The `jobs` inbox is ephemeral (capped at 100, rows leave
-- on Send CV), so it can't hold this — the radar adds each run's found-count to
-- this column. Written by the radar only (service-role); never decremented, so
-- applying to / clearing jobs doesn't lower it. Users have no UPDATE policy on
-- profiles, so it isn't user-settable.
--
-- The radar-side increment is added when the automation gets its Supabase write
-- step; until then this stays at its default of 0.

alter table public.profiles
  add column jobs_suggested_total integer not null default 0;

comment on column public.profiles.jobs_suggested_total is
  'Cumulative count of jobs the radar has suggested to this user. The radar adds each run''s found-count; never decremented.';
