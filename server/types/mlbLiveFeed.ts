/** Minimal MLB Stats API live game feed shape used by liveGameHub + liveAtBatService. */
export interface MlbLiveFeedLinescore extends Record<string, unknown> {
  teams?: {
    home?: { runs?: number | string };
    away?: { runs?: number | string };
  };
  currentInning?: number | string;
  inningHalf?: string;
  outs?: number | string;
  offense?: Record<string, unknown>;
}

export interface MlbLiveFeedPlays extends Record<string, unknown> {
  allPlays?: unknown[];
  currentPlay?: unknown;
}

export interface MlbLiveFeed {
  liveData?: {
    linescore?: MlbLiveFeedLinescore;
    plays?: MlbLiveFeedPlays;
    boxscore?: unknown;
  };
  gameData?: {
    status?: {
      detailedState?: string;
    };
    teams?: {
      away?: { id?: number | string; abbreviation?: string };
      home?: { id?: number | string; abbreviation?: string };
    };
  };
}
