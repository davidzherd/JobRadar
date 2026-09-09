-- Job Radar — CV storage (reverses the earlier "email-only" call; see plan §10)
--
-- A private bucket holds each user's CV as the canonical copy; the onboarding
-- email still carries an attachment as the admin's inbox copy. Access is
-- SERVICE-ROLE ONLY: the bucket is private and we add NO policies on
-- storage.objects, so anon/authenticated clients can't touch it. Uploads (from
-- the onboarding server action) and signed-URL reads (from the admin page) both
-- go through the service-role client, which bypasses RLS. Add owner policies
-- later only if users get in-app CV download/replace.
--
-- Bucket enforces its own guards: max 5 MB, PDF only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cv', 'cv', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- Re-add the profile pointers to the stored file.
alter table public.profiles
  add column cv_path text,
  add column cv_uploaded_at timestamptz;
