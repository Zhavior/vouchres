import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RefreshCw, Target } from "lucide-react";
import { useHrBoardViewModel } from "../hr/hooks/useHrBoardViewModel";
import { selectBrainPicks } from "./brainSelection";
import { BrainPageShell } from "./BrainPageShell";
import { Z8_LABEL, Z8_PANEL_PREMIUM } from "../../theme/z8Tokens";
import { apiClient } from "../../lib/apiClient";
import PlayerHeadshot from "../../components/parlays/PlayerHeadshot";
import { BrainMarketLoadingState } from "./BrainMarketLoadingState";

type BrainScan = {
  coverage: {
    games: number;
    teams: number;
    playersScanned: number;
    eligiblePlayers: number;
    confirmedPlayers: number;
    parks: number;
  };
  temporal: {
    phase: string;
    nextGameAt: string | null;
    millisecondsToNextGame: number | null;
    decisionWindowOpen: boolean;
  };
  sources: Array<{
    key: string;
    label: string;
    status: "verified" | "partial" | "missing";
    coverage: number;
    note: string;
  }>;
  generatedAt: string;
  markets: Record<
    "home_run" | "stolen_base" | "pitcher_strikeouts",
    {
      readiness: number;
      state:
        | "no_games"
        | "waiting_for_window"
        | "waiting_for_evidence"
        | "ready_to_process"
        | "locked";
      blockers: string[];
      evaluatedAt: string;
    }
  >;
  warnings: string[];
};
type ServerBrainPick = {
  playerId: string;
  playerName: string;
  team: string;
  opponent: string;
  rank: number;
  score: number;
  confidence: number;
  tier: string;
  evidenceQuality: string;
  reasons?: string[];
  risks?: string[];
  result: "pending" | "hit" | "miss" | "void";
};
type AiPickReview = {
  subjectId: string;
  verdict:
    | "support"
    | "support_with_caution"
    | "insufficient_evidence"
    | "contradiction_detected";
  summary: string;
  supportingSignals: string[];
  riskSignals: string[];
  missingEvidence: string[];
  tags: string[];
  withdrawalCondition: string;
};
type AiMarketReview = {
  market: string;
  model: string;
  status: string;
  reviews: AiPickReview[];
  createdAt: string;
};
type BrainPicksResponse = {
  picks: ServerBrainPick[];
  stolenBase: { picks: ServerBrainPick[] };
  pitcherStrikeouts: { picks: ServerBrainPick[] };
  aiReviews: Partial<
    Record<"home_run" | "stolen_base" | "pitcher_strikeouts", AiMarketReview>
  >;
};

const reviewLabel = (review?: AiPickReview) =>
  review?.verdict.replaceAll("_", " ") ?? "review pending";

