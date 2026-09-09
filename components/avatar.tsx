/**
 * A simple identity avatar: a colored circle with the user's initials. The
 * color is derived deterministically from a seed (the user id, so it stays the
 * same for a given person across renders/pages) — "random"-looking but stable.
 * Server-safe. Reused on the admin cards/detail and the statistics page.
 */

/** First initial of the first and last name; falls back gracefully. */
function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stable hue in [0,360) from a string seed. */
function hueFrom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({
  name,
  seed,
  size = 36,
  className = "",
}: {
  name: string | null;
  seed?: string | null;
  size?: number;
  className?: string;
}) {
  const hue = hueFrom((seed || name || "?").trim());
  return (
    <span
      className={`inline-grid flex-none select-none place-items-center rounded-full font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        // mid lightness + white text reads well in both light and dark themes
        background: `hsl(${hue} 58% 45%)`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
