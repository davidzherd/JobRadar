"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EDITABLE_STATUSES, type AppStatus } from "@/lib/applications";

/**
 * All statistics mutations run under the user's own RLS (applications is fully
 * self-service). RLS scopes every write to the caller's rows, so filtering by
 * id alone can't touch anyone else's data.
 */
async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Confirm an email-click application: Unconfirmed → Pending. */
export async function confirmApplication(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("applications").update({ status: "Pending" }).eq("id", id).eq("status", "Unconfirmed");
  revalidatePath("/statistics");
}

/** Delete an application row (dismiss an Unconfirmed misclick, or remove a record). */
export async function deleteApplication(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("applications").delete().eq("id", id);
  revalidatePath("/statistics");
}

/** Advance/park an application along the funnel. */
export async function updateStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as AppStatus;
  if (!id || !EDITABLE_STATUSES.includes(status)) return;
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("applications").update({ status }).eq("id", id);
  revalidatePath("/statistics");
}

/** Log an application made elsewhere (LinkedIn, Indeed, …) — source manual, Pending. */
export async function addManualApplication(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const platform = String(formData.get("platform") ?? "").trim();
  const appliedAt = String(formData.get("applied_at") ?? "").trim();
  if (!title) return; // title is required (also enforced in the form)

  const { supabase, user } = await currentUser();
  if (!user) return;

  const row: Record<string, unknown> = {
    user_id: user.id,
    title,
    company: company || null,
    platform: platform || null,
    status: "Pending",
    source: "manual",
  };
  if (appliedAt) row.applied_at = appliedAt; // else the DB default (today) applies

  await supabase.from("applications").insert(row);
  revalidatePath("/statistics");
}