export default function BrainPicksPage({
  onNavigate,
}: {
  onNavigate: (section: string) => void;
}) {
  const vm = useHrBoardViewModel();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const candidatePicks = useMemo(
    () => selectBrainPicks(vm.rows ?? []),
    [vm.rows],
  );
  const picksQuery = useQuery({
    queryKey: ["brain", "picks", "mlb", vm.date],
    queryFn: () =>
      apiClient.get<BrainPicksResponse>("/api/intelligence/brain/mlb/picks", {
        date: vm.date,
      }),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
  const picks = useMemo(() => {
    const serverByPlayer = new Map(
      (picksQuery.data?.picks ?? []).map((pick) => [pick.playerId, pick]),
    );
    return candidatePicks
      .filter((pick) => serverByPlayer.has(String(pick.player.playerId)))
      .map((pick) => ({
        ...pick,
        selectionScore: serverByPlayer.get(String(pick.player.playerId))!.score,
      }))
      .sort(
        (a, b) =>
          serverByPlayer.get(String(a.player.playerId))!.rank -
          serverByPlayer.get(String(b.player.playerId))!.rank,
      );
  }, [candidatePicks, picksQuery.data]);
  const scanQuery = useQuery({
    queryKey: ["brain", "scan", "mlb", vm.date],
    queryFn: () =>
      apiClient.get<{ scan: BrainScan }>("/api/intelligence/brain/mlb/scan", {
        date: vm.date,
      }),
    staleTime: 5 * 60_000,
  });
  const selected =
    picks.find((pick) => pick.player.stableId === selectedId) ??
    picks[0] ??
    null;
  const homeRunReviews = useMemo(
    () =>
      new Map(
        (picksQuery.data?.aiReviews.home_run?.reviews ?? []).map((review) => [
          review.subjectId,
          review,
        ]),
      ),
    [picksQuery.data],
  );
  const stolenBaseReviews = useMemo(
    () =>
      new Map(
        (picksQuery.data?.aiReviews.stolen_base?.reviews ?? []).map(
          (review) => [review.subjectId, review],
        ),
      ),
    [picksQuery.data],
  );
  const pitcherKReviews = useMemo(
    () =>
      new Map(
        (picksQuery.data?.aiReviews.pitcher_strikeouts?.reviews ?? []).map(
          (review) => [review.subjectId, review],
        ),
      ),
    [picksQuery.data],
  );
  const selectedReview = selected
    ? homeRunReviews.get(String(selected.player.playerId))
    : undefined;
  const officialCount = picks.filter(
    (pick) => pick.evidenceQuality === "official",
  ).length;
  const decisionWindowOpen =
    scanQuery.data?.scan.temporal.decisionWindowOpen ?? false;
  const untilWindow =
    scanQuery.data?.scan.temporal.millisecondsToNextGame == null
      ? null
      : Math.max(
          0,
          scanQuery.data.scan.temporal.millisecondsToNextGame - 4 * 60 * 60_000,
        );
  const fallbackMarket = {
    readiness: decisionWindowOpen ? 25 : 10,
    state: decisionWindowOpen
      ? ("waiting_for_evidence" as const)
      : ("waiting_for_window" as const),
    blockers: [] as string[],
    evaluatedAt: scanQuery.data?.scan.generatedAt ?? "",
  };
  const homeRunReadiness =
    scanQuery.data?.scan.markets?.home_run ?? fallbackMarket;
  const stolenBaseReadiness =
    scanQuery.data?.scan.markets?.stolen_base ?? fallbackMarket;
  const pitcherKReadiness =
    scanQuery.data?.scan.markets?.pitcher_strikeouts ?? fallbackMarket;

  return (
    <BrainPageShell active="picks" onNavigate={onNavigate}>
      <section className="brain-panel p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={`${Z8_LABEL} text-vouch-cyan`}>
              Brain Scan · Full slate intake
            </div>
            <h2 className="mt-1 text-xl font-black text-white">
              Evidence coverage before selection
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/50">
              The scan reviews the eligible slate first. Missing sources reduce
              confidence; they are never filled with invented data.
            </p>
          </div>
          {scanQuery.data && (
            <div className="flex flex-wrap gap-2">
              <span
                className={`${Z8_LABEL} border border-vouch-cyan/25 bg-vouch-cyan/5 px-3 py-1.5 text-vouch-cyan`}
              >
                {scanQuery.data.scan.coverage.playersScanned} players ·{" "}
                {scanQuery.data.scan.coverage.games} games
              </span>
              <span
                className={`${Z8_LABEL} border px-3 py-1.5 ${scanQuery.data.scan.temporal.decisionWindowOpen ? "border-vouch-emerald/30 bg-vouch-emerald/8 text-vouch-emerald" : "border-white/10 text-white/45"}`}
              >
                {scanQuery.data.scan.temporal.decisionWindowOpen
                  ? "Decision window open"
                  : scanQuery.data.scan.temporal.phase.replace("_", " ")}
              </span>
              {scanQuery.data.scan.temporal.nextGameAt && (
                <span
                  className={`${Z8_LABEL} border border-white/10 px-3 py-1.5 text-white/50`}
                >
                  Next{" "}
                  {new Date(
                    scanQuery.data.scan.temporal.nextGameAt,
                  ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          )}
        </div>
        {scanQuery.isLoading ? (
          <div className="flex min-h-28 items-center justify-center gap-2 text-white/45">
            <RefreshCw className="h-4 w-4 animate-spin" /> Scanning MLB evidence
          </div>
        ) : scanQuery.data ? (
          <div className="brain-scan-grid mt-4">
            {scanQuery.data.scan.sources.map((source) => (
              <article
                key={source.key}
                className="brain-source-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-xs text-white/75">
                    {source.label}
                  </strong>
                  <span
                    className={`${Z8_LABEL} ${source.status === "verified" ? "text-vouch-emerald" : source.status === "partial" ? "text-amber-200" : "text-rose-300"}`}
                  >
                    {source.coverage}%
                  </span>
                </div>
                <div className="brain-source-track mt-2">
                  <div
                    className={source.status === "missing" ? "bg-rose-400" : source.status === "partial" ? "bg-amber-300" : undefined}
                    style={{ width: `${source.coverage}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] leading-5 text-white/40">
                  {source.note}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-rose-200">
            Scan unavailable. Picks remain visibly unverified rather than
            showing false coverage.
          </p>
        )}
      </section>

      <section className="brain-panel p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={`${Z8_LABEL} text-amber-200`}>
              Stolen base brain · Evidence limited
            </div>
            <h2 className="mt-1 text-xl font-black text-white">
              Selective runner opportunities
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/50">
              A separate market using official attempt history, success rate,
              recent activity, lineup state, and on-base ability. It does not
              reuse home-run weights.
            </p>
          </div>
          <span
            className={`${Z8_LABEL} border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-amber-200`}
          >
            Speed + battery defense pending
          </span>
        </div>
        {picksQuery.isLoading || !picksQuery.data?.stolenBase.picks.length ? (
          <div className="mt-4">
            <BrainMarketLoadingState
              market="Stolen base"
              {...stolenBaseReadiness}
              millisecondsUntilWindow={untilWindow}
            />
          </div>
        ) : (
          <div className="brain-market-grid mt-4">
            {picksQuery.data.stolenBase.picks.map((pick, index) => {
              const review = stolenBaseReviews.get(String(pick.playerId));
              return (
                <article
                  key={`sb-${pick.playerId}`}
                  className="brain-market-card"
                  data-favorite={index < 3}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PlayerHeadshot
                        name={pick.playerName}
                        playerId={pick.playerId}
                        size={48}
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-white">
                          {pick.playerName}
                        </h3>
                        <p className="mt-1 font-mono text-[10px] uppercase text-white/35">
                          {pick.team} vs {pick.opponent} ·{" "}
                          {pick.evidenceQuality}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="font-mono text-2xl text-amber-200">
                        {pick.score}
                      </strong>
                      <span className={`${Z8_LABEL} block text-white/35`}>
                        SB score
                      </span>
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span
                        className={`${Z8_LABEL} border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-amber-200`}
                      >
                        Top 3 favorite
                      </span>
                      <span
                        className={`${Z8_LABEL} border border-vouch-cyan/25 bg-vouch-cyan/5 px-2 py-1 text-vouch-cyan`}
                      >
                        AI: {reviewLabel(review)}
                      </span>
                      {(review?.tags ?? pick.reasons ?? [])
                        .slice(0, 2)
                        .map((reason) => (
                          <span
                            key={reason}
                            className={`${Z8_LABEL} border border-white/10 px-2 py-1 text-white/50`}
                          >
                            {reason}
                          </span>
                        ))}
                    </div>
                  )}
                  {review && (
                    <p className="mt-3 text-xs leading-5 text-white/50">
                      {review.summary}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className={`${Z8_LABEL} text-white/35`}>
                      {pick.tier}
                    </span>
                    <span className="font-mono text-xs text-white/55">
                      Confidence {pick.confidence}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <section className="brain-stat-grid">
        {[
          ["Players chosen", picks.length],
          ["Official lineup", officialCount],
          [
            "Roster rows rejected",
            Math.max(0, (vm.rows?.length ?? 0) - picks.length),
          ],
        ].map(([label, value]) => (
          <div key={String(label)} className="brain-stat">
            <div className={`${Z8_LABEL} text-white/40`}>{label}</div>
            <div className="mt-1 font-mono text-2xl font-black text-white">
              {value}
            </div>
          </div>
        ))}
      </section>

      {picks.some((pick) => pick.evidenceQuality === "preview") && (
        <div className="brain-callout flex items-start gap-2 p-3 text-sm text-amber-100/75">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Official lineups
          are incomplete. Preview selections are penalized and may change.
        </div>
      )}

      {vm.loading || picksQuery.isLoading ? (
        <BrainMarketLoadingState
          market="Home run"
          {...homeRunReadiness}
          millisecondsUntilWindow={untilWindow}
        />
      ) : picksQuery.isError ? (
        <div className="brain-panel p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-300" />
          <h2 className="mt-3 text-lg font-bold text-white">
            Verified Brain picks are unavailable.
          </h2>
          <p className="mt-2 text-sm text-white/50">
            The page will not substitute browser-generated recommendations for
            the server-authored ledger.
          </p>
        </div>
      ) : picks.length === 0 ? (
        <BrainMarketLoadingState
          market="Home run"
          {...homeRunReadiness}
          millisecondsUntilWindow={untilWindow}
        />
      ) : (
        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid content-start gap-2">
            {picks.map((pick, index) => (
              <button
                key={pick.player.stableId}
                type="button"
                onClick={() => setSelectedId(pick.player.stableId)}
                className="brain-choice-row grid min-h-[88px] grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 border p-3 text-left"
                data-favorite={index < 3}
                data-selected={selected?.player.stableId === pick.player.stableId}
              >
                <span className="grid h-10 w-10 place-items-center border border-white/10 font-mono text-sm font-black text-white/55">
                  {index + 1}
                </span>
                <span className="flex min-w-0 items-center gap-3">
                  <PlayerHeadshot
                    name={pick.player.playerName}
                    playerId={pick.player.playerId}
                    headshotUrl={pick.player.headshotUrl}
                    size={42}
                  />
                  <span className="min-w-0">
                    <strong className="block truncate text-sm text-white">
                      {pick.player.playerName}
                    </strong>
                    <span className="mt-1 block truncate font-mono text-[10px] uppercase text-white/40">
                      {pick.player.team} vs {pick.player.opponent} ·{" "}
                      {pick.player.pitcherName || "Pitcher TBD"}
                    </span>
                    {index < 3 && (
                      <span className="mt-1.5 flex gap-1">
                        <span
                          className={`${Z8_LABEL} border border-amber-300/35 px-1.5 py-0.5 text-amber-200`}
                        >
                          Favorite
                        </span>
                        <span
                          className={`${Z8_LABEL} border border-vouch-cyan/25 px-1.5 py-0.5 text-vouch-cyan`}
                        >
                          AI:{" "}
                          {reviewLabel(
                            homeRunReviews.get(String(pick.player.playerId)),
                          )}
                        </span>
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-right">
                  <strong className="brain-score block font-mono text-xl text-vouch-emerald">
                    {pick.selectionScore}
                  </strong>
                  <small className={`${Z8_LABEL} text-white/35`}>Brain</small>
                </span>
              </button>
            ))}
          </div>

          {selected && (
            <article
              className="brain-panel min-w-0 p-4 sm:p-6"
            >
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className={`${Z8_LABEL} text-vouch-emerald`}>
                    Selected over the slate
                  </div>
                  <h2 className="mt-1 text-2xl font-black text-white">
                    {selected.player.playerName}
                  </h2>
                  <p className="mt-1 text-sm text-white/45">
                    {selected.player.team} vs {selected.player.opponent} ·{" "}
                    {selected.player.venue || "Venue pending"}
                  </p>
                </div>
                <div className="border border-vouch-emerald/25 bg-vouch-emerald/8 px-4 py-3 text-center">
                  <strong className="font-mono text-3xl text-vouch-emerald">
                    {selected.slatePercentile}
                  </strong>
                  <span className={`${Z8_LABEL} block text-white/40`}>
                    Slate percentile
                  </span>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {selected.tags.map((tag) => (
                  <span
                    key={tag.label}
                    className={`${Z8_LABEL} border px-2.5 py-1 ${tag.tone === "positive" ? "border-vouch-emerald/30 bg-vouch-emerald/8 text-vouch-emerald" : tag.tone === "warning" ? "border-amber-400/25 bg-amber-400/5 text-amber-200" : "border-white/10 text-white/55"}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-base leading-7 text-white/75">
                {selected.explanation}
              </p>
              <div
                className="brain-stat-grid mt-6"
                aria-label="Intelligence comparison"
              >
                <div className="brain-stat">
                  <div className={`${Z8_LABEL} text-white/40`}>
                    Normal intelligence
                  </div>
                  <strong className="mt-1 block font-mono text-2xl text-white">
                    {selected.player.hrScore}
                  </strong>
                  <p className="mt-1 text-xs leading-5 text-white/40">
                    Raw player HR score before slate scarcity and exposure
                    rules.
                  </p>
                </div>
                <div className="brain-stat border-vouch-emerald/30 bg-vouch-emerald/8">
                  <div className={`${Z8_LABEL} text-vouch-emerald`}>
                    Brain decision
                  </div>
                  <strong className="mt-1 block font-mono text-2xl text-vouch-emerald">
                    {selected.selectionScore}
                  </strong>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Choosy score after evidence, lineup, pitcher, and slate
                    comparison.
                  </p>
                </div>
                <div className="brain-stat">
                  <div className={`${Z8_LABEL} text-vouch-cyan`}>
                    Gemini skeptic
                  </div>
                  <strong className="mt-1 block text-sm capitalize text-white">
                    {reviewLabel(selectedReview)}
                  </strong>
                  <p className="mt-1 text-xs leading-5 text-white/40">
                    Explanation-only review. It cannot change the Brain score,
                    rank, or result.
                  </p>
                </div>
              </div>
              {selectedReview && (
                <section className="mt-4 border border-vouch-cyan/20 bg-vouch-cyan/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className={`${Z8_LABEL} text-vouch-cyan`}>
                      Independent evidence review
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReview.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`${Z8_LABEL} border border-vouch-cyan/20 px-2 py-1 text-vouch-cyan`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    {selectedReview.summary}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className={`${Z8_LABEL} text-vouch-emerald`}>
                        Supporting evidence
                      </div>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-white/50">
                        {selectedReview.supportingSignals.map((signal) => (
                          <li key={signal}>+ {signal}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className={`${Z8_LABEL} text-amber-200`}>
                        Risk and missing evidence
                      </div>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-white/50">
                        {[
                          ...selectedReview.riskSignals,
                          ...selectedReview.missingEvidence,
                        ].map((signal) => (
                          <li key={signal}>- {signal}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-white/45">
                    <strong className="text-white/65">Withdraw if:</strong>{" "}
                    {selectedReview.withdrawalCondition}
                  </p>
                </section>
              )}
              <div className="brain-stat-grid mt-6">
                {[
                  ["Power", selected.player.hitterPower],
                  ["Pitcher risk", selected.player.pitcherVulnerability],
                  ["Recent form", selected.player.recentForm],
                  ["Data confidence", selected.player.dataConfidence],
                ].map(([label, value]) => (
                  <div key={String(label)} className="brain-stat">
                    <div className="flex justify-between text-xs text-white/55">
                      <span>{label}</span>
                      <strong className="font-mono text-white">
                        {value ?? "—"}
                      </strong>
                    </div>
                    <div className="brain-meter-track mt-2">
                      <div
                        className="bg-vouch-emerald"
                        style={{
                          width: `${Math.max(0, Math.min(100, Number(value) || 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <div
                  className={`${Z8_LABEL} flex items-center gap-2 text-white/45`}
                >
                  <Target className="h-4 w-4" /> Why this survived
                </div>
                <ul className="mt-3 space-y-2">
                  {selected.player.reasons.slice(0, 4).map((reason) => (
                    <li
                      key={reason}
                      className="flex gap-2 text-sm leading-6 text-white/60"
                    >
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-vouch-emerald" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )}
        </section>
      )}

      <section className="brain-panel p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={`${Z8_LABEL} text-vouch-cyan`}>
              Pitcher strikeout brain · Forward ledger
            </div>
            <h2 className="mt-1 text-xl font-black text-white">
              Official 5+ K decisions
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">
              Official probable pitchers ranked from MLB season and recent-start
              evidence. Every displayed decision is frozen server-side and
              graded against a declared 5+ strikeout target.
            </p>
          </div>
          <span
            className={`${Z8_LABEL} border border-vouch-cyan/25 bg-vouch-cyan/5 px-3 py-1.5 text-vouch-cyan`}
          >
            MLB verified · 5+ target
          </span>
        </div>
        {picksQuery.isLoading ||
        !picksQuery.data?.pitcherStrikeouts.picks.length ? (
          <div className="mt-4">
            <BrainMarketLoadingState
              market="Pitcher strikeout"
              {...pitcherKReadiness}
              millisecondsUntilWindow={untilWindow}
            />
          </div>
        ) : (
          <div className="brain-market-grid mt-4">
            {picksQuery.data.pitcherStrikeouts.picks.map((pitcher, index) => {
              const review = pitcherKReviews.get(String(pitcher.playerId));
              return (
                <article
                  key={`k-${pitcher.playerId}`}
                  className="brain-market-card"
                  data-favorite={index < 3}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PlayerHeadshot
                        name={pitcher.playerName}
                        playerId={pitcher.playerId}
                        size={48}
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-white">
                          {pitcher.playerName}
                        </h3>
                        <p className="mt-0.5 font-mono text-[10px] uppercase text-white/35">
                          {pitcher.team} vs {pitcher.opponent} · official
                          probable
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="font-mono text-2xl text-vouch-cyan">
                        5+
                      </strong>
                      <span className={`${Z8_LABEL} block text-white/35`}>
                        K target
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {index < 3 && (
                      <span
                        className={`${Z8_LABEL} border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-amber-200`}
                      >
                        Top 3 favorite
                      </span>
                    )}
                    <span
                      className={`${Z8_LABEL} border border-vouch-cyan/25 px-2 py-1 text-vouch-cyan`}
                    >
                      AI: {reviewLabel(review)}
                    </span>
                    {(review?.tags ?? pitcher.reasons ?? [])
                      .slice(0, 2)
                      .map((tag) => (
                        <span
                          key={tag}
                          className={`${Z8_LABEL} border border-white/10 px-2 py-1 text-white/50`}
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    {review?.summary ??
                      pitcher.reasons?.join(" ") ??
                      "Server-authored strikeout decision."}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className={`${Z8_LABEL} text-white/35`}>
                      Brain score {pitcher.score}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      Confidence {pitcher.confidence}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </BrainPageShell>
  );
}
