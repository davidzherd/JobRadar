/**
 * The application status funnel (plan §5). Statuses live only on the
 * `applications` table; the DB CHECK constraint is the source of truth for the
 * allowed set — keep this in sync with migration 0001.
 */

/** The confirmed funnel, in order. */
export const STATUS_FLOW = ["Pending", "Phone talk", "First interview", "Contract", "Hired"] as const;

/** Every status, including the pre-confirm and dead-end states. */
export const ALL_STATUSES = ["Unconfirmed", ...STATUS_FLOW, "Ignored"] as const;

export type AppStatus = (typeof ALL_STATUSES)[number];

/** What a user may set from the status dropdown (Unconfirmed is only reachable via an email click). */
export const EDITABLE_STATUSES: AppStatus[] = [...STATUS_FLOW, "Ignored"];

/** Counted as "a CV was sent" — excludes Unconfirmed (not yet confirmed) and Ignored (dead). */
export const SENT_STATUSES: AppStatus[] = [...STATUS_FLOW];

/** Actively progressing (past Pending, not yet a dead end). */
export const IN_PROGRESS_STATUSES: AppStatus[] = ["Phone talk", "First interview", "Contract", "Hired"];

/** Pill styling per status (tint + text, theme-aware). */
export const STATUS_PILL: Record<AppStatus, string> = {
  Unconfirmed: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Pending: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "Phone talk": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "First interview": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  Contract: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  Hired: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Ignored: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
};
