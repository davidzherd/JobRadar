# Job Radar — Web App Architecture Plan

Status: **Planning** · Last updated: 2026-09-09

This turns the existing Job Radar (Node/TS scraper that emails a daily digest) into a
multi-user web app: friends register, get a personal dashboard of jobs the radar found for
them, and track every CV they send in a statistics view. Long term this can become a SaaS.

---

## 1. Goals

- A **DB of users**, each with their **own set of jobs** (up to 100 newest per user).
- Three surfaces: **Authentication**, **Dashboard**, **Statistics** (+ an **Onboarding** step).
- The existing GitHub radar keeps running and **writes each user's matched jobs** into their inbox.
- Users can act on jobs ("Send CV") and manually log applications made elsewhere (LinkedIn, Indeed).
- Ready to scale from ~5 friends toward ~400 users without re-architecting.

---

## 2. Stack (decided)

| Concern        | Choice                    | Why |
|----------------|---------------------------|-----|
| Database       | **Supabase (Postgres)**   | Relational data + Auth + Storage + Row Level Security in one service. |
| Auth           | **Supabase Auth**         | Email/password or magic link; integrates with RLS out of the box. |
| CV handling    | **Email attachment (v1)** | CV is emailed to the admin at onboarding, **not stored**. Supabase Storage deferred to v2 — see §10. |
| Admin notify   | **Gmail SMTP (nodemailer)** | Reuses the radar's existing sender to email the admin on registration + onboarding (§10). |
| Web app        | **Next.js (App Router)**  | Server Components + serverless route handlers where secrets are needed. |
| Hosting        | **Vercel**                | First-class Next.js host; Vercel Cron available as a fallback scheduler. |
| Radar          | **GitHub Actions (Node/TS)** | Existing pipeline; gains a Supabase write step using the same JS client. |
| Scheduling     | **Supabase pg_cron**      | Nightly "Ignored" sweep runs inside the DB. |

**Serverless reality check:** you'll write *few* Next.js API routes. The Supabase JS client
+ RLS lets the browser read/write the user's own data securely without a custom backend.
Dedicated serverless functions are only needed for: auth callbacks, the CV upload signed URL
(optional — client can do it), and any server-only secret work later (e.g. LLM CV parsing).

**Key distribution:**
- **Radar** uses the **service-role key** (bypasses RLS; it writes on behalf of every user). Secret, lives only in GitHub Actions secrets.
- **Browser** uses the **anon key + the logged-in user's session**. RLS confines every query to that user's rows.

---

## 2a. Repository layout (decided)

**Two repos, integrated through the Supabase database — not through shared code.**
What flows between the systems is data (the radar writes `jobs`, reads `search_prefs`; the app
does the reverse), so the coupling is a **schema contract**, not a code dependency.

