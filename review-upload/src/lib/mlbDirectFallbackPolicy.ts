/** Direct MLB Stats API fallback is dev-only unless explicitly enabled. */
export function isMlbDirectFallbackAllowed(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_MLB_DIRECT_FALLBACK === "true";
}
