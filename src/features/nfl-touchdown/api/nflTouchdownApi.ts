import { apiClient } from '../../../lib/apiClient';

export interface NflTeamIntelligence {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  logo: string;
  score: string;
  isHome: boolean;
  winner: boolean;
}

export interface NflLeader {
  category: string; // passing, rushing, receiving
  athleteName: string;
  athleteHeadshot: string;
  athleteId: string;
  displayValue: string; // e.g. "300 YDS, 3 TD"
  teamId: string;
}

export interface NflMatchupIntelligence {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: string;
  period: number;
  clock: string;
  homeTeam: NflTeamIntelligence;
  awayTeam: NflTeamIntelligence;
  leaders: NflLeader[];
}

export interface NflTouchdownIntelligenceResponse {
  ok: boolean;
  date: string;
  games: NflMatchupIntelligence[];
  meta?: any;
}

export async function fetchNflTouchdownIntelligence(): Promise<NflMatchupIntelligence[]> {
  const res = await apiClient.get<NflTouchdownIntelligenceResponse>('/api/nfl/touchdown-intelligence/today');
  return res.games || [];
}
