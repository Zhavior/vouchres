/**
 * Sport registry — the single source of truth for which sports exist and
 * how to reach their data. Adding NBA/NFL later = flip `enabled` to true and
 * implement the matching API routes. The UI reads from here, never hardcodes.
 */

export type SportId = 'mlb' | 'nba' | 'nfl';

export interface SportConfig {
  id: SportId;
  label: string;
  emoji: string;
  /** Live now? NBA/NFL ship disabled ("coming soon") until their providers exist. */
  enabled: boolean;
  /** Daily edge/props board endpoint for this sport. */
  boardEndpoint: string;
  /** Daily lineups/roster endpoint for this sport. */
  lineupEndpoint: string;
  /** Human label for the primary edge metric (drives sport-specific copy). */
  primaryMetric: string;
}

export const SPORTS: Record<SportId, SportConfig> = {
  mlb: {
    id: 'mlb',
    label: 'MLB',
    emoji: '⚾',
    enabled: true,
    boardEndpoint: '/api/mlb/hr-board/today',
    lineupEndpoint: '/api/mlb/lineup/today',
    primaryMetric: 'HR Edge',
  },
  nba: {
    id: 'nba',
    label: 'NBA',
    emoji: '🏀',
    enabled: false,
    boardEndpoint: '/api/nba/edge-board/today',
    lineupEndpoint: '/api/nba/lineup/today',
    primaryMetric: 'Pts Edge',
  },
  nfl: {
    id: 'nfl',
    label: 'NFL',
    emoji: '🏈',
    enabled: false,
    boardEndpoint: '/api/nfl/edge-board/today',
    lineupEndpoint: '/api/nfl/lineup/today',
    primaryMetric: 'Yds Edge',
  },
};

export const SPORT_LIST: SportConfig[] = Object.values(SPORTS);

const STORAGE_KEY = 'vouchedge_active_sport';
const SPORT_CHANGE_EVENT = 'vouchedge:sportchange';

/** Current active sport. Falls back to MLB if stored value is missing/disabled. */
export function getActiveSport(): SportId {
  if (typeof window === 'undefined') return 'mlb';
  const stored = localStorage.getItem(STORAGE_KEY) as SportId | null;
  if (stored && SPORTS[stored]?.enabled) return stored;
  return 'mlb';
}

export function getActiveSportConfig(): SportConfig {
  return SPORTS[getActiveSport()];
}

/** Set the active sport (only if enabled) and broadcast a change event. */
export function setActiveSport(id: SportId): void {
  if (typeof window === 'undefined') return;
  if (!SPORTS[id]?.enabled) return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(SPORT_CHANGE_EVENT, { detail: id }));
}

/** Subscribe to active-sport changes. Returns an unsubscribe fn. */
export function onSportChange(handler: (id: SportId) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail as SportId);
  window.addEventListener(SPORT_CHANGE_EVENT, listener);
  return () => window.removeEventListener(SPORT_CHANGE_EVENT, listener);
}
