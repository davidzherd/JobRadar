-- Job Radar — nightly "Ignored" sweep (see docs/webapp-plan.md §5)
--
-- Anything left Unconfirmed or Pending for > 30 days is dead; mark it Ignored.
-- It never touches a manually advanced status (Phone talk … Hired), so a user's
-- progress is never overwritten. Unapplied *jobs* are NOT swept here — they just
-- age out of the 100-item inbox on the radar's own schedule.
--
-- Requires the pg_cron extension. In Supabase: enable it once under
-- Database → Extensions (or run `create extension pg_cron;` as a superuser),
-- then apply this migration.

create extension if not exists pg_cron;

create or replace function public.sweep_stale_applications() returns void
  language sql as $$
  update public.applications
     set status = 'Ignored'
   where status in ('Pending','Unconfirmed')
     and applied_at < (now() at time zone 'Asia/Jerusalem')::date - interval '30 days';
$$;

-- 03:15 UTC nightly. Idempotent: unschedule an existing job of the same name first.
select cron.unschedule('sweep_stale_applications')
  where exists (select 1 from cron.job where jobname = 'sweep_stale_applications');

select cron.schedule('sweep_stale_applications', '15 3 * * *',
                     $$select public.sweep_stale_applications();$$);