| Repo | Owns | Deploys via |
|------|------|-------------|
| **WorkAutomation** (existing) — `github.com/davidzherd/WorkAutomation` | The radar: scraping, scoring, the AllJobs category reference. **Gains** a "write per-user `jobs` to Supabase" step + a "read `search_prefs`" step. | GitHub Actions (cron) |
| **JobRadar** (new) — `github.com/davidzherd/JobRadar` | The Next.js web app: auth, onboarding, waiting/rejected, dashboard, statistics, admin flow. **Owns the DB schema + SQL migrations** (it's the DB-centric app). | Vercel |

**Why separate:** clean deploy boundaries (Vercel builds JobRadar's root; the radar's cron stays
put — no path-filter gymnastics), independent lifecycles, and the mature radar stays insulated from
greenfield churn.

**The one discipline it demands:** a schema change spans both repos and isn't atomic. Supabase
migrations (in JobRadar) are the single source of truth; the radar just consumes a client against the
agreed shape. Only extract a shared TypeScript types package **if** the `Job` / `search_prefs` types
start drifting — not up front; a little duplication beats a shared package for two repos.

---

## 3. System overview

```
   GitHub Action (Node/TS radar, scheduled)
        │  reads every user's search_prefs
        │  scrapes + scores, writes jobs per user_id
        │  (service-role key → bypasses RLS)
        ▼
   ┌──────────────────────────────────────────────┐
   │  Supabase                                     │
   │   Postgres: profiles / jobs / applications    │
   │   Auth · Storage (private CV bucket)          │
   │   pg_cron: nightly Pending→Ignored sweep      │
   └──────────────────────────────────────────────┘
        ▲
        │  Supabase JS client (anon key + user session, RLS-scoped)
        ▼
   Next.js on Vercel
     Onboarding · Dashboard · Statistics · Auth
```

---

## 4. Data model

Think of it as **an inbox and a sent-folder**. Nothing shared between them except the moment
of "sending a CV," which moves a record from one to the other.

### `profiles` — one row per user
Extends Supabase `auth.users`.

| column               | type        | written by | notes |
|----------------------|-------------|------------|-------|
| `id`                 | uuid (PK)   | signup     | = `auth.users.id` |
| `full_name`          | text        | onboarding | |
| `email`              | text        | onboarding | mirror of `auth.users.email` for convenient joins/queries |
| `target_roles`       | text[]      | onboarding | roles the user wants (drives the dashboard card + informs config) |
| `languages`          | text[]      | onboarding | spoken languages, for language-requirement filtering |
| `onboarded_at`       | timestamptz | onboarding | set when the onboarding form is submitted — separates "new" from "waiting" |
| `search_prefs`       | jsonb       | **admin**  | the per-user radar config (see §4a). **NULL until approved** — this is the access gate (§6) |
| `rejected`           | boolean     | **admin**  | `true` declines the application → routing shows the **Rejected** page. Default `false` |
| `rejection_reason`   | text        | **admin**  | optional (nullable) — shown on the Rejected page when present |
| `created_at`         | timestamptz | signup     | default `now()` |

The dashboard's profile card is **derived** from `target_roles` + `search_prefs` (skills/titles from
the config), so there are no separate user-entered `headline` / `skills` / `experience_summary` columns —
each field above has exactly one writer, which keeps RLS simple (users never write the gated columns).

> **v1 has no CV column** — the CV is emailed to the admin at onboarding, not stored (§10).
> Re-add `cv_path` / `cv_uploaded_at` alongside Supabase Storage in v2 if in-app CV features land.

### `jobs` — the dashboard inbox (max 100/user, radar-managed)
Only **new, not-yet-applied** jobs. **No workflow status here.**

| column      | type        | notes |
|-------------|-------------|-------|
| `id`        | uuid (PK)   | |
| `user_id`   | uuid (FK)   | → `profiles.id` |
| `title`     | text        | |
| `company`   | text        | |
| `platform`  | text        | source board (Drushim, Greenhouse, …) |
| `url`       | text        | external job link |
| `found_at`  | timestamptz | **dashboard sorts by this, desc** |
| `score`     | numeric     | optional, radar's match score |

Retention: **up to** 100 not-yet-applied jobs per user, topped up **once a day** by the radar
run — not on demand. When a user applies to a job the row leaves this table, so the inbox
simply shows fewer (e.g. 99) until the next daily run refills it. No per-apply re-scrape.

### `applications` — the statistics ledger (permanent)
Born when the user **sends a CV** (or logs one manually). The **only** table statistics reads.

| column       | type        | notes |
|--------------|-------------|-------|
| `id`         | uuid (PK)   | |
| `user_id`    | uuid (FK)   | → `profiles.id` |
| `title`      | text        | |
| `company`    | text        | |
| `platform`   | text        | Drushim / LinkedIn / Indeed / … |
| `url`        | text        | nullable for manual entries |
| `status`     | text/enum   | see §5 |
| `source`     | text/enum   | `radar` (in-app Send CV) \| `email` (tracked link click) \| `manual` |
| `applied_at` | date        | date the CV was sent (user-editable for manual) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Dedupe keys (in SQL, not shown above):** `jobs` has `unique (user_id, url)` so the radar's daily
run upserts rather than duplicates; `applications` has a nullable `source_ref` (the radar's job id,
e.g. `alljobs:12345`) with a partial `unique (user_id, source_ref)` so a repeated email-link click or
re-scrape is idempotent (§8a). Manual entries leave `source_ref` null.

