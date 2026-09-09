"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApprovalEmail } from "@/lib/email/mailer";
import { validatePrefs } from "@/lib/admin/prefs-template";

/**
 * Approve an applicant: write their `search_prefs` (which opens the gate), then
 * email them that the radar is live. Re-approving a previously rejected user
 * also clears the rejection. Guarded by requireAdmin — a non-admin is bounced
 * before any write. All writes go through the service-role client because users
 * have no UPDATE policy on profiles.
 */
export async function approveApplicant(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("search_prefs") ?? "");
  if (!id) redirect("/admin");

  const check = validatePrefs(raw);
  if ("error" in check) redirect(`/admin/${id}?error=${encodeURIComponent(check.error)}`);

  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("profiles")
    .update({ search_prefs: check.prefs, rejected: false, rejection_reason: null })
    .eq("id", id)
    .select("email, full_name")
    .single();
  if (error || !target) {
    redirect(`/admin/${id}?error=${encodeURIComponent("Couldn't save search_prefs. Try again.")}`);
  }

  if (target.email) {
    try {
      await sendApprovalEmail({ to: target.email, fullName: target.full_name });
    } catch {
      redirect(`/admin/${id}?error=${encodeURIComponent("Approved, but the go-live email failed to send.")}`);
    }
  }

  redirect(`/admin?approved=${encodeURIComponent(target.full_name ?? "applicant")}`);
}

/**
 * Reject an applicant: flag the profile and store an optional reason (shown on
 * their Rejected page). No email — the plan's only user-facing notification is
 * the approval mail.
 */
export async function rejectApplicant(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) redirect("/admin");

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ rejected: true, rejection_reason: reason || null })
    .eq("id", id);
  if (error) {
    redirect(`/admin/${id}?error=${encodeURIComponent("Couldn't reject. Try again.")}`);
  }

  redirect("/admin?rejected=1");
}
