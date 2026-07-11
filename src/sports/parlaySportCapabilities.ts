/**
 * Parlay readiness matrix per sport — drives honest UI copy and guards
 * against enabling a sport before its parlay stack is wired.
 */
import type { SportId } from "./registry";

export type ParlaySportCapability = {
  /** Can save slips with this sport on legs */
  save: boolean;
  /** POST /api/parlays/grade preview */
  gradePreview: boolean;
  /** Live stat tracking on open legs */
  liveProgress: boolean;
  /** ParlayOS market picker families */
  marketCatalog: boolean;
  /** Production cron grading for saved slips */
  productionGrading: boolean;
  /** AI scheduled parlay generation */
  aiGenerate: boolean;
};

export const PARLAY_SPORT_CAPABILITIES: Record<SportId, ParlaySportCapability> = {
  mlb: {
    save: true,
    gradePreview: true,
    liveProgress: true,
    marketCatalog: true,
    productionGrading: true,
    aiGenerate: true,
  },
  nba: {
    save: true,
    gradePreview: true,
    liveProgress: false,
    marketCatalog: false,
    productionGrading: false,
    aiGenerate: false,
  },
  nfl: {
    save: true,
    gradePreview: true,
    liveProgress: false,
    marketCatalog: false,
    productionGrading: false,
    aiGenerate: false,
  },
};

export function getParlaySportCapabilities(sport: SportId): ParlaySportCapability {
  return PARLAY_SPORT_CAPABILITIES[sport];
}

/** True when every user-facing parlay surface is ready for the sport. */
export function isParlaySportFullyReady(sport: SportId): boolean {
  const cap = PARLAY_SPORT_CAPABILITIES[sport];
  return cap.save
    && cap.gradePreview
    && cap.liveProgress
    && cap.marketCatalog
    && cap.productionGrading
    && cap.aiGenerate;
}
