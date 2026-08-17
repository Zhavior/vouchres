/**
 * Official line score feed — MLB StatsAPI `linescore`, verbatim.
 *
 * One request hydrates the whole slate, so every card and drawer in Live Next
 * reads the same cached payload and switching games costs zero requests.
 *
 * Nothing in this module estimates. A half-inning the feed did not publish
 * stays `null` and renders as a dash — that is how a real line score shows a
 * bottom half that was never played.
 */

const STATS_API = 'https://statsapi.mlb.com/api';

export interface LineScoreInning {
  num: number;
  ordinal: string;
  /** Runs in the half-inning, null when the feed carries no entry for it. */
  away: number | null;
  home: number | null;
}

export interface LineScoreTotals {
  runs: number | null;
  hits: number | null;
  errors: number | null;
  leftOnBase: number | null;
}

export interface OfficialLineScore {
  gamePk: number;
  innings: LineScoreInning[];
  /** Regulation length for this game — 9 for MLB, 7 for scheduled doubleheaders. */
  scheduledInnings: number;
  currentInning: number | null;
  currentInningOrdinal: string | null;
  /** 'Top' | 'Middle' | 'Bottom' | 'End' as published. */
  inningState: string | null;
  isTopInning: boolean | null;
  outs: number | null;
  balls: number | null;
  strikes: number | null;
  away: LineScoreTotals;
  home: LineScoreTotals;
  /** Published game state used for the header badge. */
  stateLabel: string;
  isLive: boolean;
  isFinal: boolean;
}

export type SlateLineScores = Record<number, OfficialLineScore>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function numOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function totalsFrom(value: unknown): LineScoreTotals {
  const record = asRecord(value);
  return {
    runs: numOrNull(record.runs),
    hits: numOrNull(record.hits),
    errors: numOrNull(record.errors),
    leftOnBase: numOrNull(record.leftOnBase),
  };
}

function stateLabelFor(
  detailedState: string,
  abstractState: string,
  linescore: Record<string, unknown>,
): { label: string; isLive: boolean; isFinal: boolean } {
  const isFinal = /final|game over|completed/i.test(abstractState) || /final|game over|completed/i.test(detailedState);
  const isLive = !isFinal && /in progress|live|manager challenge|warmup/i.test(`${abstractState} ${detailedState}`);

  if (isFinal) {
    const played = numOrNull(linescore.currentInning);
    const scheduled = numOrNull(linescore.scheduledInnings) ?? 9;
    const label = played != null && played !== scheduled ? `Final · ${played} Inn` : 'Final';
    return { label, isFinal: true, isLive: false };
  }

  if (isLive) {
    const state = textOrNull(linescore.inningState);
    const ordinal = textOrNull(linescore.currentInningOrdinal);
    return {
      label: state && ordinal ? `${state} ${ordinal}` : detailedState || 'In Progress',
      isFinal: false,
      isLive: true,
    };
  }

  return { label: detailedState || 'Scheduled', isFinal: false, isLive: false };
}

export function parseLineScore(
  gamePk: number,
  linescoreRaw: unknown,
  detailedState: string,
  abstractState: string,
): OfficialLineScore | null {
  const linescore = asRecord(linescoreRaw);
  if (Object.keys(linescore).length === 0) return null;

  const rawInnings = Array.isArray(linescore.innings) ? linescore.innings : [];
  const innings: LineScoreInning[] = rawInnings.map((entry, index) => {
    const inning = asRecord(entry);
    const num = numOrNull(inning.num) ?? index + 1;
    return {
      num,
      ordinal: textOrNull(inning.ordinalNum) ?? String(num),
      // `away`/`home` are absent for a half-inning that was never played —
      // a walk-off bottom half, or any inning still ahead of the game.
      away: inning.away === undefined ? null : numOrNull(asRecord(inning.away).runs),
      home: inning.home === undefined ? null : numOrNull(asRecord(inning.home).runs),
    };
  });

  const teams = asRecord(linescore.teams);
  const state = stateLabelFor(detailedState, abstractState, linescore);

  return {
    gamePk,
    innings,
    scheduledInnings: numOrNull(linescore.scheduledInnings) ?? 9,
    currentInning: numOrNull(linescore.currentInning),
    currentInningOrdinal: textOrNull(linescore.currentInningOrdinal),
    inningState: textOrNull(linescore.inningState),
    isTopInning: typeof linescore.isTopInning === 'boolean' ? linescore.isTopInning : null,
    outs: numOrNull(linescore.outs),
    balls: numOrNull(linescore.balls),
    strikes: numOrNull(linescore.strikes),
    away: totalsFrom(teams.away),
    home: totalsFrom(teams.home),
    stateLabel: state.label,
    isLive: state.isLive,
    isFinal: state.isFinal,
  };
}

/**
 * Fetch every line score on the slate in a single request.
 * Games the feed has not opened a line score for are simply absent from the
 * map — callers render an explicit "unavailable" state rather than zeros.
 */
export async function fetchSlateLineScores(date: string, signal?: AbortSignal): Promise<SlateLineScores> {
  const url = `${STATS_API}/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=linescore`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`MLB linescore feed ${res.status}`);

  const payload = asRecord(await res.json());
  const dates = Array.isArray(payload.dates) ? payload.dates : [];
  const out: SlateLineScores = {};

  for (const dateEntry of dates) {
    const games = asRecord(dateEntry).games;
    if (!Array.isArray(games)) continue;
    for (const gameEntry of games) {
      const game = asRecord(gameEntry);
      const gamePk = numOrNull(game.gamePk);
      if (gamePk == null) continue;
      const status = asRecord(game.status);
      const parsed = parseLineScore(
        gamePk,
        game.linescore,
        textOrNull(status.detailedState) ?? '',
        textOrNull(status.abstractGameState) ?? '',
      );
      if (parsed) out[gamePk] = parsed;
    }
  }

  return out;
}
