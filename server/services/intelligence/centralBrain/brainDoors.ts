/**
 * Named MLB Stats API "doors" Brain reads through.
 * UI may display these; they are documentation of provenance, not fake coverage.
 */
export const BRAIN_MLB_DOORS = Object.freeze({
  schedule: {
    key: "schedule",
    label: "Schedule",
    source: "MLB Stats API schedule",
  },
  rosters: {
    key: "rosters",
    label: "Active rosters",
    source: "MLB Stats API active rosters",
  },
  lineups: {
    key: "lineups",
    label: "Lineups / boxscore",
    source: "MLB Stats API boxscore",
  },
  probable_pitchers: {
    key: "probable_pitchers",
    label: "Probable pitchers",
    source: "MLB Stats API probable pitchers",
  },
  season_pitching: {
    key: "season_pitching",
    label: "Season pitching",
    source: "MLB Stats API people stats (pitching)",
  },
  recent_pitching: {
    key: "recent_pitching",
    label: "Recent starts",
    source: "MLB Stats API gameLog pitching",
  },
  performance: {
    key: "performance",
    label: "Hitter performance",
    source: "MLB Stats API + VouchEdge HR feature engine",
  },
} as const);

export type BrainMlbDoorKey = keyof typeof BRAIN_MLB_DOORS;
