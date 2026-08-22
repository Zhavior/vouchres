import { z } from "zod";
import {
  TD_BOARD_V2_VERSION,
  emptyTdBoardV2,
  type TdBoardV2Game,
  type TdBoardV2Snapshot,
} from "../contracts/tdBoardV2";
import type { TdBoardProvider, TdProviderStatus } from "./types";

const canonicalPlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: z.enum(["RB", "WR", "TE", "QB"]),
  team: z.string().min(1),
  opponent: z.string().min(1),
  isHome: z.boolean(),
  gameStatus: z.enum(["PRE", "LIVE", "FINAL"]),
  gameClock: z.string().optional(),
  isRedZoneActive: z.boolean().optional(),
  tdpiScore: z.number().finite().min(0).max(100),
  tier: z.enum(["ELITE", "STRONG", "VALUE", "SLEEPER"]),
  impliedTeamTotal: z.number().finite().nonnegative(),
  rzTouchShare: z.number().finite().min(0).max(100),
  inside10Touches: z.number().finite().nonnegative(),
  oppRzDefRank: z.number().int().min(1).max(32),
  oppRzTdPercentAllowed: z.number().finite().min(0).max(100),
  marketOdds: z.string().regex(/^[+-]\d+$/),
  modelEdgePercent: z.number().finite(),
  jerseyNumber: z.string().optional(),
  headshotUrl: z.string().optional(),
  lineupStatus: z.enum(["CONFIRMED", "PROJECTED", "QUESTIONABLE"]).optional(),
  rzTargets: z.number().finite().nonnegative().optional(),
  goalLineSnapPercent: z.number().finite().min(0).max(100).optional(),
  reasons: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  sourceUpdatedAt: z.string().datetime(),
  fieldSources: z.record(z.string(), z.string()),
});

const canonicalFeedSchema = z.object({
  sourceUpdatedAt: z.string().datetime(),
  players: z.array(canonicalPlayerSchema),
  games: z.array(z.unknown()).default([]),
  warnings: z.array(z.string()).default([]),
  missingCapabilities: z.array(z.string()).default([]),
});

function configuredValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

const SPORTS_DATA_IO_BASE = "https://api.sportsdata.io/v3/nfl";

function sportsDataIoDate(date: string): string {
  const [year, month, day] = date.split("-");
  const monthName = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ][Number(month) - 1];
  if (!year || !monthName || !day) throw new Error("Invalid SportsDataIO slate date");
  return `${year}-${monthName}-${day}`;
}

