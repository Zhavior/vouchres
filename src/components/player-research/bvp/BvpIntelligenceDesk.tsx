"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Search } from "lucide-react";
import { getMlbHeadshotUrl, getPlayerInitials, MLB_HEADSHOT_IMG_CLASS, normalizePlayerId } from "../../../lib/mlbHeadshot";
import {
  AuroraMaxControl,
  AuroraMaxEyebrow,
  AuroraMaxFallback,
  AuroraMaxPanel,
  AuroraMaxTruthBadge,
} from "../../aurora-max/AuroraMaxPrimitives";
import { formatPct, formatRate, formatVelo, UNKNOWN } from "../applyEdgeResearch";
import { AURORA_DISPLAY, AURORA_LABEL } from "../../../theme/auroraTokens";
import { usePlayerEdgeResearch } from "../../../pages/pro/usePlayerEdgeResearch";
import { usePitcherResearch } from "../../../pages/pro/usePitcherResearch";
import { safeJsonFetch } from "../../../api/safeApiClient";
import type { MLBPlayer } from "../../../types";
import type { StatcastQuality } from "../../../pages/pro/usePlayerEdgeResearch";
import { buildBvpView } from "./bvpView";
import {
  gameSidesFromToday,
  historyFromEdge,
  liveTruthLabel,
  mergeArsenal,
  playerMatchesBatterTeam,
  rosterBatters,
  rosterPitchers,
  toBatterCard,
  toPitcherCard,
  type TodayGame,
} from "./liveBvp";
import { pitcherWarningCopy } from "./positionGuard";
import type { Batter, HandSplit, Pitcher, PitchStat, VenueSplit } from "./types";
import { BVP_TRUTH_LABEL } from "./types";

function formatFixed(value: number | null | undefined, digits: number): string {
  if (value == null || !Number.isFinite(value)) return UNKNOWN;
  return value.toFixed(digits);
}

function Headshot({ id, name, size }: { id: string; name: string; size: number }) {
  const src = getMlbHeadshotUrl(id, size);
  if (!src) {
    return (
      <div className="pr-bvp-headshot grid place-items-center font-mono text-xs text-[var(--aurora-max-muted)]" aria-hidden="true">
        {getPlayerInitials(name)}
      </div>
    );
  }
  return <img src={src} alt="" className={`pr-bvp-headshot ${MLB_HEADSHOT_IMG_CLASS}`} width={size} height={size} loading="lazy" decoding="async" />;
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="pr-bvp-metric min-w-0">
      <span className={`${AURORA_LABEL} text-[var(--aurora-max-muted)]`}>{label}</span>
      <strong className="block truncate font-mono text-sm text-[var(--aurora-max-paper)]">{value}</strong>
    </div>
  );
}

function BatterMetrics({ batter }: { batter: Batter }) {
  return (
    <AuroraMaxPanel className="p-3">
      <AuroraMaxEyebrow>Batter · hitting</AuroraMaxEyebrow>
      <div className="pr-bvp-metric-grid mt-3">
        <MetricCell label="xSLG" value={formatRate(batter.xSlg)} />
        <MetricCell label="Hard-hit %" value={formatPct(batter.hardHitPct)} />
        <MetricCell label="ISO" value={formatRate(batter.iso)} />
        <MetricCell label="Exit velo" value={formatVelo(batter.exitVelo)} />
      </div>
    </AuroraMaxPanel>
  );
}

function PitcherMetrics({ pitcher }: { pitcher: Pitcher }) {
  return (
    <AuroraMaxPanel className="p-3">
      <AuroraMaxEyebrow>Pitcher · pitching</AuroraMaxEyebrow>
      <div className="pr-bvp-metric-grid mt-3">
        <MetricCell label="ERA" value={formatFixed(pitcher.era, 2)} />
        <MetricCell label="WHIP" value={formatFixed(pitcher.whip, 2)} />
        <MetricCell label="Barrel% allowed" value={formatPct(pitcher.barrelRateAllowed)} />
        <MetricCell label="HR/9" value={formatFixed(pitcher.hr9, 2)} />
        <MetricCell label="HR/9 vs LHB" value={formatFixed(pitcher.hr9VsLhb, 2)} />
        <MetricCell label="HR/9 vs RHB" value={formatFixed(pitcher.hr9VsRhb, 2)} />
      </div>
    </AuroraMaxPanel>
  );
}

