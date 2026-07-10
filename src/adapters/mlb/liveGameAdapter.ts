export type PitcherLiveStats = {
  name: string;
  team?: string;
  inningsPitched: string;
  strikeouts: number;
  walks: number;
  hitsAllowed: number;
  pitchesThrown: number;
};

export type PlayerImpact = {
  playerId: string;
  name: string;
  event: "RBI" | "HR" | "SB" | "HIT" | "RUN";
  value: number;
  timestamp: number;
};

export type LiveGameModel = {
  gameId: string;
  status: string;
  inning?: string;
  homeScore: number;
  awayScore: number;
  pitcher?: PitcherLiveStats;
  impacts: PlayerImpact[];
};

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeLiveGame(game: any): LiveGameModel {
  return {
    gameId: String(game.gamePk ?? game.id ?? ""),
    status: String(game.status ?? "Unknown"),

    inning: game.linescore?.currentInning,

    homeScore: safeNumber(
      game.linescore?.teams?.home?.runs ??
      game.homeScore
    ),

    awayScore: safeNumber(
      game.linescore?.teams?.away?.runs ??
      game.awayScore
    ),

    pitcher: undefined,

    impacts: [],
  };
}
