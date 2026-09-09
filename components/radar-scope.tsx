/**
 * Animated radar scope — concentric rings, a rotating sweep (CSS .radar-sweep)
 * and pulsing contact blips. Pure SVG + CSS, safe in a Server Component.
 * Used by the waiting room and the dashboard's empty ("still scanning") state.
 */
export function RadarScope({ className = "size-44" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      className={`${className} flex-none`}
      fill="none"
      role="img"
      aria-label="Radar scanning"
    >
      <defs>
        <linearGradient id="sweepFade" x1="300" y1="300" x2="300" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="300" cy="300" r="270" stroke="var(--brand)" strokeWidth="1.5" opacity="0.35" />
      <circle cx="300" cy="300" r="195" stroke="var(--brand)" strokeWidth="1.5" opacity="0.3" />
      <circle cx="300" cy="300" r="120" stroke="var(--brand)" strokeWidth="1.5" opacity="0.25" />
      <circle cx="300" cy="300" r="45" stroke="var(--brand)" strokeWidth="1.5" opacity="0.2" />
      <line x1="30" y1="300" x2="570" y2="300" stroke="var(--brand)" strokeWidth="1" opacity="0.16" />
      <line x1="300" y1="30" x2="300" y2="570" stroke="var(--brand)" strokeWidth="1" opacity="0.16" />

      <g className="radar-sweep">
        <path d="M300 300 L300 30 A270 270 0 0 1 505 130 Z" fill="url(#sweepFade)" />
        <line x1="300" y1="300" x2="300" y2="30" stroke="var(--brand)" strokeWidth="2" opacity="0.55" />
      </g>

      <circle className="radar-blip" cx="418" cy="205" r="6" fill="var(--accent)" />
      <circle className="radar-blip radar-blip-2" cx="210" cy="392" r="5" fill="var(--brand-2)" />
      <circle cx="300" cy="300" r="6" fill="var(--brand)" />
    </svg>
  );
}
