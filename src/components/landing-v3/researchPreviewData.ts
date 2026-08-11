import { useMemo } from "react";
import { useLiveGames } from "../../hooks/queries/useLiveGames";
import { useHrBoardToday } from "../../hooks/queries/useHrBoardToday";
import { buildBoard } from "../../features/hr/utils/normalizeHrWatch";
import type { HrWatchRow } from "../../features/hr/types/hrWatch";
import { teamIdByName } from "../../lib/teamLogos";
import { sortLiveGameCards, type LiveGameCard } from "../../types/liveGames";

export type EvidenceState = "available" | "partial" | "unavailable";

export type EvidenceItem = {
  label: string;
  explanation: string;
  source: string;
  freshness: string;
  state: EvidenceState;
  detail: string;
};

export type PreviewStatus =
  | "live"
  | "final"
  | "scheduled"
  | "loading"
  | "error"
  | "demo";

export function formatGameTime(iso: string | null): string {
  if (!iso) return "Time TBD";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Time TBD";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatFeedTime(iso: string | null | undefined): string {
  if (!iso) return "Timestamp unavailable";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function isLiveGame(game: LiveGameCard): boolean {
  return Boolean(game.isLive) || /progress|live|in play|warmup|delayed/i.test(game.status);
}

export function isFinalGame(game: LiveGameCard): boolean {
  return Boolean(game.isFinal) || /final|game over|completed/i.test(game.status);
}

function resolveTeamId(
  value: string | null | undefined,
  fallbackId?: number | null,
): number | null {
  if (fallbackId != null && Number.isFinite(fallbackId)) return fallbackId;
  if (!value) return null;
  return teamIdByName(value) ?? null;
}

function sameTeam(
  leftName: string | null | undefined,
  leftId: number | null | undefined,
  rightName: string | null | undefined,
  rightId: number | null | undefined,
): boolean {
  const left = resolveTeamId(leftName, leftId);
  const right = resolveTeamId(rightName, rightId);
  if (left != null && right != null) return left === right;

  const a = (leftName || "").trim().toLowerCase();
  const b = (rightName || "").trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function pickMatchupPlayers(game: LiveGameCard, boardInput: unknown): HrWatchRow[] {
  const board = buildBoard(boardInput);
  const pool = [...board.confirmed, ...board.curated, ...board.all];
  const gamePk = String(game.id);
  const byGame = pool.filter((row) => row.gamePk != null && String(row.gamePk) === gamePk);
  const byTeams = pool.filter(
    (row) =>
      (sameTeam(row.team, null, game.awayTeam, game.awayTeamId) &&
        sameTeam(row.opponent, null, game.homeTeam, game.homeTeamId)) ||
      (sameTeam(row.team, null, game.homeTeam, game.homeTeamId) &&
        sameTeam(row.opponent, null, game.awayTeam, game.awayTeamId)) ||
      (sameTeam(row.team, null, game.awayAbbr, game.awayTeamId) &&
        sameTeam(row.opponent, null, game.homeAbbr, game.homeTeamId)) ||
      (sameTeam(row.team, null, game.homeAbbr, game.homeTeamId) &&
        sameTeam(row.opponent, null, game.awayAbbr, game.awayTeamId)),
  );
  const matched = (byGame.length > 0 ? byGame : byTeams).filter(
    (row, index, rows) =>
      rows.findIndex((candidate) => candidate.stableId === row.stableId) === index,
  );
  return matched.sort((a, b) => b.hrScore - a.hrScore).slice(0, 3);
}

export function pickFeaturedGame(
  games: LiveGameCard[],
  boardInput: unknown,
): LiveGameCard | null {
  const sorted = sortLiveGameCards(games);
  if (sorted.length === 0) return null;

  const withResearch = sorted.find(
    (game) => !isFinalGame(game) && pickMatchupPlayers(game, boardInput).length > 0,
  );
  if (withResearch) return withResearch;

  return (
    sorted.find((game) => isLiveGame(game)) ??
    sorted.find((game) => !isFinalGame(game)) ??
    sorted[0] ??
    null
  );
}

function scoreState(value: number | null | undefined): EvidenceState {
  return value == null || Number.isNaN(value) ? "unavailable" : "available";
}

export function buildEvidenceItems(
  player: HrWatchRow | null,
  feedAsOf: string | null | undefined,
  usingDemo: boolean,
): EvidenceItem[] {
  const freshness = usingDemo
    ? "Demo sample — not a live feed timestamp"
    : formatFeedTime(feedAsOf);

  if (usingDemo || !player) {
    return [
      {
        label: "Bullpen context",
        explanation: "Shows whether recent usage or rest may affect late-inning leverage.",
        source: "Research workspace (when published)",
        freshness,
        state: "unavailable",
        detail: usingDemo
          ? "Demo view only — no live bullpen feed is shown here."
          : "No bullpen signal is attached to this matchup preview yet.",
      },
      {
        label: "Weather",
        explanation: "Park weather can change fly-ball carry and matchup context.",
        source: "Game environment feed (when available)",
        freshness,
        state: "unavailable",
        detail: "Weather is omitted until the product feed returns a forecast.",
      },
      {
        label: "Travel and rest",
        explanation: "Helps flag short rest, long trips, or home-stand stability.",
        source: "Schedule context",
        freshness,
        state: "partial",
        detail: "Venue and start time are known; travel/rest scoring is not claimed here.",
      },
      {
        label: "Player or team trends",
        explanation: "Recent form and matchup trends support the research conclusion.",
        source: usingDemo ? "Sample copy" : "HR research board",
        freshness,
        state: usingDemo ? "unavailable" : "partial",
        detail: usingDemo
          ? "Sample data only — open the board after signup for live rows."
          : "Trend detail appears when a player row is linked to this game.",
      },
      {
        label: "Injury / lineup status",
        explanation: "Lineup and availability notes change who can actually play.",
        source: "Official lineup / injury reporting (when posted)",
        freshness,
        state: "unavailable",
        detail: "Injury status is not invented when the feed is silent.",
      },
      {
        label: "Historical matchup context",
        explanation: "Pitcher, park, and platoon history when the board has enough inputs.",
        source: "MLB Stats API-backed research rows",
        freshness,
        state: usingDemo ? "unavailable" : "partial",
        detail: usingDemo
          ? "Demo placeholder — not graded history."
          : "Shown only through player reasons and layer scores when present.",
      },
    ];
  }

  return [
    {
      label: "Bullpen context",
      explanation: "Late-inning leverage depends on who is actually available.",
      source: "HR research pipeline",
      freshness,
      state: scoreState(player.bullpen),
      detail:
        player.bullpen != null
          ? `Bullpen layer score: ${Math.round(player.bullpen)}.`
          : "Bullpen layer not present on this row.",
    },
    {
      label: "Weather",
      explanation: "Environment can support or mute power outcomes at the park.",
      source: player.weather != null ? "Game environment feed" : "Not in payload",
      freshness,
      state: scoreState(player.weather),
      detail:
        player.weather != null
          ? `Weather index: ${Math.round(player.weather)}.`
          : "No weather forecast attached to this player row.",
    },
    {
      label: "Travel and rest",
      explanation: "Schedule context is used when rest or travel pressure is known.",
      source: "Schedule + venue context",
      freshness,
      state: player.venue || player.gameTime ? "partial" : "unavailable",
      detail: player.venue
        ? `Venue listed as ${player.venue}. A dedicated rest/travel score is not claimed unless the row includes one.`
        : "Travel/rest detail unavailable on this preview.",
    },
    {
      label: "Player or team trends",
      explanation: "Recent form and pitcher vulnerability help frame the matchup.",
      source: "HR research board",
      freshness,
      state:
        player.recentForm != null || player.pitcherVulnerability != null
          ? "available"
          : "partial",
      detail:
        [
          player.recentForm != null ? `Recent form ${Math.round(player.recentForm)}` : null,
          player.pitcherVulnerability != null
            ? `Pitcher vulnerability ${Math.round(player.pitcherVulnerability)}`
            : null,
          player.pitcherName ? `vs ${player.pitcherName}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Trend fields are not populated on this row.",
    },
    {
      label: "Injury / lineup status",
      explanation: "Confirmed lineups are treated differently from projected previews.",
      source: "Lineup truth status",
      freshness,
      state: player.truthStatus === "official" ? "available" : "partial",
      detail:
        player.truthStatus === "official"
          ? "Confirmed lineup row."
          : player.truthStatus === "projected"
            ? "Preview only — official lineup not posted yet."
            : `Lineup state: ${player.truthStatus}.`,
    },
    {
      label: "Historical matchup context",
      explanation: "Park, power, and reason codes summarize the supporting evidence.",
      source: "MLB Stats API-backed research rows",
      freshness,
      state: player.reasons.length > 0 || player.parkFactor != null ? "available" : "partial",
      detail:
        player.reasons[0] ||
        (player.parkFactor != null
          ? `Park factor ${Math.round(player.parkFactor)}.`
          : "No historical reason text on this row yet."),
    },
  ];
}

export type ResearchPreview = {
  featuredGame: LiveGameCard | null;
  players: HrWatchRow[];
  primaryPlayer: HrWatchRow | null;
  evidenceItems: EvidenceItem[];
  status: PreviewStatus;
  statusLabel: string;
  usingDemo: boolean;
  isLoading: boolean;
  isError: boolean;
  slateCount: number;
  liveCount: number;
  feedTimestamp: string;
  sourceLabel: string;
};

/**
 * Single source of truth for the landing research preview. Both the hero card
 * and the full preview section read from this so they can never disagree, and
 * every field stays traceable to the live schedule feed or HR board payload.
 */
export function useResearchPreview(): ResearchPreview {
  const liveQuery = useLiveGames({ refetchInterval: 45_000 });
  const hrQuery = useHrBoardToday(120);

  const games = liveQuery.data?.games ?? [];
  const featuredGame = useMemo(
    () => pickFeaturedGame(games, hrQuery.data),
    [games, hrQuery.data],
  );
  const players = useMemo(
    () => (featuredGame ? pickMatchupPlayers(featuredGame, hrQuery.data) : []),
    [featuredGame, hrQuery.data],
  );
  const primaryPlayer = players[0] ?? null;

  const isLoading = liveQuery.isLoading;
  const isError = liveQuery.isError;
  const usingDemo = !isLoading && !isError && !featuredGame;

  const status: PreviewStatus = !featuredGame
    ? usingDemo
      ? "demo"
      : isLoading
        ? "loading"
        : "error"
    : isLiveGame(featuredGame)
      ? "live"
      : isFinalGame(featuredGame)
        ? "final"
        : "scheduled";

  const statusLabel = {
    live: "LIVE",
    final: "FINAL",
    scheduled: "SCHEDULED",
    loading: "LOADING",
    error: "FEED UNAVAILABLE",
    demo: "DEMO",
  }[status];

  const feedSource = featuredGame?.feedAsOf ?? liveQuery.data?.updatedAt;

  return {
    featuredGame,
    players,
    primaryPlayer,
    evidenceItems: buildEvidenceItems(primaryPlayer, feedSource, usingDemo),
    status,
    statusLabel,
    usingDemo,
    isLoading,
    isError,
    slateCount: games.length,
    liveCount: games.filter(isLiveGame).length,
    feedTimestamp: usingDemo ? "Demo sample" : formatFeedTime(feedSource),
    sourceLabel: usingDemo
      ? "Labeled demo only"
      : isError
        ? "Feed unavailable"
        : "MLB schedule feed",
  };
}
