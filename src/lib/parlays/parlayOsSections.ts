/**
 * Section → Parlay OS tab mapping.
 *
 * Parlay OS is one page with several doors. `build`, `live_parlays` and
 * `results` were three separate routes; `build` and `live_parlays` rendered the
 * identical shell, and `results` rendered its own copy of ResultsStudio while
 * the workspace's Track Record tab rendered a second one with fewer props. They
 * are now a single destination, and the section only chooses the opening tab.
 *
 * Kept as a pure module rather than a switch inside the router so the mapping
 * has one definition and can be asserted directly.
 */
import type { ParlayCommandPanel } from '../../stores/parlayCommandStore';

/** Every section id that resolves to the Parlay OS workspace. */
export const PARLAY_OS_SECTIONS = ['build', 'live_parlays', 'results'] as const;

export type ParlayOsSection = (typeof PARLAY_OS_SECTIONS)[number];

const SECTION_TO_PANEL: Record<ParlayOsSection, ParlayCommandPanel> = {
  build: 'build',
  // "My List" is the creation/editor entry. Saved parlays remain available
  // inside the workspace without hiding the editor behind the History tab.
  live_parlays: 'build',
  // The former standalone Results route — now the workspace's Track Record tab.
  results: 'vai_ledger',
};

export function isParlayOsSection(section: string): section is ParlayOsSection {
  return (PARLAY_OS_SECTIONS as readonly string[]).includes(section);
}

/**
 * The tab a section should open on. Unknown sections fall back to the slip
 * builder — the workspace's default job.
 */
export function parlayOsPanelForSection(section: string): ParlayCommandPanel {
  return isParlayOsSection(section) ? SECTION_TO_PANEL[section] : 'build';
}
