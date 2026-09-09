"use client";

import { useState } from "react";

/**
 * Chip/tag input. Each tag is submitted as a separate hidden input named
 * `name`, so the server action reads them with formData.getAll(name).
 */
export function TagInput({
  name,
  initial = [],
  placeholder,
}: {
  name: string;
  initial?: string[];
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  function add(value: string) {
    const t = value.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setDraft("");
  }
  function removeAt(i: number) {
    setTags(tags.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-black/15 bg-white/60 px-2.5 py-2 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/30 dark:border-white/15 dark:bg-white/5">
      {tags.map((t, i) => (
        <span
          key={t}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/25 bg-teal-600/10 py-1 pl-2.5 pr-1.5 text-sm font-medium text-teal-800 dark:text-teal-300"
        >
          {t}
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label={`Remove ${t}`}
            className="text-teal-700/60 hover:text-teal-700 dark:text-teal-300/60 dark:hover:text-teal-200"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) {
            removeAt(tags.length - 1);
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={tags.length ? "" : placeholder}
        className="min-w-32 flex-1 bg-transparent px-1 py-1 text-base text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
      />
      {tags.map((t) => (
        <input key={`h-${t}`} type="hidden" name={name} value={t} />
      ))}
    </div>
  );
}
