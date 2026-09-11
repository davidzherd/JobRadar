"use client";

import { EDITABLE_STATUSES } from "@/lib/applications";

/**
 * Inline status dropdown for an application row. Auto-submits its own form on
 * change (no separate save button). The server action is passed in from the
 * page so this stays a thin client wrapper.
 */
export function StatusSelect({
  id,
  current,
  action,
}: {
  id: string;
  current: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="flex-none">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Application status"
        className="rounded-lg border border-black/15 bg-white/70 px-2.5 py-1.5 text-sm font-medium text-zinc-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200"
      >
        {EDITABLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
