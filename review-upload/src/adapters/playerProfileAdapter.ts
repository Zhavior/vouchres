import type { NormalizedHrPlayer } from './hrBoardAdapter';

export type PlayerProfileModel = {
  playerId: string;
  title: string;
  matchupLine: string;
  pitcherLine: string;
  venueLine: string;
  scoreLine: string;
  statusLine: string;
};

export function buildPlayerProfile(row: NormalizedHrPlayer): PlayerProfileModel {
  return {
    playerId: row.playerId,
    title: row.playerName,
    matchupLine: `${row.team} vs ${row.opponent}`,
    pitcherLine: `Vs ${row.opponentPitcherName}`,
    venueLine: row.venue,
    scoreLine: `HR Edge ${Math.round(row.hrEdge)} · P.VULN ${Math.round(row.pitcherVulnerability)} · Final ${Math.round(row.finalScore)}`,
    statusLine: `${row.lineupStatus} · Confidence ${Math.round(row.dataConfidence)}% · ${row.riskLabel}`,
  };
}
