/**
 * Live telemetry for the public V4 landing.
 *
 * The landing advertises itself as `LIVE MODEL // MLB HR INTELLIGENCE` but
 * every number under that banner was a hardcoded literal — Elite_Candidates
 * read 14 while the board was returning 27. Both endpoints below already
 * answer unauthenticated, so no new backend surface was needed.
 *
 * Nothing here falls back to an invented number. Every figure is something an
 * endpoint returned; a landing whose whole claim is "we record what the model
 * actually knew" cannot print a figure the model did not produce.
 *
 * What it does do is degrade through real sources rather than to dashes. The
 * board publishes three populations, and off-slate the first one is empty while
 * the others are full:
 *
 *   live    — `candidates`, batters with an official lineup behind them
 *   preview — `allProjectedCandidates`, scored but lineup-unconfirmed (the
 *             normal state for most of the day, and what used to render as
 *             `0/180 LINEUPS_SYNCED` and a row of dashes)
 *   replay  — the most recent past date whose board still answers
 *
 * `mode` tells the UI which population it is looking at so it can badge the
 * panel honestly instead of implying that projected rows are confirmed ones.
 */
import { useEffect, useState } from 'react';

export interface LandingCandidate {
  playerId: number;
  playerName: string;
  teamAbbrev: string;
  opponent: string;
  venue: string | null;
  hrScore: number | null;
  confidenceTier: string | null;
  dataConfidence: number | null;
  barrelRate: number | null;
  avgExitVelo: number | null;
  /** Park HR factor from the sourced table (100 = neutral). */
  parkFactor: number | null;
  opposingPitcher: string | null;
}

/** One evidence layer, with the count and provenance the API actually returned. */
export interface CoverageLayer {
  id: string;
  label: string;
  description: string;
  /**
   * What the layer buys the person reading, in their words rather than ours.
   * The telemetry label above it is the product's own vocabulary and stays.
   */
  outcome: string;
  /** Null until the feed answers — never a placeholder figure. */
  count: number | null;
  unit: string;
  source: string | null;
}

/** First-pitch conditions for one venue, exactly as the forecast feed reported. */
export interface VenueWeather {
  venue: string;
  tempF: number | null;
  windMph: number | null;
  windCompass: string | null;
  precipChancePct: number | null;
  available: boolean;
}

/**
 * Which population the numbers on screen came from.
 *
 * `offline` is the only state that still admits to having nothing, and it is
 * reached only when neither today's board nor any of the previous seven days
 * answered at all.
 */
export type TelemetryMode = 'live' | 'preview' | 'replay' | 'offline';

export interface LandingTelemetry {
  mode: TelemetryMode;
  /** Slate the visible numbers belong to (YYYY-MM-DD), for replay attribution. */
  slateDate: string | null;
  /** Earliest scheduled first pitch still ahead of us, ISO. Null when the schedule is silent. */
  nextFirstPitch: string | null;
  /** Confirmed batters out of the pool the board actually checked. */
  lineupProgress: { confirmed: number; checked: number } | null;
  gamesActive: number | null;
  lineupsSynced: string | null;
  eliteCandidates: number | null;
  modelStatus: string | null;
  generatedAt: string | null;
  contractVersion: string | null;
  topCandidates: LandingCandidate[];
  coverage: CoverageLayer[];
  weatherByVenue: VenueWeather[];
  isLoading: boolean;
  isError: boolean;
}

const EMPTY: Omit<LandingTelemetry, 'isLoading' | 'isError'> = {
  mode: 'offline',
  slateDate: null,
  nextFirstPitch: null,
  lineupProgress: null,
  gamesActive: null,
  lineupsSynced: null,
  eliteCandidates: null,
  modelStatus: null,
  generatedAt: null,
  contractVersion: null,
  topCandidates: [],
  coverage: [],
  weatherByVenue: [],
};

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

type Snapshot = { data: typeof EMPTY; isError: boolean };

function toCandidate(raw: unknown): LandingCandidate {
  const r = raw as Record<string, unknown>;
  return {
    playerId: num(r.playerId) ?? 0,
    playerName: str(r.playerName) ?? 'Unknown',
    teamAbbrev: str(r.teamAbbrev) ?? str(r.team) ?? '',
    opponent: str(r.opponent) ?? '',
    venue: str(r.venue),
    hrScore: num(r.hrScore),
    confidenceTier: str(r.confidenceTier),
    dataConfidence: num(r.dataConfidence),
    barrelRate: num(r.barrelRate),
    avgExitVelo: num(r.avgExitVelo),
    parkFactor: num(r.parkFactor),
    opposingPitcher: str(r.opponentPitcherName) ?? str(r.opponentPitcher),
  };
}

