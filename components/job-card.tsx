"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { sendCv, dismissJob } from "@/app/dashboard/actions";

export interface Job {
  id: string;
  title: string;
  company: string | null;
  platform: string | null;
  url: string;
  found_at: string;
  score: number | null;
}

/** Compact relative time — "just now", "3h ago", "2d ago", or a date. */
function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function JobCard({ job }: { job: Job }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dismissing, startDismiss] = useTransition();

  // Open the posting in a new tab and ask whether they actually applied. Only a
  // "yes" moves the job to applications — otherwise the card stays put.
  function openAndAsk() {
    window.open(job.url, "_blank", "noopener,noreferrer");
    setConfirming(true);
  }

  function confirmSent() {
    startTransition(async () => {
      await sendCv(job.id);
      // Row is gone from the inbox now; revalidatePath re-renders without it.
      setConfirming(false);
    });
  }

  function notInterested() {
    startDismiss(async () => {
      await dismissJob(job.id);
    });
  }

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white/70 p-4 backdrop-blur-md transition-colors hover:border-teal-500/30 dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{job.title}</h3>
          {job.score != null && (
            <span className="flex-none rounded-full bg-teal-600/10 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              {Math.round(job.score)}% match
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {job.company || "Unknown company"}
          {job.platform ? ` · ${job.platform}` : ""}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">Found {ago(job.found_at)}</p>
      </div>

      <div className="flex flex-none flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={openAndAsk}
          disabled={dismissing}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Send CV ↗
        </button>
        <button
          type="button"
          onClick={notInterested}
          disabled={dismissing}
          className="text-xs font-medium text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-600 hover:underline disabled:opacity-50 dark:hover:text-zinc-300"
        >
          {dismissing ? "Removing…" : "Not interested"}
        </button>
      </div>

      {confirming && (
        <ConfirmDialog
          job={job}
          pending={pending}
          onConfirm={confirmSent}
          onCancel={() => setConfirming(false)}
        />
      )}
    </article>
  );
}

function ConfirmDialog({
  job,
  pending,
  onConfirm,
  onCancel,
}: {
  job: Job;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close on Escape (unless a save is in flight).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending, onCancel]);

  if (!mounted) return null;

  // Portal to <body>: the card's own backdrop-blur makes it the containing
  // block for position:fixed descendants, which would trap this overlay.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!pending) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-black/10 bg-[var(--background)] p-6 shadow-2xl dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Did you send your CV?</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          We opened{" "}
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{job.title}</span>
          {job.company ? ` at ${job.company}` : ""} in a new tab. Confirm once you&apos;ve applied and
          we&apos;ll move it to your applications.
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          Didn&apos;t open?{" "}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-700 underline dark:text-teal-300"
          >
            Open the posting
          </a>
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Yes, I sent it"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
