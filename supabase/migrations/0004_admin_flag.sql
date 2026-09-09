-- Job Radar — admin flag (see docs/webapp-plan.md §4, §6)
--
-- Admins see extra pages (user review, etc.) and bypass the onboarding/waiting
-- gate. Security: is_admin is NEVER user-settable.
--   * profiles has no user UPDATE policy (gated columns are written by the
--     service-role client), so a user cannot update their own is_admin.
--   * we drop the self-INSERT policy below, so a user cannot insert an admin
--     row either — the on_auth_user_created trigger (0003) creates the row,
--     always with is_admin = false.
-- Grant admin by flipping this flag in the Supabase table editor (or via a
-- service-role route). Admin reads of OTHER users' rows go through the
-- service-role client, not RLS.

alter table public.profiles
  add column is_admin boolean not null default false;

-- The trigger creates every profile row, so the client never needs to insert
-- its own. Removing the self-insert policy closes the last path to writing a
-- privileged column from the browser.
drop policy if exists profiles_insert_own on public.profiles;
