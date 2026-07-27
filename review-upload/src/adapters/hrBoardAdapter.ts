export type NormalizedHrPlayer = {
  playerId: string;
  gamePk: string;
  playerName: string;
  team: string;
  opponent: string;
  venue: string;
  opponentPitcherName: string;
  hrEdge: number;
  pitcherVulnerability: number;
  hitterPower: number;
  parkFactor: number;
  recentForm: number;
  finalScore: number;
  dataConfidence: number;
  riskLabel: string;
  lineupStatus: string;
};

function numberOrZero(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function textOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function normalizeHrPlayer(raw: any): NormalizedHrPlayer {
  const breakdown = raw?.scoreBreakdown ?? {};

  return {
    playerId: String(raw?.playerId ?? raw?.id ?? ''),
    gamePk: String(raw?.gamePk ?? raw?.game_id ?? ''),
    playerName: textOrFallback(raw?.playerName ?? raw?.name, 'Unknown Player'),
    team: textOrFallback(raw?.team, 'TBD'),
    opponent: textOrFallback(raw?.opponent, 'TBD'),
    venue: textOrFallback(raw?.venue, 'Unknown venue'),
    opponentPitcherName: textOrFallback(raw?.opponentPitcherName ?? raw?.opposingPitcher, 'TBD'),
    hrEdge: numberOrZero(raw?.hrScore ?? raw?.hrEdge),
    pitcherVulnerability: numberOrZero(breakdown?.pitcherVulnerability ?? raw?.pitcherVulnerability),
    hitterPower: numberOrZero(breakdown?.hitterPower ?? raw?.hitterPower),
    parkFactor: numberOrZero(breakdown?.parkFactor ?? raw?.parkFactor),
    recentForm: numberOrZero(breakdown?.recentForm ?? raw?.recentFormScore),
    finalScore: numberOrZero(breakdown?.finalScore ?? raw?.hrScore ?? raw?.hrEdge),
    dataConfidence: numberOrZero(raw?.dataConfidence),
    riskLabel: textOrFallback(raw?.riskTier ?? raw?.riskLabel, 'Review'),
    lineupStatus: textOrFallback(raw?.lineupStatus ?? raw?.status, 'unknown'),
  };
}

export function normalizeHrPlayers(rows: any[] | null | undefined): NormalizedHrPlayer[] {
  return Array.isArray(rows) ? rows.map(normalizeHrPlayer) : [];
}