### 4a. `search_prefs` shape — the contract between the two repos

`search_prefs` is **exactly one radar user-profile block** (what `config/profile.json` calls a
`users[]` entry, minus `email`). The radar's existing `UserConfig`/`SearchProfile` TypeScript types are
the **source of truth**; the app's admin flow just produces JSON of the same shape. Skeleton:

```jsonc
{
  "tracks": [                       // one or more disciplines, each scored independently
    {
      "id": "primary",
      "label": "QA — mid level",
      "yearsOfExperience": 4,
      "minScorePercent": 55,         // per-track threshold for the digest / dashboard
      "queries": ["QA", "בודק תוכנה"],           // Drushim free-text
      "skills":        [{ "term": "postman", "weight": 10 }],
      "titleIncludes": [{ "term": "qa", "weight": 14 }],
      "titleExcludes": ["senior"],
      "providerQueries": { "alljobs": ["431"] }, // AllJobs category ids (see reference)
      "priorityAbovePercent": 60     // optional
    }
  ],
  "titleExcludes": ["devops", "sales"],          // profile-wide
  "contentExcludes": ["security clearance"],
  "locations": ["tel aviv", "remote"],
  "remoteOk": true,
  "providerQueries": { "greenhouse": ["wizinc"] }, // profile-wide board tokens
  "maxResultsPerEmail": 50
}
```

Because it's stored as `jsonb`, the shape can evolve without a migration. The radar reads it straight
into its scorer; the app never interprets it beyond "present = approved."

---

## 5. Status lifecycle (lives only on `applications`)

`Unconfirmed · Pending · Ignored · Phone talk · First interview · Contract · Hired`

- **Unconfirmed** — set automatically when a user **clicks an apply link in the daily email** (§8a). We know they clicked, not that they sent the CV. It lives in a **separate table at the top of Statistics** asking the user to confirm (see §8), and is **excluded from statistics totals** until confirmed.
- **Pending** — set when a *confirmed* application is created: the in-app Send CV confirm modal, a manual add, or the user confirming an `Unconfirmed` row.
- **Ignored** — set automatically when a row has been **`Pending` or `Unconfirmed` for > 1 month** (dead / never-resolved). *Not* "a job nobody applied to" — unapplied jobs just age out of the 100-item inbox.
- **Phone talk → First interview → Contract → Hired** — the user sets these manually as things progress.

**Transitions:** an `Unconfirmed` row shows an **"I sent the CV"** button → status becomes `Pending` and the row moves down into the main confirmed table. (Or the user deletes it if it was a misclick.)

**Automation:** a nightly **pg_cron** job runs
`UPDATE applications SET status='Ignored' WHERE status IN ('Pending','Unconfirmed') AND applied_at < now() - interval '30 days'`.
It never touches a manually advanced status, so progress is never overwritten.

---

## 6. Key flows

**Radar write (per run):**
1. Read `search_prefs` for all users from Supabase (service-role).
2. Scrape + score as today.
3. Upsert matches into `jobs` under each `user_id`; prune each user back to newest 100 unapplied.
   This is the **only** moment the inbox refills — between runs it only shrinks as the user applies.
   If a user's prefs match nothing, the dashboard shows an **empty state** (acceptable; rare in practice).

**Send CV (dashboard):**
1. User clicks "Send CV" on a job → open `job.url` in a **new tab**.
2. Simultaneously open a confirm modal: *"Did you finish and send your CV?"*
3. On **Yes** → `INSERT` into `applications` (status `Pending`, source `radar`) **and** `DELETE` the row from `jobs`. It leaves the dashboard and appears in statistics.
4. On **No / close** → nothing changes; job stays in the inbox.

