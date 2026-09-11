/**
 * The mesh-gradient ground for the signed-in app pages, so their translucent
 * cards read as frosted glass (matching the auth screens). Fixed to the
 * viewport and behind everything (-z-10) so it stays put while content scrolls.
 * Theme-aware via the .auth-bg rules in globals.css.
 */
export function AppBackground() {
  return <div className="auth-bg fixed inset-0 -z-10" aria-hidden="true" />;
}
