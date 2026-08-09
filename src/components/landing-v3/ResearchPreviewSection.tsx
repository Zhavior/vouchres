import { useMemo } from "react";
import {
  ArrowRight,
  Clock3,
  Radio,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLiveGames } from "../../hooks/queries/useLiveGames";
import { useHrBoardToday } from "../../hooks/queries/useHrBoardToday";
import { buildBoard } from "../../features/hr/utils/normalizeHrWatch";
import type { HrWatchRow } from "../../features/hr/types/hrWatch";
import { TeamLogo } from "../live/LiveTeamLogo";
import { logoByTeamId, logoByTeamName, teamIdByName } from "../../lib/teamLogos";
import {
  liveGameDisplayStatus,
  sortLiveGameCards,
  type LiveGameCard,
} from "../../types/liveGames";

const groundingEase = [0.22, 1, 0.36, 1] as const;

type EvidenceState = "available" | "partial" | "unavailable";

type EvidenceItem = {
  label: string;
  explanation: string;
  source: string;
  freshness: string;
  state: EvidenceState;
  detail: string;
};

function formatGameTime(iso: string | null): string {
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

function formatFeedTime(iso: string | null | undefined): string {
  if (!iso) return "Timestamp unavailable";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function isLiveGame(game: LiveGameCard): boolean {
  return Boolean(game.isLive) || /progress|live|in play|warmup|delayed/i.test(game.status);
}

function isFinalGame(game: LiveGameCard): boolean {
  return Boolean(game.isFinal) || /final|game over|completed/i.test(game.status);
}

function pickFeaturedGame(
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

function resolveTeamId(value: string | null | undefined, fallbackId?: number | null): number | null {
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

function pickMatchupPlayers(game: LiveGameCard, boardInput: unknown): HrWatchRow[] {
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
    (row, index, rows) => rows.findIndex((candidate) => candidate.stableId === row.stableId) === index,
  );
  return matched.sort((a, b) => b.hrScore - a.hrScore).slice(0, 2);
}

function scoreState(value: number | null | undefined): EvidenceState {
  return value == null || Number.isNaN(value) ? "unavailable" : "available";
}

function buildEvidenceItems(
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
        label: "Injury information",
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
        ? `Venue listed as ${player.venue}. Dedicated rest/travel score is not claimed unless the row includes it.`
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
      detail: [
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

function StatePill({ state }: { state: EvidenceState }) {
  if (state === "available") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
        <ShieldCheck className="h-3 w-3" />
        Available
      </span>
    );
  }
  if (state === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
        <TriangleAlert className="h-3 w-3" />
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
      <ShieldAlert className="h-3 w-3" />
      Unavailable
    </span>
  );
}

export interface ResearchPreviewSectionProps {
  onExploreBoard?: () => void;
}

export default function ResearchPreviewSection({
  onExploreBoard,
}: ResearchPreviewSectionProps) {
  const reduceMotion = useReducedMotion();
  const liveQuery = useLiveGames({ refetchInterval: 45_000 });
  const hrQuery = useHrBoardToday(24);

  const featuredGame = useMemo(
    () => pickFeaturedGame(liveQuery.data?.games ?? [], hrQuery.data),
    [liveQuery.data?.games, hrQuery.data],
  );
  const matchupPlayers = useMemo(
    () => (featuredGame ? pickMatchupPlayers(featuredGame, hrQuery.data) : []),
    [featuredGame, hrQuery.data],
  );
  const primaryPlayer = matchupPlayers[0] ?? null;
  const usingDemo = !liveQuery.isLoading && !liveQuery.isError && !featuredGame;
  const evidenceItems = useMemo(
    () =>
      buildEvidenceItems(
        primaryPlayer,
        featuredGame?.feedAsOf ?? liveQuery.data?.updatedAt,
        usingDemo,
      ),
    [featuredGame?.feedAsOf, liveQuery.data?.updatedAt, primaryPlayer, usingDemo],
  );

  const statusLabel = !featuredGame
    ? usingDemo
      ? "DEMO"
      : liveQuery.isLoading
        ? "LOADING"
        : liveQuery.isError
          ? "FEED UNAVAILABLE"
          : "NO GAME"
    : isLiveGame(featuredGame)
      ? "LIVE"
      : isFinalGame(featuredGame)
        ? "FINAL"
        : "SCHEDULED";

  const awayLogo = featuredGame
    ? logoByTeamId(featuredGame.awayTeamId) ?? logoByTeamName(featuredGame.awayTeam)
    : null;
  const homeLogo = featuredGame
    ? logoByTeamId(featuredGame.homeTeamId) ?? logoByTeamName(featuredGame.homeTeam)
    : null;

  return (
    <section
      id="research-preview"
      aria-labelledby="research-preview-title"
      className="relative isolate scroll-mt-20 border-t border-white/[0.05] bg-black px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: groundingEase }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5">
            <Radio className="h-3.5 w-3.5 text-cyan-300" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
              Real research preview
            </span>
          </div>
          <h2
            id="research-preview-title"
            className="mt-6 text-balance text-4xl font-black tracking-tight text-white sm:text-5xl"
          >
            See one matchup the way the research board shows it.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            This preview uses today&apos;s MLB schedule feed and, when available, linked HR
            research rows. Missing fields stay missing — we do not invent confidence, weather,
            or results.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <article className="rounded-[2rem] border border-white/[0.08] bg-[#070b12]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
            {usingDemo && (
              <div className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-50">
                Demo research view — sample data. Today&apos;s official slate has no game to
                feature right now.
              </div>
            )}
            {liveQuery.isError && (
              <div className="mb-5 rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-4 py-3 text-sm text-rose-50">
                The MLB schedule feed is unavailable. No fallback scores or fake matchups are
                shown.
              </div>
            )}

            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                  Featured matchup
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {featuredGame
                    ? `${featuredGame.awayTeam} vs ${featuredGame.homeTeam}`
                    : usingDemo
                      ? "Sample Away vs Sample Home"
                      : "Waiting for today’s slate"}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-white/50">
                  <Clock3 className="h-4 w-4" />
                  {featuredGame
                    ? isLiveGame(featuredGame) || isFinalGame(featuredGame)
                      ? liveGameDisplayStatus(featuredGame)
                      : formatGameTime(featuredGame.gameDate)
                    : "Game time unavailable"}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                {statusLabel}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  {awayLogo ? (
                    <TeamLogo src={awayLogo} alt="" size={36} />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[10px] text-white/50">
                      AWY
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {featuredGame?.awayTeam ?? "Away team"}
                    </p>
                    <p className="text-xs text-white/40">Away</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  {homeLogo ? (
                    <TeamLogo src={homeLogo} alt="" size={36} />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[10px] text-white/50">
                      HOM
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {featuredGame?.homeTeam ?? "Home team"}
                    </p>
                    <p className="text-xs text-white/40">Home</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Venue
                </p>
                <p className="mt-2 text-sm text-white/80">
                  {featuredGame?.venue || "Venue not yet listed"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Data timestamp
                </p>
                <p className="mt-2 text-sm text-white/80">
                  {usingDemo
                    ? "Demo sample"
                    : formatFeedTime(featuredGame?.feedAsOf ?? liveQuery.data?.updatedAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Source
                </p>
                <p className="mt-2 text-sm text-white/80">
                  {usingDemo
                    ? "Labeled demo only"
                    : liveQuery.isError
                      ? "Feed unavailable"
                      : "MLB schedule feed via VouchEdge API"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                Key research signals
              </p>
              {primaryPlayer ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{primaryPlayer.playerName}</p>
                      <p className="text-sm text-white/50">
                        {primaryPlayer.team} vs {primaryPlayer.opponent}
                        {primaryPlayer.pitcherName ? ` · vs ${primaryPlayer.pitcherName}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl font-bold text-cyan-200">
                        {Math.round(primaryPlayer.hrScore)}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                        HR research score
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Data confidence
                      </p>
                      <p className="mt-1 font-mono text-lg text-white">
                        {primaryPlayer.dataConfidence == null
                          ? "Not provided"
                          : `${Math.round(primaryPlayer.dataConfidence)}`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Lineup truth
                      </p>
                      <p className="mt-1 text-sm text-white/80">
                        {primaryPlayer.truthStatus === "official"
                          ? "Confirmed lineup"
                          : primaryPlayer.truthStatus === "projected"
                            ? "Preview only"
                            : primaryPlayer.truthStatus}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-white/65">
                    {primaryPlayer.reasons[0] ||
                      "No reason text is attached to this row yet. Open the board to inspect the full evidence stack."}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-white/60">
                  {usingDemo
                    ? "Sample mode does not attach fabricated player signals."
                    : hrQuery.isLoading
                      ? "Loading linked research rows for this matchup…"
                      : "No linked HR research row is available for this game yet. Schedule context still stands on its own."}
                </p>
              )}
              <p className="mt-4 text-sm leading-6 text-white/50">
                Confidence represents how strongly the available evidence supports the current
                research conclusion. It is not a guarantee of the outcome.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/50">
                After the game, tracked decisions can be compared with the final result in your
                results workspace.
              </p>
              <button
                type="button"
                onClick={onExploreBoard}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-bold text-[#031017] transition hover:bg-cyan-300"
              >
                Explore Today&apos;s MLB Board
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-white/[0.08] bg-[#070b12]/90 p-6 sm:p-7">
              <h3 className="text-xl font-semibold text-white">Evidence cards</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Each item shows what is known, what is partial, and what is unavailable for this
                preview.
              </p>
              <div className="mt-5 space-y-3">
                {evidenceItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <StatePill state={item.state} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/60">{item.explanation}</p>
                    <p className="mt-3 text-xs leading-5 text-white/40">
                      Source: {item.source}
                      <br />
                      Freshness: {item.freshness}
                      <br />
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