**Manual application (statistics):**
- A form (Job title, Company, Date sent, Platform) → `INSERT` into `applications`, source `manual`, status `Pending`. No `jobs` row involved.

**Applying straight from the daily email → tracked links (§8a):**
The digest's apply links are signed so a click logs the application without any login. Details in §8a.

**CV (onboarding, emailed — no Storage in v1):**
- Uploaded once during onboarding. The Next.js submit handler **emails the PDF to the admin** as an attachment (§10) instead of writing it to a bucket. No dashboard CV modal in v1.

**Onboarding (first login, one-time, never shown again):**
- Collect the essentials — **name, email, target role(s), languages known, CV**. The submit handler
  writes name/email/roles/languages to `profiles` and **emails the admin the details + CV** (§10).
- It does **not** write `search_prefs`. The user then lands on the **Waiting** screen until the admin
  reviews the submission, authors the config JSON, and writes it to the row — see the access gate below.

**Access gate — routing precedence (checked on every load):**
1. `rejected = true` → **Rejected** page (terminal; explains the profile wasn't approved, with `rejection_reason` if set).
2. else `search_prefs` present → **full app** (Dashboard + Statistics).
3. else onboarding submitted, `search_prefs` null → **Waiting / "under review"**.
4. else → **Onboarding**.

The root layout reads the profile once on load and routes. **Approval** is simply the admin writing
`search_prefs`; **rejection** is the admin setting `rejected = true`. Both take effect on the user's next
load (poll-on-load), and approval additionally sends the user an email (§10).

---

## 7. Decisions locked in

1. **Skills & experience: manual, no LLM (yet).** Entered by hand into the profile; the CV PDF is just stored for reference. An **Onboarding screen** will collect preferences + skills. LLM parsing is a future upgrade (§9).
2. **Radar → users: per-user criteria in the DB.** Each profile's `search_prefs` drives what the radar writes for that user. Scales to hundreds of users.
3. **Registration: invite-only** while it's friends. Open self-serve signup is a later switch.
4. **Two tables, not one status field.** `jobs` (dashboard inbox) and `applications` (statistics ledger) are separate; "Send CV" moves a record between them.
5. **Tracked email apply links (§8a).** Signed per-user tokens let an apply-from-email click log the application with no login — created as **`Unconfirmed`** in a separate top table on Statistics (not counted in totals until the user hits "I sent the CV" → `Pending`). Manual-add form remains the catch-all for truly external platforms.
6. **CV by email, no Storage in v1 (§10).** The CV is emailed to the admin at onboarding submit; Supabase Storage is deferred to v2. The app has no runtime need for the file — "Send CV" only opens the external listing, where the user attaches their own CV.
7. **Access is gated on config presence, with an explicit rejected state.** Routing precedence: `rejected` → Rejected page; else `search_prefs` present → full app; else → Waiting/Onboarding (§6). The admin authoring the config is approval; setting `rejected = true` is decline.
8. **The user gets one email on approval; nothing else.** No per-job or in-app notifications in v1, and no admin-side dashboard — the admin works from the inbox (§10). Rejection is shown as a page, not emailed.

---

## 8. Pages

- **Auth** — Supabase Auth (email/password or magic link). Invite-only for now.
- **Onboarding** — one-time form (name, email, role(s), languages, CV) → writes `profiles` + emails admin the CV (§10). Never shown again.
- **Waiting / under review** — shown while onboarded but `search_prefs` is still null (§6). Progress state; polls on load and flips to Dashboard once approved.
- **Rejected** — shown when `rejected = true` (§6). Explains the profile wasn't approved, with `rejection_reason` if the admin set one. Terminal.
- **Dashboard** — newest 100 `jobs` by `found_at`; profile summary card; per-job "Send CV". (No CV modal in v1 — CV is handled at onboarding, §10.)
- **Statistics** — two tables + widgets, all reading `applications`:
  - **Unconfirmed table (top):** rows with status `Unconfirmed` (email clicks). Each has an **"I sent the CV"** button (→ `Pending`, row drops into the main table) and a delete/dismiss. This is a small to-do list, shown only when non-empty.
  - **Main table (below):** confirmed applications (`Pending` and beyond) — title, company, date sent, platform, status (status is user-editable here to advance the funnel).
  - **Widgets:** total CVs sent, count per status, CVs sent in last X months — cheap Postgres aggregates. **Count `Pending` and beyond only**, so `Unconfirmed` rows never inflate the numbers.
  - Both tables are one `applications` table under the hood — just filtered by status, so "moving" a row is simply the status flip re-rendering it in the other table.

---

## 8a. Tracked email apply links (decided)

Closes the "applied from the email" gap **without requiring login**. Identity travels inside a
signed token, not a browser session — same idea as magic-login / one-click-unsubscribe links.

**Minting (in the radar, at email-compose time):**
Each apply link is built as `https://app.com/apply?t=<token>` where the token is a signed
payload `{ user_id, job_id, title, company, platform, url, exp }`. Signed with `APP_LINK_SECRET`
(HMAC-SHA256 / JWT). Because only the radar holds the secret, tokens can't be forged.

**On click (Next.js serverless endpoint):**
1. Verify the signature → proves which user, no login needed.
2. Create an **`Unconfirmed`** application from the token payload (deduped on `(user_id, job_id)`), source `email`.
3. `302` redirect to the real `url`.

The row lands in the **Unconfirmed table** at the top of Statistics until the user hits
"I sent the CV" (→ `Pending`, moves to the main table) or deletes it. This is why the click
doesn't inflate stats — see §5 and §8.

**Rules:**
- **Self-contained token** — carries the job's `title/company/platform/url`, so a late click still
  works even after the daily run pruned that job from the `jobs` inbox.
- **Idempotent** — a second click on the same link is a no-op (dedupe key `(user_id, job_id)`).
- **Expiry** — tokens expire (~30 days) so stale links go dead.
- **Low blast radius** — a leaked link can at most mark one job "applied" for that user; easily deleted.
- **Click ≠ sent** — handled by the dedicated **`Unconfirmed`** status (§5): the row is created
  unconfirmed in its own top table, excluded from stats totals, and the user confirms it to
  `Pending` (via "I sent the CV") or deletes it.

**New secret:** `APP_LINK_SECRET` in both GitHub Actions secrets (sign) and Vercel env (verify).

## 9. Security notes

- **RLS on every table**, policy `auth.uid() = user_id`. A user physically cannot read another user's rows — enforced in the database, not app code. This is the backbone of multi-tenancy.
- Service-role key only in GitHub Actions secrets, never shipped to the browser.
- **v1 has no CV bucket** — the CV is emailed to the admin, so there's no stored-file attack surface. Private-bucket + signed-URL handling returns in v2 only if in-app CV features land (§10).
- The onboarding email carries a CV (PII): it goes only to the admin's own address, sent from the app's Gmail. Keep the admin inbox as the trust boundary.

---

## 10. Registration & onboarding notifications — email, no CV storage (decided)

Two signals reach the admin (David) by email, reusing the radar's existing **Gmail SMTP / nodemailer**
sender. This is also what lets v1 **drop Supabase Storage**: the CV travels as an email attachment,
not into a bucket.

**a) Registration heads-up (lightweight).**
When someone consumes an invite and creates their account, email the admin a short "new registration":
email + invite code used + timestamp. Informational only — there's nothing to review yet, because the
CV and details don't exist until onboarding.

