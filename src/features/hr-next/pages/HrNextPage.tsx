import { lazy, Suspense } from 'react';
import { HrNextShell } from '../components/HrNextShell';

/*
 * HR Lab runs beside the shipped board rather than replacing it: `?lab=1` on
 * the same route swaps the presentation layer only. Both shells consume the
 * identical hooks, stores and contracts, so state written in one is visible in
 * the other. No routing, section or auth change is involved, and dropping the
 * flag restores the approved surface exactly.
 */
const HrLabShell = lazy(() =>
  import('../../hr-lab/components/HrLabShell').then((m) => ({ default: m.HrLabShell })),
);

function useLabMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('lab') === '1';
}

export function HrNextPage() {
  return (
    // `overflow-x-clip` rather than `overflow-hidden`: hidden makes this element
    // a scrollport, and because the real scrolling happens further up the tree
    // (`.ve-scroll-pane`), that scrollport never scrolls — which silently kills
    // `position: sticky` for everything inside, the toolbar and the research
    // dock included. `clip` stops the same horizontal bleed without creating a
    // scroll container, so sticky resolves against the pane that actually moves.
    // Translucent obsidian, not solid: this is the app's only full-page opaque
    // shell, and it was painting over the fixed ambient 3D field that every
    // other route shows. At 75% the field reads behind the board while the
    // dense telemetry type keeps its contrast. No backdrop-blur — this surface
    // scrolls hundreds of cards, and a full-bleed backdrop-filter re-composites
    // all of them per frame (same reason the sticky toolbar refuses one).
    <main className="ve-page-shell flex h-full w-full flex-col overflow-x-clip bg-ve-obsidian/75">
      {useLabMode() ? (
        <Suspense fallback={null}>
          <HrLabShell />
        </Suspense>
      ) : (
        <HrNextShell />
      )}
    </main>
  );
}

export default HrNextPage;
