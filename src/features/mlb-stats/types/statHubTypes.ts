/**
 * statHubTypes — Single source of truth for the MLB Stat Intelligence Hub
 *
 * Judge panel synthesis applied:
 * - Typed engine contract (Judge 4)
 * - Per-stat tier labels via config map (Judge 1)
 * - Confidence + sample-size on every score (Judge 7)
 * - Market edge / implied probability delta (Judge 3)
 * - DFS floor/ceiling secondary outputs (Judge 8)
 * - Lineup confirmation status first-class (Judge 7 & 8)
 */

// ─── Stat types ───────────────────────────────────────────────────────────────

export type StatType =
  | 'hr'
  | 'rbi'
  | 'runs'
  | 'sb'
  | 'hits'
  | 'total_bases'
  | 'doubles'
  | 'pitcher_k';

// ─── Tier system ──────────────────────────────────────────────────────────────

/** Universal tier enum — labels are stat-specific via config */
export type StatTier = 'elite' | 'strong' | 'watch' | 'sleeper' | 'fade';

export interface TierThresholds {
  elite:   number;  // score >= this
  strong:  number;
  watch:   number;
  sleeper: number;
}

export function assignTier(score: number, thresholds: TierThresholds): StatTier {
  if (score >= thresholds.elite)   return 'elite';
  if (score >= thresholds.strong)  return 'strong';
  if (score >= thresholds.watch)   return 'watch';
  if (score >= thresholds.sleeper) return 'sleeper';
  return 'fade';
}

// ─── Weighted factor (driver) ─────────────────────────────────────────────────

export interface WeightedFactor {
  id:     string;
  label:  string;
  value:  number | null;   // 0-100 sub-score, null = data unavailable
  weight: number;          // 0-100 (sum of non-null weights should = 100)
  icon?:  string;
}

// ─── Engine contract (Judge 4: typed engine interface) ────────────────────────

export interface StatScoreOutput {
  score:        number;         // 0-100 composite
  tier:         StatTier;
  confidence:   number;         // 0-100 — drops when key inputs are null/small-sample
  drivers:      WeightedFactor[];
  sampleSize?:  number;         // PA / games used in calculation
  /** v1 heuristic flag — not backtested yet */
  isHeuristic:  boolean;
}

export interface StatScoreEngine<TInput> {
  statType:    StatType;
  thresholds:  TierThresholds;
  compute(input: TInput): StatScoreOutput;
}

// ─── Player row (shared across all stat types) ────────────────────────────────

export type LineupStatus = 'confirmed' | 'projected' | 'questionable' | 'out' | 'unknown';

export interface StatPlayerRow {
  stableId:         string;
  playerName:       string;
  playerId:         string | number | null;
  team:             string;
  opponent:         string;
  pitcherName?:     string | null;
  venue?:           string | null;
  gameTime?:        string | null;
  headshotUrl?:     string | null;
  teamLogoUrl?:     string | null;
  lineupSpot?:      number | null;
  lineupStatus:     LineupStatus;

  // Primary score output
  statScore:        number;         // 0-100
  tier:             StatTier;
  confidence:       number;
  drivers:          WeightedFactor[];
  isHeuristic:      boolean;

  // Season stats (raw, for leaderboard)
  seasonValue:      number | null;  // e.g. 28 HR, .312 AVG, 18 SB
  seasonRank?:      number | null;

  // Market edge (Judge 3: this is the differentiator)
  bookLine?:        number | null;  // Over/under line
  bookOdds?:        number | null;  // American odds
  modelProbability?: number | null; // Model's hit probability 0-1
  impliedProbability?: number | null; // Book's implied probability 0-1
  edgePct?:         number | null;  // modelProbability - impliedProbability

  // DFS secondary outputs (Judge 8)
  dfsProjection?:   number | null;  // projected fantasy points
  dfsFloor?:        number | null;
  dfsCeiling?:      number | null;

  reasons?:         string[];
  warnings?:        string[];
  sourceMode?:      'confirmed' | 'projected' | 'mock';
}

// ─── View / filter state ──────────────────────────────────────────────────────

export type StatViewTab = 'today' | 'leaders' | 'vs_team' | 'spreadsheet';
export type StatViewMode = 'cards' | 'spreadsheet';
export type StatSortField = 'score' | 'season' | 'edge' | 'name';
export type StatSortDir = 'asc' | 'desc';
export type StatScope = 'season' | 'overall';

export interface StatHubFilters {
  statType:   StatType;
  date:       string;          // YYYY-MM-DD
  statScope:  StatScope;       // season = selected season, overall = career
  team?:      string | null;
  search?:    string;
  viewTab:    StatViewTab;
  viewMode:   StatViewMode;
  sortField:  StatSortField;
  sortDir:    StatSortDir;
  tierFilter: StatTier[];
}

// ─── Per-stat config registry (Judge 4: statHubConfig pattern) ───────────────

export interface StatConfig {
  statType:       StatType;
  label:          string;          // "Home Runs"
  shortLabel:     string;          // "HR"
  icon:           string;          // emoji
  description:    string;
  token:          string;          // CSS var token suffix e.g. 've-accent-gold'
  /** Tier display labels — override defaults for this stat */
  tierLabels: {
    elite:   string;
    strong:  string;
    watch:   string;
    sleeper: string;
    fade:    string;
  };
  thresholds: TierThresholds;
  /** Primary driving factor label shown on card */
  primaryDriver:  string;
  /** Phase: 1 = fully built, 2 = beta/scaffolded */
  phase:          1 | 2;
  /** Fields to show in the research drawer */
  drawerFields:   string[];
  /** Column headers for spreadsheet mode */
  spreadsheetCols: Array<{ key: string; label: string; width?: number }>;
}

// ─── Board shape ──────────────────────────────────────────────────────────────

export interface StatBoard {
  elite:   StatPlayerRow[];
  strong:  StatPlayerRow[];
  watch:   StatPlayerRow[];
  sleeper: StatPlayerRow[];
  note?:   string | null;
  counts: {
    elite: number;
    strong: number;
    watch: number;
    sleeper: number;
    total: number;
  };
}