function ArsenalRow({ row, expanded }: { row: PitchStat; expanded: boolean }) {
  const width = row.usagePct != null ? Math.max(0, Math.min(100, row.usagePct)) : 0;
  return (
    <div className="pr-bvp-arsenal-row min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-semibold">{row.pitchName}</span>
        <span className="shrink-0 font-mono text-[11px] text-[var(--aurora-max-muted)]">{formatPct(row.usagePct, 0)}</span>
      </div>
      <div className="pr-bvp-bar-track" aria-hidden="true">
        <div className="pr-bvp-bar-fill" style={{ width: `${width}%` }} />
      </div>
      {expanded ? (
        <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] text-[var(--aurora-max-muted)]">
          <span>wOBA vs pitch {formatRate(row.batterWoba)}</span>
          <span>Run value {UNKNOWN}</span>
        </div>
      ) : (
        <p className="mt-1 font-mono text-[11px] text-[var(--aurora-max-muted)]">
          wOBA {formatRate(row.batterWoba)} · RV {UNKNOWN}
        </p>
      )}
    </div>
  );
}

type DeskProps = {
  players: MLBPlayer[];
  statcastByPlayer?: Record<string, StatcastQuality> | null;
};

export function BvpIntelligenceDesk({ players, statcastByPlayer = null }: DeskProps) {
  const [games, setGames] = useState<TodayGame[]>([]);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [gameId, setGameId] = useState("");
  const [batterId, setBatterId] = useState<string | null>(null);
  const [lastBatterId, setLastBatterId] = useState<string | null>(null);
  const [pitcherId, setPitcherId] = useState<string | null>(null);
  const [batterQuery, setBatterQuery] = useState("");
  const [pitcherQuery, setPitcherQuery] = useState("");
  const [handSplit, setHandSplit] = useState<HandSplit>("ALL");
  const [venueSplit, setVenueSplit] = useState<VenueSplit>("ALL");

  useEffect(() => {
    let cancelled = false;
    safeJsonFetch<{ games?: TodayGame[] }>("/api/mlb/games/today", {
      fallbackData: { games: [] },
      timeoutMs: 15000,
    }).then((result) => {
      if (cancelled) return;
      setGames(result.data.games ?? []);
      setGamesError(result.ok ? null : result.error || "Today's games unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const batters = useMemo(() => rosterBatters(players), [players]);
  const pitchers = useMemo(() => rosterPitchers(players), [players]);
  const sides = useMemo(() => gameSidesFromToday(games), [games]);
  const filteredSides = useMemo(() => {
    return sides.filter((side) => {
      if (handSplit === "LHP" && side.pitcherThrows !== "L") return false;
      if (handSplit === "RHP" && side.pitcherThrows !== "R") return false;
      if (venueSplit !== "ALL" && side.venueSplit !== venueSplit) return false;
      return true;
    });
  }, [sides, handSplit, venueSplit]);

  const selectedSide = filteredSides.find((side) => side.id === gameId) ?? null;

  const didAutoSelect = useRef(false);

  useEffect(() => {
    if (didAutoSelect.current) return;
    if (!filteredSides.length || !batters.length) return;
    const first = filteredSides[0];
    const teamBatter = batters.find((row) => playerMatchesBatterTeam(row, first.batterTeamAbbr)) ?? batters[0];
    didAutoSelect.current = true;
    setGameId(first.id);
    setPitcherId(first.pitcherId);
    setBatterId(teamBatter.id);
    setLastBatterId(teamBatter.id);
  }, [filteredSides, batters]);

  const batterRecord = batters.find((row) => row.id === batterId) ?? null;
  const pitcherRecord = pitchers.find((row) => row.id === pitcherId) ?? null;
  const searchedPitcherAsBatter = useMemo(() => {
    if (!batterId) return null;
    return pitchers.find((row) => row.id === batterId) ?? null;
  }, [batterId, pitchers]);

  const batterNumeric = normalizePlayerId(batterId);
  const pitcherNumeric = Number(normalizePlayerId(pitcherId) || 0);
  const edge = usePlayerEdgeResearch(searchedPitcherAsBatter ? null : batterNumeric, {
    pitcherId: pitcherNumeric > 0 ? pitcherNumeric : null,
    gamePk: selectedSide?.gamePk ?? null,
    opponent: selectedSide?.pitcherTeamAbbr ?? null,
  });
  const pitcherFeed = usePitcherResearch(pitcherId);

  const batterChoices = useMemo(() => {
    const q = batterQuery.trim().toLowerCase();
    const rows = q
      ? batters.filter((row) => row.name.toLowerCase().includes(q) || row.team.toLowerCase().includes(q))
      : batters;
    if (!q) return rows;
    const matchedPitchers = pitchers.filter(
      (row) => row.name.toLowerCase().includes(q) || row.team.toLowerCase().includes(q),
    );
    return [...rows, ...matchedPitchers];
  }, [batterQuery, batters, pitchers]);

  const pitcherChoices = useMemo(() => {
    const q = pitcherQuery.trim().toLowerCase();
    const fromRegistry = q
      ? pitchers.filter((row) => row.name.toLowerCase().includes(q) || row.team.toLowerCase().includes(q))
      : pitchers;
    const probable = filteredSides.map((side) => ({
      id: side.pitcherId,
      name: side.pitcherName,
      team: side.pitcherTeamAbbr,
      position: "SP",
      throws: (side.pitcherThrows === "L" ? "L" : "R") as "L" | "R",
    }));
    const seen = new Set(fromRegistry.map((row) => row.id));
    const extra = probable.filter((row) => !seen.has(row.id) && (!q || row.name.toLowerCase().includes(q)));
    return [...fromRegistry, ...extra];
  }, [pitcherQuery, pitchers, filteredSides]);

  const pitcherIdentity = pitcherRecord
    ? {
        id: pitcherRecord.id,
        name: pitcherRecord.name,
        team: pitcherRecord.team,
        position: pitcherRecord.position,
        throws: pitcherRecord.throws,
      }
    : selectedSide && selectedSide.pitcherId === pitcherId
      ? {
          id: selectedSide.pitcherId,
          name: selectedSide.pitcherName,
          team: selectedSide.pitcherTeamAbbr,
          position: "SP",
          throws: (selectedSide.pitcherThrows === "L" ? "L" : "R") as "L" | "R",
        }
      : pitcherChoices.find((row) => row.id === pitcherId)
        ? {
            id: pitcherId as string,
            name: pitcherChoices.find((row) => row.id === pitcherId)!.name,
            team: pitcherChoices.find((row) => row.id === pitcherId)!.team,
            position: "SP" as const,
            throws: pitcherChoices.find((row) => row.id === pitcherId)!.throws,
          }
        : null;

  const batterCard = batterRecord
    ? toBatterCard(batterRecord, statcastByPlayer?.[batterRecord.id], edge.data)
    : null;
  const pitcherCard = pitcherIdentity ? toPitcherCard(pitcherIdentity, pitcherFeed.data) : null;
  const pitcherInBatter = searchedPitcherAsBatter
    ? toPitcherCard(
        {
          id: searchedPitcherAsBatter.id,
          name: searchedPitcherAsBatter.name,
          team: searchedPitcherAsBatter.team,
          position: searchedPitcherAsBatter.position,
          throws: searchedPitcherAsBatter.throws,
        },
        null,
      )
    : null;

  const view = buildBvpView({
    batter: batterCard,
    pitcher: pitcherCard,
    batterSlotPlayer: searchedPitcherAsBatter ?? batterRecord,
    pitcherInBatterSlot: pitcherInBatter,
    handSplit,
    venueSplit,
    selectedVenue: selectedSide?.venueSplit ?? null,
  });

  const history = historyFromEdge(edge.data);
  const arsenal = mergeArsenal(pitcherFeed.data?.pitchMix ?? [], edge.data?.pitchMix ?? []);
  const warnings = [...(edge.data?.warnings ?? []), ...(pitcherFeed.data?.warnings ?? [])];
  const truthLabel = liveTruthLabel(warnings);
  const ops = history.ops;
  const opsRing = ops != null && Number.isFinite(ops) ? Math.max(0, Math.min(100, ops * 100)) : null;

  const selectGame = (id: string) => {
    const side = filteredSides.find((row) => row.id === id);
    setGameId(id);
    if (!side) return;
    setPitcherId(side.pitcherId);
    const teamBatter = batters.find((row) => playerMatchesBatterTeam(row, side.batterTeamAbbr));
    if (teamBatter) {
      setBatterId(teamBatter.id);
      setLastBatterId(teamBatter.id);
    }
    setBatterQuery("");
    setPitcherQuery("");
  };

  const switchPitcherToSlot = (player: Pitcher) => {
    const restored = batters.find((row) => row.id === lastBatterId) ?? batters[0];
    setPitcherId(player.id);
    setBatterId(restored?.id ?? null);
    setBatterQuery("");
    setGameId("");
  };

  const ready = view.kind === "ready";
  const batter = ready ? view.batter : null;
  const pitcher = ready ? view.pitcher : null;
  const loading = edge.loading || pitcherFeed.loading;

  return (
    <section className="pr-bvp-desk flex min-w-0 flex-col gap-3" aria-labelledby="pr-bvp-title">
      <AuroraMaxPanel className="flex flex-col gap-3 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <AuroraMaxEyebrow>Batter vs Pitcher</AuroraMaxEyebrow>
            <h2 id="pr-bvp-title" className={`${AURORA_DISPLAY} text-lg text-[var(--aurora-max-paper)]`}>
              Matchup intelligence
            </h2>
          </div>
          <AuroraMaxTruthBadge state={loading ? "projected" : gamesError || edge.error || pitcherFeed.error ? "warning" : "live"}>
            {loading ? "Loading MLB feeds" : gamesError || edge.error || pitcherFeed.error || BVP_TRUTH_LABEL}
          </AuroraMaxTruthBadge>
        </div>

        <div className="pr-bvp-selector-grid">
          <label className="pr-bvp-field min-w-0">
            <span className={AURORA_LABEL}>Game</span>
            <select
              value={gameId}
              onChange={(event) => selectGame(event.target.value)}
              className="pr-max-search rounded-md px-3 py-2 text-xs"
            >
              <option value="">Today&apos;s probable SPs</option>
              {filteredSides.map((row) => (
                <option key={row.id} value={row.id}>{row.gameLabel}</option>
              ))}
            </select>
          </label>

          <label className="pr-bvp-field min-w-0">
            <span className={AURORA_LABEL}>Batter</span>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--aurora-max-muted)]" />
              <input
                type="search"
                value={batterQuery}
                onChange={(event) => setBatterQuery(event.target.value)}
                placeholder="Search batter"
                className="pr-max-search rounded-md py-2 pl-8 pr-2 text-xs"
              />
            </div>
            <select
              value={batterId ?? ""}
              onChange={(event) => {
                const nextId = event.target.value || null;
                setBatterId(nextId);
                setGameId("");
                if (nextId && batters.some((row) => row.id === nextId)) setLastBatterId(nextId);
              }}
              className="pr-max-search rounded-md px-3 py-2 text-xs"
              aria-label="Batter roster"
            >
              <option value="">No batter</option>
              {batterChoices.map((row) => (
                <option key={`b-${row.id}`} value={row.id}>
                  {row.name} · {row.team} · {row.position}
                </option>
              ))}
            </select>
          </label>

          <label className="pr-bvp-field min-w-0">
            <span className={AURORA_LABEL}>Pitcher</span>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--aurora-max-muted)]" />
              <input
                type="search"
                value={pitcherQuery}
                onChange={(event) => setPitcherQuery(event.target.value)}
                placeholder="Search pitcher"
                className="pr-max-search rounded-md py-2 pl-8 pr-2 text-xs"
              />
            </div>
            <select
              value={pitcherId ?? ""}
              onChange={(event) => {
                setPitcherId(event.target.value || null);
                setGameId("");
              }}
              className="pr-max-search rounded-md px-3 py-2 text-xs"
              aria-label="Pitcher roster"
            >
              <option value="">No pitcher</option>
              {pitcherChoices.map((row) => (
                <option key={`p-${row.id}`} value={row.id}>
                  {row.name} · {row.team} · {row.throws}HP
                </option>
              ))}
            </select>
          </label>

          <div className="pr-bvp-field min-w-0">
            <span className={AURORA_LABEL}>Splits</span>
            <div className="flex flex-wrap gap-1">
              {(["ALL", "LHP", "RHP"] as const).map((split) => (
                <AuroraMaxControl
                  key={split}
                  tone={handSplit === split ? "primary" : "neutral"}
                  aria-pressed={handSplit === split}
                  className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => setHandSplit(split)}
                >
                  {split === "ALL" ? "Any hand" : split}
                </AuroraMaxControl>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(["ALL", "home", "away"] as const).map((split) => (
                <AuroraMaxControl
                  key={split}
                  tone={venueSplit === split ? "primary" : "neutral"}
                  aria-pressed={venueSplit === split}
                  className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => setVenueSplit(split)}
                >
                  {split === "ALL" ? "Home/Away" : split === "home" ? "Home" : "Away"}
                </AuroraMaxControl>
              ))}
            </div>
          </div>
        </div>
      </AuroraMaxPanel>

      {view.kind === "pitcher_in_batter" ? (
        <AuroraMaxPanel className="flex flex-col gap-3 p-4" role="alert">
          <div className="flex items-start gap-2 text-[var(--aurora-max-paper)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vouch-amber" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{pitcherWarningCopy()}</p>
              <p className="mt-1 text-xs text-[var(--aurora-max-muted)]">
                {view.player.name} is {view.player.position}. Pitching metrics stay on the pitcher card.
              </p>
            </div>
          </div>
          <AuroraMaxControl tone="primary" className="self-start px-3 py-1.5 text-[11px]" onClick={() => switchPitcherToSlot(view.player)}>
            Move to pitcher slot
          </AuroraMaxControl>
          <PitcherMetrics pitcher={view.player} />
        </AuroraMaxPanel>
      ) : null}

      {view.kind === "unknown_batter" ? (
        <AuroraMaxFallback title="No batter profile" detail="The batter slot is empty or unclassified. Pick a position player." />
      ) : null}

      {view.kind === "empty" ? (
        <AuroraMaxFallback
          title="No matchup for these filters"
          detail={gamesError || "Choose a probable SP from today's slate, or clear LHP/RHP and Home/Away splits."}
        />
      ) : null}

      {ready && batter && pitcher ? (
        <>
          <AuroraMaxPanel className="pr-bvp-hero p-3">
            <div className="pr-bvp-hero-grid">
              <div className="pr-bvp-hero-batter flex min-w-0 items-center gap-3">
                <Headshot id={batter.id} name={batter.name} size={72} />
                <div className="min-w-0">
                  <AuroraMaxEyebrow>Batter</AuroraMaxEyebrow>
                  <p className="truncate text-sm font-bold">{batter.name}</p>
                  <p className="truncate text-[11px] text-[var(--aurora-max-muted)]">
                    {batter.team} · {batter.position} · B {batter.bats}
                  </p>
                </div>
              </div>

              <div className="pr-bvp-score flex flex-col items-center justify-center">
                <div
                  className={`pr-bvp-score-ring${opsRing == null ? " is-empty" : ""}`}
                  style={opsRing != null ? { ["--pr-bvp-score" as string]: String(opsRing) } : undefined}
                  aria-label={ops == null ? "Career BvP OPS unavailable" : `Career BvP OPS ${formatRate(ops)}`}
                >
                  <span className="font-mono text-xl font-black tabular-nums">{formatRate(ops)}</span>
                </div>
                <p className={`${AURORA_LABEL} mt-1 text-center text-[var(--aurora-max-muted)]`}>Career BvP OPS</p>
              </div>

              <div className="pr-bvp-hero-pitcher flex min-w-0 items-center gap-3">
                <Headshot id={pitcher.id} name={pitcher.name} size={72} />
                <div className="min-w-0">
                  <AuroraMaxEyebrow>Pitcher</AuroraMaxEyebrow>
                  <p className="truncate text-sm font-bold">{pitcher.name}</p>
                  <p className="truncate text-[11px] text-[var(--aurora-max-muted)]">
                    {pitcher.team} · {pitcher.position} · T {pitcher.throws}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[var(--aurora-max-muted)]">
              {selectedSide?.gameLabel ?? "Custom pair"} · {truthLabel}
            </p>
          </AuroraMaxPanel>

          <div className="pr-bvp-cards-grid">
            <BatterMetrics batter={batter} />
            <PitcherMetrics pitcher={pitcher} />
          </div>

          <AuroraMaxPanel className="p-3">
            <AuroraMaxEyebrow>Pitch arsenal</AuroraMaxEyebrow>
            <p className="mt-1 text-[11px] text-[var(--aurora-max-muted)]">
              Usage is this pitcher&apos;s Savant arsenal. wOBA is this batter vs that pitch type (season). Run value is UNKNOWN — not on the arsenal feed.
            </p>
            {arsenal.length ? (
              <>
                <div className="mt-3 hidden flex-col gap-3 sm:flex">
                  {arsenal.map((row) => (
                    <ArsenalRow key={row.pitchType} row={row} expanded={false} />
                  ))}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:hidden">
                  {arsenal.map((row) => (
                    <details key={row.pitchType} className="pr-bvp-drawer">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 text-xs font-semibold">
                        <span className="min-w-0 truncate">{row.pitchName}</span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--aurora-max-muted)]">
                          {formatPct(row.usagePct, 0)}
                          <ChevronDown className="h-3 w-3" aria-hidden="true" />
                        </span>
                      </summary>
                      <ArsenalRow row={row} expanded />
                    </details>
                  ))}
                </div>
              </>
            ) : (
              <AuroraMaxFallback compact title="Pitch mix unavailable" detail="No Savant pitch-type rows for this pitcher." />
            )}
          </AuroraMaxPanel>

          <AuroraMaxPanel className="p-3">
            <AuroraMaxEyebrow>Historical BvP</AuroraMaxEyebrow>
            <p className="mt-1 text-[11px] text-[var(--aurora-max-muted)]">
              Career vsPlayerTotal from MLB Stats API. Hard-hit rate is UNKNOWN on that feed. BB/(AB+BB) is derived from AB and BB.
            </p>
            <div className="pr-bvp-history-grid mt-3">
              <MetricCell label="AB" value={history.atBats == null ? UNKNOWN : String(history.atBats)} />
              <MetricCell label="Hits" value={history.hits == null ? UNKNOWN : String(history.hits)} />
              <MetricCell label="HR" value={history.homeRuns == null ? UNKNOWN : String(history.homeRuns)} />
              <MetricCell label="K" value={history.strikeouts == null ? UNKNOWN : String(history.strikeouts)} />
              <MetricCell label="BB/(AB+BB)" value={formatPct(history.walkRate)} />
              <MetricCell label="Hard-hit (BvP)" value={formatPct(history.hardHitRate)} />
              <MetricCell label="BA" value={formatRate(history.battingAverage)} />
              <MetricCell label="OPS" value={formatRate(history.ops)} />
            </div>
          </AuroraMaxPanel>
        </>
      ) : null}
    </section>
  );
}
