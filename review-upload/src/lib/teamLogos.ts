/**
 * MLB team logos. Maps team name & abbreviations -> official MLB team id, and builds the logo URL.
 * Logos: https://www.mlbstatic.com/team-logos/{id}.svg (free, no key).
 */

export const TEAM_ID_BY_NAME: Record<string, number> = {
  // Full Names
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

  // Standard MLB Abbreviations & Common Short Codes
  'LAA': 108, 'ANA': 108, 'ANGELS': 108,
  'ARI': 109, 'AZ': 109, 'DIAMONDBACKS': 109, 'D-BACKS': 109,
  'BAL': 110, 'ORIOLES': 110,
  'BOS': 111, 'RED SOX': 111,
  'CHC': 112, 'CUBS': 112,
  'CIN': 113, 'REDS': 113,
  'CLE': 114, 'GUARDIANS': 114, 'INDIANS': 114,
  'COL': 115, 'ROCKIES': 115,
  'DET': 116, 'TIGERS': 116,
  'HOU': 117, 'ASTROS': 117,
  'KC': 118, 'KCR': 118, 'ROYALS': 118,
  'LAD': 119, 'LA': 119, 'DODGERS': 119,
  'WSH': 120, 'WAS': 120, 'NATIONALS': 120, 'NATS': 120,
  'NYM': 121, 'METS': 121,
  'OAK': 133, 'ATH': 133, "A'S": 133,
  'PIT': 134, 'PIRATES': 134,
  'SD': 135, 'SDP': 135, 'PADRES': 135,
  'SEA': 136, 'MARINERS': 136,
  'SF': 137, 'SFG': 137, 'GIANTS': 137,
  'STL': 138, 'CARDINALS': 138,
  'TB': 139, 'TBR': 139, 'RAYS': 139,
  'TEX': 140, 'RANGERS': 140,
  'TOR': 141, 'BLUE JAYS': 141, 'JAYS': 141,
  'MIN': 142, 'TWINS': 142,
  'PHI': 143, 'PH': 143, 'PHILLIES': 143, 'PHILADELPHIA': 143,
  'ATL': 144, 'BRAVES': 144,
  'CWS': 145, 'CHW': 145, 'WHITE SOX': 145,
  'MIA': 146, 'MARLINS': 146,
  'NYY': 147, 'YANKEES': 147,
  'MIL': 158, 'BREWERS': 158,
};

export function logoByTeamId(teamId?: number | null): string | null {
  if (!teamId) return null;
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

/** Resolve a logo URL from a team name or abbreviation (e.g. 'PHI', 'PH', 'LAD', 'Philadelphia Phillies'). */
export function logoByTeamName(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  const exact = TEAM_ID_BY_NAME[trimmed] || TEAM_ID_BY_NAME[trimmed.toUpperCase()];
  if (exact) return logoByTeamId(exact);

  const lower = trimmed.toLowerCase();
  for (const [team, id] of Object.entries(TEAM_ID_BY_NAME)) {
    if (team.toLowerCase() === lower) {
      return logoByTeamId(id);
    }
  }

  // Fallback fuzzy match (minimum 3 chars to prevent false short code matches)
  if (lower.length >= 3) {
    for (const [team, id] of Object.entries(TEAM_ID_BY_NAME)) {
      if (team.length >= 4 && (lower.includes(team.toLowerCase()) || team.toLowerCase().includes(lower))) {
        return logoByTeamId(id);
      }
    }
  }
  return null;
}

export function teamIdByName(name?: string | null): number | null {
  if (!name) return null;
  const trimmed = name.trim();
  const exact = TEAM_ID_BY_NAME[trimmed] || TEAM_ID_BY_NAME[trimmed.toUpperCase()];
  if (exact) return exact;

  const lower = trimmed.toLowerCase();
  for (const [team, id] of Object.entries(TEAM_ID_BY_NAME)) {
    if (team.toLowerCase() === lower) return id;
  }

  if (lower.length >= 3) {
    for (const [team, id] of Object.entries(TEAM_ID_BY_NAME)) {
      if (team.length >= 4 && (lower.includes(team.toLowerCase()) || team.toLowerCase().includes(lower))) return id;
    }
  }
  return null;
}
