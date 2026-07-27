/** Frontend contract for the premium Live Games matchup data. */

export interface MatchupTeam {
  teamId: number;
  name: string;
  abbreviation: string;
  logo: string;
  record: { wins: number; losses: number } | null;
  seasonWinPct: number;
  probablePitcher: { id: number; name: string; throws: string; vulnerability: number } | null;
}

export interface HrWatch {
  playerId: number;
  playerName: string;
  headshot: string;
  team: string;
  teamAbbr: string;
  hrEdge: number;
  grade: string;
  formTag: string;
  opposingPitcher: string;
  reason: string;
  impliedOdds: string;
}

export interface GameMatchup {
  gamePk: number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  gameTime: string;
  venue: string;
  away: MatchupTeam;
  home: MatchupTeam;
  score: { away: number; home: number };
  winProbability: { home: number; away: number };
  winProbModel: string[];
  runEnvironment: { score: number; tier: string; reasons: string[] } | null;
  topHrWatch: HrWatch[];
  keyFactors: string[];
  whatToWatch: string[];
  aiVerdict: string;
  dataQuality: 'full' | 'partial' | 'limited';
}

export interface MatchupsResponse {
  count: number;
  matchups: GameMatchup[];
  generatedAt: string;
}

export interface LiveScore {
  gamePk: number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  inning: number | null;
  inningState: string | null;
  score: { away: number; home: number };
}
