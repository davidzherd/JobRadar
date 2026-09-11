"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * "Send CV" — moves a job out of the dashboard inbox into the applications
 * ledger as Pending (plan §5). Called only after the user confirms in the
 * dashboard dialog that they actually applied; if they don't confirm, the card
 * stays put and this never runs. Both writes run under the user's own RLS
 * (applications insert-own, jobs delete-own) — no service role needed. Insert
 * first, then delete, so a mid-way failure never loses the job silently.
 *
 * source_ref is the job url (its stable per-user identity here); a repeat click
 * after the row is gone finds no job and no-ops, and the unique (user_id,
 * source_ref) index absorbs a double-submit as an already-recorded application.
 */
export async function sendCv(jobId: string) {
  if (!jobId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: job } = await supabase
    .from("jobs")
    .select("title, company, platform, url")
    .eq("id", jobId)
    .single();
  if (!job) return; // already moved, or not the caller's row

  const { error: insErr } = await supabase.from("applications").insert({
    user_id: user.id,
    title: job.title,
    company: job.company,
    platform: job.platform,
    url: job.url,
    status: "Pending",
    source: "radar",
    source_ref: job.url,
  });
  // 23505 = unique_violation: this job is already in the ledger — fine, fall
  // through and clear it from the inbox. Any other error: leave the job put.
  if (insErr && insErr.code !== "23505") return;

  await supabase.from("jobs").delete().eq("id", jobId);
  revalidatePath("/dashboard");
}

/**
 * "Not Interested" — removes a job from the dashboard inbox for good. We record
 * the URL in `dismissed_jobs` first so the daily radar re-sync skips it (the
 * inbox is refilled from the full match set, so a plain delete would let it
 * reappear), then delete the inbox row. Both run under the user's own RLS.
 */
export async function dismissJob(jobId: string) {
  if (!jobId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: job } = await supabase.from("jobs").select("url").eq("id", jobId).single();
  if (!job) return; // already gone, or not the caller's row

  // Tombstone first. upsert (ignore duplicates) makes a repeat click a no-op.
  const { error: dismErr } = await supabase
    .from("dismissed_jobs")
    .upsert({ user_id: user.id, url: job.url }, { onConflict: "user_id,url", ignoreDuplicates: true });
  if (dismErr) return; // couldn't record the dismissal — leave the job put

  await supabase.from("jobs").delete().eq("id", jobId);
  revalidatePath("/dashboard");
}