async function fetchSportsDataIoJson<T>(
  url: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(8_000);
  const response = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
    signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
  });
  if (!response.ok) throw new Error(`SportsDataIO returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

type TrialTeam = {
  Key?: string;
  TeamID?: number;
  FullName?: string;
  Name?: string;
  PrimaryColor?: string;
  WikipediaLogoUrl?: string;
};

type TrialScore = {
  GameKey?: string;
  ScoreID?: number;
  Date?: string;
  DateTimeUTC?: string;
  AwayTeam?: string;
  HomeTeam?: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  Quarter?: string | number | null;
  TimeRemaining?: string | null;
  Possession?: string | null;
  RedZone?: boolean;
  YardLine?: number | null;
  YardLineTerritory?: string | null;
  HasStarted?: boolean;
  IsInProgress?: boolean;
  IsOver?: boolean;
  LastUpdated?: string;
};

async function fetchTrialSchedule(
  date: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<TdBoardV2Snapshot> {
  const formattedDate = sportsDataIoDate(date);
  const [scores, teams] = await Promise.all([
    fetchSportsDataIoJson<TrialScore[]>(
      `${SPORTS_DATA_IO_BASE}/scores/json/ScoresByDate/${formattedDate}`,
      apiKey,
      signal,
    ),
    fetchSportsDataIoJson<TrialTeam[]>(
      `${SPORTS_DATA_IO_BASE}/scores/json/Teams`,
      apiKey,
      signal,
    ),
  ]);
  const teamByKey = new Map(teams.map((team) => [team.Key, team]));
  const ingestedAt = new Date().toISOString();
  const sourceUpdatedAt = scores
    .map((score) => score.LastUpdated)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  const games: TdBoardV2Game[] = scores.flatMap((score) => {
    if (!score.AwayTeam || !score.HomeTeam || !(score.ScoreID || score.GameKey)) return [];
    const away = teamByKey.get(score.AwayTeam);
    const home = teamByKey.get(score.HomeTeam);
    const status = score.IsOver ? "FINAL" : score.IsInProgress ? "LIVE" : "PRE";
    const redZoneTeam = score.RedZone ? score.Possession ?? undefined : undefined;
    return [{
      id: String(score.ScoreID ?? score.GameKey),
      name: `${away?.FullName ?? score.AwayTeam} at ${home?.FullName ?? score.HomeTeam}`,
      shortName: `${score.AwayTeam} @ ${score.HomeTeam}`,
      date: score.DateTimeUTC ?? score.Date ?? `${date}T00:00:00.000Z`,
      status,
      period: typeof score.Quarter === "number" ? score.Quarter : undefined,
      clock: score.TimeRemaining ?? undefined,
      spread: null,
      overUnder: null,
      homeTeam: {
        id: String(score.HomeTeamID ?? home?.TeamID ?? score.HomeTeam),
        name: home?.FullName ?? home?.Name ?? score.HomeTeam,
        abbreviation: score.HomeTeam,
        color: home?.PrimaryColor ?? "111827",
        logo: home?.WikipediaLogoUrl ?? "",
        score: null,
        hasPossession: score.Possession === score.HomeTeam,
      },
      awayTeam: {
        id: String(score.AwayTeamID ?? away?.TeamID ?? score.AwayTeam),
        name: away?.FullName ?? away?.Name ?? score.AwayTeam,
        abbreviation: score.AwayTeam,
        color: away?.PrimaryColor ?? "111827",
        logo: away?.WikipediaLogoUrl ?? "",
        score: null,
        hasPossession: score.Possession === score.AwayTeam,
      },
      isRedZoneActive: Boolean(score.RedZone),
      redZoneTeam,
      redZoneYardLine: score.RedZone && typeof score.YardLine === "number"
        ? score.YardLine
        : undefined,
    }];
  });

  return {
    version: TD_BOARD_V2_VERSION,
    connection: "partial",
    dataQuality: "partial",
    source: "sportsdataio_trial_schedule",
    sourceUpdatedAt,
    generatedAt: ingestedAt,
    ingestedAt,
    players: [],
    games,
    warnings: [
      "Schedule and team identity are connected. Trial statistics, scores, odds, and props remain hidden because SportsDataIO scrambles them.",
    ],
    coverage: {
      candidateCount: 0,
      sourcedFieldPercent: 0,
      missingCapabilities: ["depth_charts", "injuries", "red_zone_usage", "player_props", "team_totals"],
    },
  };
}

function providerStatus(): TdProviderStatus {
  const apiKey = configuredValue("SPORTSDATAIO_API_KEY") ?? configuredValue("SPORTSDATA_API_KEY");
  const boardUrl = configuredValue("SPORTSDATAIO_TD_BOARD_URL");
  const dataMode = configuredValue("SPORTSDATAIO_DATA_MODE");
  const configured = Boolean(apiKey && boardUrl);
  const capabilities = {
    schedule: Boolean(apiKey),
    depth_charts: configured,
    injuries: configured,
    red_zone_usage: configured,
    player_props: configured,
    team_totals: configured,
  };

  return {
    provider: "sportsdataio",
    configured,
    capabilities,
    warning: configured
      ? undefined
      : apiKey && dataMode === "scrambled_trial"
        ? "SportsDataIO trial key detected. Its NFL stats and props are scrambled, so TD Next is intentionally blocked until a licensed production feed is configured."
        : apiKey
          ? "SportsDataIO API key detected. Add a licensed SPORTSDATAIO_TD_BOARD_URL to enable the source-backed board."
          : "SportsDataIO API key is missing. Set SPORTSDATAIO_API_KEY and a licensed SPORTSDATAIO_TD_BOARD_URL.",
  };
}

export class SportsDataIoTdBoardProvider implements TdBoardProvider {
  status(): TdProviderStatus {
    return providerStatus();
  }

  async fetchBoard(input: { date: string; signal?: AbortSignal }): Promise<TdBoardV2Snapshot> {
    const status = providerStatus();
    if (!status.configured) {
      const apiKey = configuredValue("SPORTSDATAIO_API_KEY") ?? configuredValue("SPORTSDATA_API_KEY");
      if (apiKey && configuredValue("SPORTSDATAIO_DATA_MODE") === "scrambled_trial") {
        return fetchTrialSchedule(input.date, apiKey, input.signal);
      }
      return emptyTdBoardV2(
        "not_configured",
        status.warning ?? "SportsDataIO is not configured.",
        Object.entries(status.capabilities).filter(([, enabled]) => !enabled).map(([name]) => name),
      );
    }

    const apiKey = configuredValue("SPORTSDATAIO_API_KEY") ?? configuredValue("SPORTSDATA_API_KEY")!;
    const boardUrl = new URL(configuredValue("SPORTSDATAIO_TD_BOARD_URL")!);
    boardUrl.searchParams.set("date", input.date);

    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), 8_000);
    const abort = () => timeoutController.abort();
    input.signal?.addEventListener("abort", abort, { once: true });

    try {
      const response = await fetch(boardUrl, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
        signal: timeoutController.signal,
      });
      if (!response.ok) {
        throw new Error(`SportsDataIO TD feed returned HTTP ${response.status}`);
      }

      const parsed = canonicalFeedSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new Error(`SportsDataIO TD feed contract mismatch: ${parsed.error.issues[0]?.message ?? "invalid payload"}`);
      }

      const ingestedAt = new Date().toISOString();
      const players = parsed.data.players.map(({ sourceUpdatedAt, fieldSources, ...player }) => ({
        ...player,
        provenance: {
          source: "sportsdataio",
          sourceUpdatedAt,
          ingestedAt,
          fields: fieldSources,
        },
      }));
      const sourcedFields = players.reduce(
        (sum, player) => sum + Object.keys(player.provenance.fields).length,
        0,
      );
      const expectedFields = players.length * 10;

      return {
        version: TD_BOARD_V2_VERSION,
        connection: parsed.data.missingCapabilities.length > 0 ? "partial" : "live",
        dataQuality: parsed.data.missingCapabilities.length > 0 ? "partial" : "source_backed",
        source: "sportsdataio",
        sourceUpdatedAt: parsed.data.sourceUpdatedAt,
        generatedAt: ingestedAt,
        ingestedAt,
        players,
        games: parsed.data.games as TdBoardV2Snapshot["games"],
        warnings: parsed.data.warnings,
        coverage: {
          candidateCount: players.length,
          sourcedFieldPercent: expectedFields === 0
            ? 0
            : Math.min(100, Math.round((sourcedFields / expectedFields) * 100)),
          missingCapabilities: parsed.data.missingCapabilities,
        },
      };
    } finally {
      clearTimeout(timeout);
      input.signal?.removeEventListener("abort", abort);
    }
  }
}

export function getSportsDataIoTdProviderStatus(): TdProviderStatus {
  return providerStatus();
}
