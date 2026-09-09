"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOnboardingEmail } from "@/lib/email/mailer";

const MAX_CV_BYTES = 5 * 1024 * 1024;

function fail(message: string): never {
  redirect(`/onboarding?error=${encodeURIComponent(message)}`);
}

/**
 * Onboarding submit: emails the admin the details + CV, then marks the profile
 * onboarded so the gate moves the user to Waiting. Email goes FIRST — if it
 * fails we don't advance, so a user in Waiting always means the admin has their
 * CV. Profile writes use the service-role client (users have no UPDATE policy),
 * scoped to exactly these non-gated columns for the caller's own id.
 */
export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const roles = formData.getAll("roles").map((v) => String(v).trim()).filter(Boolean);
  const languages = formData.getAll("languages").map((v) => String(v).trim()).filter(Boolean);
  const cv = formData.get("cv");

  if (!fullName) fail("Please enter your name.");
  if (roles.length === 0) fail("Add at least one target role.");
  if (!(cv instanceof File) || cv.size === 0) fail("Please attach your CV as a PDF.");
  if (cv.type !== "application/pdf") fail("Your CV must be a PDF.");
  if (cv.size > MAX_CV_BYTES) fail("Your CV must be under 5 MB.");

  const content = Buffer.from(await cv.arrayBuffer());
  const admin = createAdminClient();

  // 1) Store the canonical copy in the private bucket (service-role only).
  const cvPath = `${user.id}/cv.pdf`;
  const { error: uploadError } = await admin.storage
    .from("cv")
    .upload(cvPath, content, { contentType: "application/pdf", upsert: true });
  if (uploadError) fail("We couldn't save your CV. Please try again.");

  // 2) Email the admin the details + CV attachment (inbox copy / notification).
  try {
    await sendOnboardingEmail({
      userId: user.id,
      fullName,
      email: user.email ?? "",
      roles,
      languages,
      cv: { filename: cv.name || "cv.pdf", content, contentType: "application/pdf" },
    });
  } catch {
    fail("We couldn't send your application right now. Please try again.");
  }

  // 3) Advance the user to Waiting — only now that the CV is stored + emailed.
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      target_roles: roles,
      languages,
      email: user.email,
      cv_path: cvPath,
      cv_uploaded_at: new Date().toISOString(),
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) fail("Your application was sent, but saving your profile failed. Please try again.");

  redirect("/waiting");
}
