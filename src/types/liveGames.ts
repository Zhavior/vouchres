/** Shared live games board contract (mirrors server LiveGameCard). */

export interface LiveGameCard {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string | null;
  awayAbbr: string | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  venue: string | null;
  gameDate: string | null;
  isLive?: boolean;
  isFinal?: boolean;
  inning: number | null;
  halfInning: string | null;
  outs: number | null;
  liveStateLabel: string | null;
  feedAsOf: string | null;
  predictionsAvailable?: boolean;
}

export interface LiveGamesPayload {
  success: boolean;
  date: string;
  games: LiveGameCard[];
  liveCount?: number;
  warnings: string[];
  updatedAt: string;
}

export function liveGameDisplayStatus(game: LiveGameCard): string {
  if (game.liveStateLabel && (game.isLive || game.isFinal)) {
    return game.liveStateLabel;
  }
  return game.status;
}

export function liveGameSortKey(game: LiveGameCard): string {
  const live = game.isLive ? "0" : game.isFinal ? "2" : "1";
  const time = game.gameDate ? Date.parse(game.gameDate) : Number.MAX_SAFE_INTEGER;
  return `${live}-${String(time).padStart(14, "0")}-${game.id}`;
}

export function sortLiveGameCards(games: readonly LiveGameCard[]): LiveGameCard[] {
  return [...games].sort((a, b) => liveGameSortKey(a).localeCompare(liveGameSortKey(b)));
}
