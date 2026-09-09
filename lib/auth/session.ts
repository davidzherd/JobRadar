import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** The four mutually-exclusive stages a logged-in user can be in (plan §6). */
export type Stage = "onboarding" | "waiting" | "rejected" | "app";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  target_roles: string[];
  languages: string[];
  onboarded_at: string | null;
  search_prefs: unknown | null;
  rejected: boolean;
  rejection_reason: string | null;
  is_admin: boolean;
}

const ROUTE: Record<Stage, string> = {
  onboarding: "/onboarding",
  waiting: "/waiting",
  rejected: "/rejected",
  app: "/dashboard",
};

/** Routing precedence from plan §6: rejected → approved → waiting → onboarding. */
export function stageFor(p: Pick<Profile, "onboarded_at" | "search_prefs" | "rejected">): Stage {
  if (p.rejected) return "rejected";
  if (p.search_prefs) return "app";
  if (p.onboarded_at) return "waiting";
  return "onboarding";
}

/**
 * Guard a page to a single stage. Loads the current user + profile, computes
 * where they belong, and redirects if this isn't it — so every page can assume
 * it's only ever rendered for a user in the right stage. Returns the profile
 * for convenience.
 */
export async function requireStage(expected: Stage): Promise<{ userId: string; profile: Profile }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, target_roles, languages, onboarded_at, search_prefs, rejected, rejection_reason, is_admin",
    )
    .eq("id", user.id)
    .single<Profile>();

  // Row not created yet (rare trigger lag right after signup) → onboarding.
  if (!profile) {
    if (expected !== "onboarding") redirect(ROUTE.onboarding);
    return {
      userId: user.id,
      profile: {
        id: user.id,
        full_name: null,
        email: user.email ?? null,
        target_roles: [],
        languages: [],
        onboarded_at: null,
        search_prefs: null,
        rejected: false,
        rejection_reason: null,
        is_admin: false,
      },
    };
  }

  // Admins bypass the onboarding/waiting/rejected gate — they always get app
  // access (and can additionally reach admin-only pages via requireAdmin).
  const stage = profile.is_admin ? "app" : stageFor(profile);
  if (stage !== expected) redirect(ROUTE[stage]);

  return { userId: user.id, profile };
}

/**
 * Guard an admin-only page. Redirects non-admins away (approved users to the
 * dashboard, everyone else to their stage / login). Returns the admin profile.
 */
export async function requireAdmin(): Promise<{ userId: string; profile: Profile }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, target_roles, languages, onboarded_at, search_prefs, rejected, rejection_reason, is_admin",
    )
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || !profile.is_admin) redirect("/dashboard");

  return { userId: user.id, profile };
}
