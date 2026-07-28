/** Frontend contract for /api/mlb/live-at-bat/:gamePk (mirrors server liveAtBatService). */

export interface LiveAtBatPitch {
  number: number;
  result: string;
  isInPlay: boolean;
  isStrike: boolean;
  isBall: boolean;
  pitchType: string | null;
  velo: number | null;
  px: number | null;
  pz: number | null;
  szTop: number | null;
  szBot: number | null;
}

export interface LiveAtBatHit {
  ev: number | null;
  la: number | null;
  distance: number | null;
  coordX: number | null;
  coordY: number | null;
}

/** Runner on base from MLB linescore.offense (first/second/third). */
export interface LiveAtBatRunner {
  id: number | null;
  name: string;
  initials: string;
}

export interface LiveAtBatSnapshot {
  gamePk: number;
  status: string;
  inning: number | null;
  halfInning: string | null;
  outs: number | null;
  /** Balls/strikes from linescore.offense or last pitch count. */
  count: { balls: number | null; strikes: number | null };
  /** Occupied bases from linescore.offense.first/second/third — null when empty. */
  runners: { first: LiveAtBatRunner | null; second: LiveAtBatRunner | null; third: LiveAtBatRunner | null };
  away: { teamId: number | null; abbr: string; runs: number | null };
  home: { teamId: number | null; abbr: string; runs: number | null };
  winProb: { homePct: number; awayPct: number; lastSwingHomePct: number } | null;
  play: {
    description: string | null;
    isComplete: boolean;
    batter: { id: number | null; name: string; headshot: string | null; gameLine: string | null };
    pitcher: { id: number | null; name: string; gameLine: string | null };
    pitches: LiveAtBatPitch[];
    hit: LiveAtBatHit | null;
  } | null;
  updatedAt: string;
}
