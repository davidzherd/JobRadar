-- Job Radar — initial schema
-- Three tables (profiles / jobs / applications) + Row Level Security.
-- See docs/webapp-plan.md (WorkAutomation repo) §4–§9 for the design.
--
-- Model in one line: `jobs` is the dashboard INBOX (radar-managed, ephemeral);
-- `applications` is the statistics SENT-FOLDER (user-managed, permanent);
-- `profiles` extends auth.users and its `search_prefs` column is the access gate.

-- ---------------------------------------------------------------------------
-- profiles — one row per user, extends auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text,
  email            text,                 -- mirror of auth.users.email, for convenient joins
  target_roles     text[]      not null default '{}',   -- onboarding: roles wanted
  languages        text[]      not null default '{}',   -- onboarding: spoken languages
  onboarded_at     timestamptz,                          -- set when onboarding is submitted
  search_prefs     jsonb,                                -- ADMIN-authored radar config; NULL = not yet approved (the gate)
  rejected         boolean     not null default false,   -- ADMIN: true => Rejected page
  rejection_reason text,                                  -- ADMIN: optional, shown on Rejected page
  created_at       timestamptz not null default now()
);

comment on column public.profiles.search_prefs is
  'Per-user radar config (one profile.json user block, minus email). NULL until an admin approves — this is the access gate.';

-- ---------------------------------------------------------------------------
-- jobs — the dashboard inbox. Radar writes; user only ever deletes (on Send CV).
-- Up to ~100 not-yet-applied jobs per user; refilled once a day by the radar.
-- ---------------------------------------------------------------------------
create table public.jobs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  company    text,
  platform   text,                         -- Drushim / Greenhouse / AllJobs / …
  url        text not null,                -- external job link
  found_at   timestamptz not null default now(),  -- dashboard sorts by this, desc
  score      numeric,                      -- optional radar match score
  created_at timestamptz not null default now(),
  unique (user_id, url)                    -- lets the daily run upsert instead of duplicating
);

create index jobs_user_found_idx on public.jobs (user_id, found_at desc);

-- ---------------------------------------------------------------------------
-- applications — the statistics ledger. User-managed, permanent.
-- ---------------------------------------------------------------------------
create table public.applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  company    text,
  platform   text,                         -- Drushim / LinkedIn / Indeed / manual / …
  url        text,                         -- nullable for manual entries
  status     text not null default 'Pending'
             check (status in ('Unconfirmed','Pending','Ignored',
                               'Phone talk','First interview','Contract','Hired')),
  source     text not null default 'manual'
             check (source in ('radar','email','manual')),
  source_ref text,                         -- radar job id (e.g. 'alljobs:12345') for idempotency; null for manual
  applied_at date not null default (now() at time zone 'Asia/Jerusalem')::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_idx on public.applications (user_id);
-- A repeated email-link click or re-scrape must not create a second row (§8a).
create unique index applications_user_source_ref_idx
  on public.applications (user_id, source_ref)
  where source_ref is not null;

-- keep updated_at honest
create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger applications_touch_updated_at
  before update on public.applications
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — the backbone of multi-tenancy.
-- Every policy is scoped to the owner; the service-role key (radar + server
-- routes) bypasses RLS entirely, which is how gated columns get written.
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.jobs         enable row level security;
alter table public.applications enable row level security;

-- profiles: the user may read and create their OWN row, but never UPDATE it —
-- onboarding fields, search_prefs and rejected are all written server-side
-- (service role), so a user can't approve or un-reject themselves.
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- jobs: read own; delete own (Send CV removes the row). Inserts are radar-only (service role).
create policy jobs_select_own on public.jobs
  for select using (auth.uid() = user_id);
create policy jobs_delete_own on public.jobs
  for delete using (auth.uid() = user_id);

-- applications: full self-service on own rows (send CV, manual add, status changes, delete).
create policy applications_select_own on public.applications
  for select using (auth.uid() = user_id);
create policy applications_insert_own on public.applications
  for insert with check (auth.uid() = user_id);
create policy applications_update_own on public.applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy applications_delete_own on public.applications
  for delete using (auth.uid() = user_id);
