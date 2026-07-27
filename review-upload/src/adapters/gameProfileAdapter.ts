import type { NormalizedHrPlayer } from './hrBoardAdapter';

export type GameProfileModel = {
  gameKey: string;
  matchup: string;
  teams: string;
  venue: string;
  topHrThreats: NormalizedHrPlayer[];
  hrThreatCount: number;
  topHrEdge: number;
  topPitcherVulnerability: number;
};

export function buildGameProfile(rows: NormalizedHrPlayer[]): GameProfileModel {
  const first = rows[0];

  return {
    gameKey: first?.gamePk || 'unknown-game',
    matchup: first ? `${first.team} vs ${first.opponent}` : 'Game TBD',
    teams: first ? `${first.team} / ${first.opponent}` : 'Teams TBD',
    venue: first?.venue || 'Unknown venue',
    topHrThreats: rows.slice(0, 6),
    hrThreatCount: rows.length,
    topHrEdge: Math.round(first?.hrEdge ?? 0),
    topPitcherVulnerability: Math.round(first?.pitcherVulnerability ?? 0),
  };
}