**b) Onboarding submission (the actionable one — carries the CV).**
When the user submits onboarding, the Next.js **server route** that handles the submit:
1. Writes the profile row — `full_name`, `email`, target `role(s)`, `languages`. Leaves `search_prefs` null (pre-active).
2. **Emails the admin** the submission: name, roles, languages, `user_id`, and the **CV PDF attached**.
3. Renders the **Waiting** screen.

The admin reviews the email + CV, then either:
- **Approves** — writes the config JSON to the row (`search_prefs`) → gate opens (§6). **An approval email is sent to the user** ("your radar is live — sign in"). This is decided v1 infra, sent via the same Gmail SMTP sender.
- **Declines** — sets `rejected = true` (optionally with `rejection_reason`) → the user sees the **Rejected** page on next load. No rejection email in v1.

**Why email instead of Storage**
- The **only** consumer of the CV is the admin, at review time. "Send CV" (§6) just opens the external
  listing; the user attaches their own CV there — the app never injects the stored file. Nothing at
  runtime needs a CV store.
- Removes the entire Storage surface from v1: no bucket, no per-user bucket RLS, no signed URLs.
- Reuses infra that already exists (the radar's Gmail SMTP sender).
- The CV lands exactly where the review happens — the admin's inbox.

**Implication — know what this forecloses**
- No canonical, app-readable CV. In-app "CV on file / replace CV / download my CV", or server-side
  **LLM CV parsing** (§11), all need the file server-side — email is a one-way drop. Revisit Storage then.
- The onboarding **"Replace CV"** affordance and any dashboard CV card are **not in v1**.
- CV (PII) sits in Gmail rather than a private bucket — both admin-only, roughly equivalent exposure (§9).

**How the user learns their outcome:** two channels, both decided.
- **Approval:** the app polls on load (Waiting → Dashboard once `search_prefs` appears) **and** the user
  gets an approval email so they know to come back — the one and only user-facing notification in v1.
- **Rejection:** poll-on-load surfaces the Rejected page (§6). Not emailed.

There is **no admin dashboard** in v1 — the admin reviews and acts (writes config / sets `rejected`)
straight from the inbox + Supabase table editor. No further notifications of any kind.

**New/reused secrets:** the app's Next.js env needs the Gmail SMTP creds (same account the radar uses)
and the admin's destination address.

---

## 11. Future / out of scope for v1

- **LLM CV parsing** to auto-fill skills/experience (revisit when volume justifies the cost).
- **Open self-serve signup** + email verification when going public.
- **Billing** (Stripe) for the SaaS phase.
- **RTL/Hebrew + English** — use logical CSS (start/end, not left/right) from day one per project convention.
- **Notifications** (in-app or push) when new jobs land, complementing the daily email.
- **Shared scrape cache / job pool (scaling the radar).** Today the pipeline is per-user and
  sequential (`src/index.ts` → `processUser` loops users; each scrapes, scores, and emails on its own
  iteration). No jobs are shared between users, so overlapping profiles re-scrape the same thing — ten
  QA users all hit AllJobs `431` and the same Greenhouse boards ten times. Runtime is roughly
  `users × queries × providers`; fine for a few friends, the bottleneck toward ~400 users.
  **Future refactor:** scrape **once per unique query/provider** into a shared job pool (cache keyed on
  the normalized query, e.g. an AllJobs category id or a Greenhouse board token, with a short TTL for
  one run), then score every user against that pool. Users with identical prefs then cost one scrape,
  not N. This also naturally splits the pipeline into phases — **gather all → score per user → send per
  user** — decoupling delivery from scraping. Keep per-user `seen`-state and per-user isolation as they
  are; only the fetch layer is shared.

---

## 12. Suggested build order

1. Supabase project: tables + RLS + a seeded test user. **No Storage bucket in v1** — CV goes by email (§10).
2. Radar write step (reads `search_prefs`, writes `jobs`) — reuses the existing TS client.
3. Next.js scaffold on Vercel + Supabase Auth (invite-only) + the config-presence access gate (§6).
4. Onboarding (name/email/role/languages/CV) → submit handler that writes the row and **emails the admin the CV** (§10) → Waiting screen.
5. Dashboard (list + Send CV move).
6. Statistics (ledger table + manual-add form + widgets).
7. pg_cron nightly Ignored sweep.
