/** Pause React Query polling while the tab is hidden. */
export function visibilityAwareInterval(ms: number | false | undefined): number | false {
  if (ms === false || ms == null) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
  return ms;
}
