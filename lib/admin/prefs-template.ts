/**
 * A starter `search_prefs` object for the admin to edit when approving someone.
 * Its shape is one radar `profile.json` user block minus `email` (plan §4a):
 * the radar reconstructs the recipient by merging this with the profile's email.
 *
 * Seeded from the applicant's stated roles so the admin tunes an outline rather
 * than typing from a blank page. The concrete skill/title weights and provider
 * category ids still need a human — that's the whole point of the review.
 */
export function skeletonPrefs(roles: string[]): string {
  const cleaned = roles.map((r) => r.trim()).filter(Boolean);
  const queries = cleaned.length ? cleaned : ["Job title"];
  const titleIncludes = (cleaned.length ? cleaned : ["title"]).map((r) => ({
    term: r.toLowerCase(),
    weight: 12,
  }));

  const prefs = {
    tracks: [
      {
        id: "primary",
        label: "Primary discipline",
        yearsOfExperience: 3,
        minScorePercent: 55,
        queries,
        skills: [{ term: "edit-me", weight: 8 }],
        titleIncludes,
        titleExcludes: [],
        // AllJobs uses numeric category ids — see WorkAutomation
        // docs/alljobs-categories.md. Fill in the right leaf(s).
        providerQueries: { alljobs: [] as string[] },
      },
    ],
    titleExcludes: [] as string[],
    contentExcludes: [] as string[],
    locations: ["tel aviv", "תל אביב", "herzliya", "ramat gan"],
    remoteOk: true,
    providerQueries: { greenhouse: [] as string[] },
    maxResultsPerEmail: 50,
  };

  return JSON.stringify(prefs, null, 2);
}

/** Minimal structural guard so an approval never opens the gate with garbage. */
export function validatePrefs(raw: string): { prefs: Record<string, unknown> } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "search_prefs isn't valid JSON." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: "search_prefs must be a JSON object." };
  }
  const tracks = (parsed as { tracks?: unknown }).tracks;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return { error: "search_prefs needs a non-empty tracks array." };
  }
  return { prefs: parsed as Record<string, unknown> };
}
