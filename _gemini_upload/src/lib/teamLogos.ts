/**
 * MLB team logos. Maps team name -> official MLB team id, and builds the logo URL.
 * Logos: https://www.mlbstatic.com/team-logos/{id}.svg (free, no key).
 */

export const TEAM_ID_BY_NAME: Record<string, number> = {
  'Los Angeles Angels': 108,
  'Arizona Diamondbacks': 109,
  'Baltimore Orioles': 110,
  'Boston Red Sox': 111,
  'Chicago Cubs': 112,
  'Cincinnati Reds': 113,
  'Cleveland Guardians': 114,
  'Colorado Rockies': 115,
  'Detroit Tigers': 116,
  'Houston Astros': 117,
  'Kansas City Royals': 118,
  'Los Angeles Dodgers': 119,
  'Washington Nationals': 120,
  'New York Mets': 121,
  'Oakland Athletics': 133,
  'Athletics': 133,
  'Pittsburgh Pirates': 134,
  'San Diego Padres': 135,
  'Seattle Mariners': 136,
  'San Francisco Giants': 137,
  'St. Louis Cardinals': 138,
  'Tampa Bay Rays': 139,
  'Texas Rangers': 140,
  'Toronto Blue Jays': 141,
  'Minnesota Twins': 142,
  'Philadelphia Phillies': 143,
  'Atlanta Braves': 144,
  'Chicago White Sox': 145,
  'Miami Marlins': 146,
  'New York Yankees': 147,
  'Milwaukee Brewers': 158,
};

export function logoByTeamId(teamId?: number | null): string | null {
  if (!teamId) return null;
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

/** Resolve a logo URL from a team name (full name, or a fuzzy contains match). */
export function logoByTeamName(name?: string | null): string | null {
  if (!name) return null;
  const exact = TEAM_ID_BY_NAME[name];
  if (exact) return logoByTeamId(exact);
  const lower = name.toLowerCase();
  for (const [team, id] of Object.entries(TEAM_ID_BY_NAME)) {
    if (lower.includes(team.toLowerCase()) || team.toLowerCase().includes(lower)) {
      return logoByTeamId(id);
    }
  }
  return null;
}

export function teamIdByName(name?: string | null): number | null {
  if (!name) return null;
  if (TEAM_ID_BY_NAME[name]) return TEAM_ID_BY_NAME[name];
  const lower = name.toLowerCase();
  for (const [team, id] of Object.entries(TEAM_ID_BY_NAME)) {
    if (lower.includes(team.toLowerCase()) || team.toLowerCase().includes(lower)) return id;
  }
  return null;
}