function rankTop(pool: unknown[], limit = 4): LandingCandidate[] {
  return [...pool]
    .sort((a, z) => (num((z as any)?.hrScore) ?? 0) - (num((a as any)?.hrScore) ?? 0))
    .slice(0, limit)
    .map(toCandidate);
}

/** YYYY-MM-DD, `back` days before today, in the visitor's own calendar. */
function dateBack(back: number): string {
  const day = new Date();
  day.setDate(day.getDate() - back);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

/**
 * Most recent past slate whose board still returns scored rows.
 *
 * Sequential on purpose: the walk stops at the first day that answers, so the
 * common case is one request, and a public landing never fans out seven.
 */
async function findReplaySlate(maxDaysBack = 7): Promise<{ date: string; pool: unknown[] } | null> {
  for (let back = 1; back <= maxDaysBack; back += 1) {
    const date = dateBack(back);
    try {
      const response = await fetch(`/api/mlb/hr-board/date/${date}`).then((r) => r.json());
      if (!response?.ok) continue;
      const pool: unknown[] =
        (Array.isArray(response.candidates) && response.candidates.length > 0 && response.candidates)
        || (Array.isArray(response.allProjectedCandidates) && response.allProjectedCandidates)
        || [];
      if (pool.length > 0) return { date, pool };
    } catch {
      // A day that will not answer is not a failure of the walk — keep going.
    }
  }
  return null;
}

/*
 * Both the telemetry strip and the command carousel read this, and they mount
 * together in the hero. Without a shared promise that is four requests for two
 * answers, and the two panels can disagree if the board ticks between them.
 */
let inFlight: Promise<Snapshot> | null = null;
let cached: Snapshot | null = null;

async function fetchSnapshot(): Promise<Snapshot> {
  {
    {
      try {
        // Settled rather than awaited together: one feed being down should not
        // blank the numbers the other one can still answer for.
        const [lineup, board, statcast, matchups, weather] = await Promise.allSettled([
          fetch('/api/mlb/lineup/today').then((r) => r.json()),
          fetch('/api/mlb/hr-board/today').then((r) => r.json()),
          fetch('/api/mlb/statcast/batters').then((r) => r.json()),
          fetch('/api/mlb/matchups/today').then((r) => r.json()),
          fetch('/api/mlb/weather/today').then((r) => r.json()),
        ]);

        const l = lineup.status === 'fulfilled' && lineup.value?.ok ? lineup.value : null;
        const b = board.status === 'fulfilled' && board.value?.ok ? board.value : null;
        const sc = statcast.status === 'fulfilled' && statcast.value?.ok ? statcast.value : null;
        const mu = matchups.status === 'fulfilled' && matchups.value?.ok ? matchups.value : null;
        const we = weather.status === 'fulfilled' && weather.value?.ok ? weather.value : null;

        const confirmed: unknown[] = Array.isArray(b?.candidates) ? b.candidates : [];
        const projected: unknown[] = Array.isArray(b?.allProjectedCandidates)
          ? b.allProjectedCandidates
          : Array.isArray(b?.rows)
            ? b.rows
            : [];

        // Degrade through real populations before admitting defeat: confirmed
        // rows, then the board's own scored-but-unconfirmed pool, then the most
        // recent slate that still answers.
        let mode: TelemetryMode = 'offline';
        let pool: unknown[] = [];
        let slateDate = str(b?.date);

        if (confirmed.length > 0) {
          mode = 'live';
          pool = confirmed;
        } else if (projected.length > 0) {
          mode = 'preview';
          pool = projected;
        } else {
          const replay = await findReplaySlate();
          if (replay) {
            mode = 'replay';
            pool = replay.pool;
            slateDate = replay.date;
          }
        }

        const elite = pool.filter(
          (c) => (c as { confidenceTier?: string })?.confidenceTier === 'elite',
        );
        const topCandidates: LandingCandidate[] = rankTop(pool);

        const totalGames = num(l?.totalGames) ?? num(b?.gameCount);
        const checkedPlayers = num(b?.pool?.totalPlayersChecked) ?? num(l?.totalPlayers);
        const confirmedStarters = num(b?.pool?.confirmedStarters);

        /*
         * Earliest first pitch still ahead of the visitor. This is what the
         * status badge counts down to, so it is read off the schedule rather
         * than assumed to be a fixed hour.
         */
        const nextFirstPitch = (() => {
          const now = Date.now();
          const times = (Array.isArray(mu?.matchups) ? mu.matchups : [])
            .map((m: Record<string, unknown>) => str(m.gameTime))
            .filter((value): value is string => value != null)
            .map((value) => Date.parse(value))
            .filter((value) => Number.isFinite(value) && value > now)
            .sort((a, z) => a - z);
          return times.length > 0 ? new Date(times[0]).toISOString() : null;
        })();

        const data = {
          mode,
          slateDate,
          nextFirstPitch,
          lineupProgress:
            confirmedStarters != null && checkedPlayers != null
              ? { confirmed: confirmedStarters, checked: checkedPlayers }
              : null,
          gamesActive: totalGames,
          /*
           * Confirmed batters out of the pool the board actually checked.
           *
           * This used to divide by `totalGames * 18`, which produced the
           * `0/180` that sat under a LIVE banner all morning: a denominator the
           * board never used, against a numerator that is zero until lineups
           * post. The board's own pool count is the honest denominator, and the
           * UI reads `mode` to say *why* the numerator is low.
           */
          lineupsSynced:
            confirmedStarters != null && checkedPlayers != null
              ? `${confirmedStarters}/${checkedPlayers}`
              : null,
          eliteCandidates: pool.length > 0 ? elite.length : null,
          modelStatus: str(b?.dataQuality)?.toUpperCase() ?? null,
          generatedAt: str(b?.generatedAt),
          contractVersion: str(b?.contractVersion),
          topCandidates,
          /*
           * These replaced a hardcoded table claiming 840K / 120K / 45K / 210K
           * records. Nothing in the API can substantiate figures at that scale,
           * so each layer reports the count and the source its endpoint
           * actually returned, and stays null when the feed is silent.
           */
          coverage: [
            {
              id: '01',
              label: 'STATCAST_TELEMETRY',
              description: 'Season exit velocity, barrel rate and hard-hit profiles per qualified batter.',
              outcome: 'Real contact quality, so a hot streak built on soft singles never reads as power.',
              count: num(sc?.count),
              unit: 'batters',
              source: str(sc?.source),
            },
            {
              id: '02',
              label: 'PITCHER_MATCHUPS',
              description: 'Probable starters and handedness resolved for every game on the slate.',
              outcome: 'Who is actually pitching, and whether the arm gives up flyballs to this side of the plate.',
              count: num(mu?.count),
              unit: 'matchups',
              source: str(mu?.meta?.source) ?? 'mlb_statsapi',
            },
            {
              id: '03',
              label: 'ENVIRONMENTAL_VECTORS',
              description: 'First-pitch wind, temperature and precipitation per venue.',
              outcome: 'Whether the air is helping the ball out, and an honest blank when the forecast is down.',
              count: Array.isArray(we?.weather) ? we.weather.length : null,
              unit: 'venues',
              source: str(we?.source),
            },
            {
              id: '04',
              label: 'CANDIDATE_EVALUATIONS',
              description: 'Batters scored against park, matchup and lineup evidence for today.',
              outcome: 'Every batter graded on the same evidence, so two names can be compared like for like.',
              count: num(b?.counts?.totalCandidates) ?? num(b?.candidates?.length),
              unit: 'evaluations',
              source: str(b?.contractVersion),
            },
          ],
          weatherByVenue: (Array.isArray(we?.weather) ? we.weather : []).map((w: Record<string, unknown>) => ({
            venue: str(w.venue) ?? '',
            tempF: num(w.tempF),
            windMph: num(w.windMph),
            windCompass: str(w.windCompass),
            precipChancePct: num(w.precipChancePct),
            available: w.status === 'ok' || num(w.tempF) != null,
          })),
        };
        return { data, isError: !l && !b };
      } catch {
        return { data: EMPTY, isError: true };
      }
    }
  }
}

export function useLandingTelemetry(): LandingTelemetry {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(cached);
  const [isLoading, setIsLoading] = useState(cached == null);

  useEffect(() => {
    if (cached) return;
    let alive = true;

    inFlight ??= fetchSnapshot().then((result) => {
      cached = result;
      inFlight = null;
      return result;
    });

    void inFlight.then((result) => {
      if (!alive) return;
      setSnapshot(result);
      setIsLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  return { ...(snapshot?.data ?? EMPTY), isLoading, isError: snapshot?.isError ?? false };
}
