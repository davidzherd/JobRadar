"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Sign in with email + password, then let the gate route to the right stage. */
export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard"); // gate bounces onward if this user isn't approved yet
}

/**
 * Registration is open, but access isn't: a new account creates a profile row
 * (via the DB trigger, migration 0003) that stays pre-active until an admin
 * writes its `search_prefs`. So signup ≠ access — the approval gate is the real
 * control, which is why there's no invite code here.
 */
export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // With email confirmation enabled in Supabase there is no session yet —
  // the user must click the link in their inbox first.
  if (!data.session) {
    redirect("/register?pending=1");
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
