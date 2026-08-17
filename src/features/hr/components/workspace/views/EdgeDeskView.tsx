import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  Search,
  Sparkles,
  ShieldCheck,
  Plus,
} from "lucide-react";
import type { HrWatchRow } from "../../../types/hrWatch";
import type { HrCardResult } from "../../Cards/HrPlayerCard";
import PlayerHeadshot from "../../../../../components/parlays/PlayerHeadshot";
import { openParlayAdd } from "../../../../../lib/parlays/parlayAddContract";
import { toHrParlayPickerPlayer } from "../../../utils/hrDecisionBrief";
import { logoByTeamName } from "../../../../../lib/teamLogos";
import { PlayerHrTag } from "../../HrHitBadge";
import { modelEdgePct, oddsDisplay } from "../../../engine/signalScore";
import {
  AuroraMaxControl,
  AuroraMaxFallback,
  AuroraMaxPanel,
} from "../../../../../components/aurora-max/AuroraMaxPrimitives";

interface Props {
  rows: HrWatchRow[];
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

type EdgeTierFilter = "all" | "prime" | "solid" | "positive";

/** A value only when it is a real, finite number — never a stand-in. */
function realNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Descending sort that always parks unknown values at the end. */
function compareDesc(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

/**
 * Both sides of the edge comparison are nullable on purpose. A missing model
 * probability or a missing market price makes the edge unknowable, and an
 * unknowable edge is rendered as such — the desk never substitutes a literal
 * for a number the pipeline did not supply.
 */
function calculateEdge(row: HrWatchRow): {
  modelProb: number | null;
  impliedProb: number | null;
  evEdge: number | null;
  oddsLabel: string | null;
} {
  const modelProb = realNumber(row.hrProbability);
  const impliedProb = realNumber(row.impliedProbability);
  // Null unless both sides are real numbers. The floor at zero is unchanged
  // behaviour and is addressed separately by HOTFIX-HR-EDGE-002.
  const rawEdge = modelEdgePct(row);
  const evEdge = rawEdge == null ? null : Math.max(0, rawEdge);
  // Null when the book hasn't posted a price — the desk shows a dash, never an
  // invented number dressed up as a real market.
  const oddsLabel = oddsDisplay(row);

  return { modelProb, impliedProb, evEdge, oddsLabel };
}

export default function EdgeDeskView({ rows, getHrResult }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<EdgeTierFilter>("all");
  const [sortBy, setSortBy] = useState<"edge" | "score" | "prob" | "odds">("edge");

  // Calculate edges for all candidates
  const processedRows = useMemo(() => {
    return rows.map((row) => {
      const edgeInfo = calculateEdge(row);
      return {
        row,
        ...edgeInfo,
      };
    });
  }, [rows]);

  // Statistics — priced rows only. A row with no market price contributes
  // nothing to the +EV count, the max, the average, or the top-edge banner.
  const stats = useMemo(() => {
    const pricedRows = processedRows.flatMap((r) =>
      r.evEdge == null ? [] : [{ ...r, evEdge: r.evEdge }]
    );
    const positiveEvRows = pricedRows.filter((r) => r.evEdge > 0);
    const topEdgeEntry = [...pricedRows].sort((a, b) => b.evEdge - a.evEdge)[0] ?? null;
    const avgEdge = positiveEvRows.length
      ? positiveEvRows.reduce((acc, curr) => acc + curr.evEdge, 0) / positiveEvRows.length
      : 0;

    return {
      positiveEvCount: positiveEvRows.length,
      topEdge: topEdgeEntry?.evEdge ?? 0,
      topEntry: topEdgeEntry,
      avgEdge,
      // With nothing priced there is no edge to average or top — the stats read
      // as unknown rather than as a measured zero.
      hasPricedEdge: pricedRows.length > 0,
    };
  }, [processedRows]);

  // Filter and sort candidates
  const filteredRows = useMemo(() => {
    return processedRows
      .filter(({ row, evEdge }) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = row.playerName.toLowerCase().includes(q);
          const matchesTeam = row.team.toLowerCase().includes(q);
          const matchesPitcher = (row.pitcherName ?? "").toLowerCase().includes(q);
          if (!matchesName && !matchesTeam && !matchesPitcher) return false;
        }

        // Tier filter — an unknown edge belongs to no edge tier.
        if (tierFilter === "prime") return evEdge != null && evEdge >= 8;
        if (tierFilter === "solid") return evEdge != null && evEdge >= 4 && evEdge < 8;
        if (tierFilter === "positive") return evEdge != null && evEdge > 0 && evEdge < 4;
        return true;
      })
      .sort((a, b) => {
        // Rows with an unknown value sort last rather than reading as zero.
        if (sortBy === "edge") return compareDesc(a.evEdge, b.evEdge);
        if (sortBy === "score") return b.row.hrScore - a.row.hrScore;
        if (sortBy === "prob") return compareDesc(a.modelProb, b.modelProb);
        if (sortBy === "odds") return compareDesc(a.row.bookOdds ?? null, b.row.bookOdds ?? null);
        return 0;
      });
  }, [processedRows, searchQuery, tierFilter, sortBy]);

  const handleAddToSlip = (row: HrWatchRow) => {
    openParlayAdd({
      player: toHrParlayPickerPlayer(row),
      propHint: {
        id: `hr-edge-${row.stableId}`,
        market: "Home Runs",
        odds: row.bookOdds ?? null,
        spec: `${row.playerName} 1+ Home Run`,
        gamePk: row.gamePk ?? undefined,
        playerId: row.playerId ?? undefined,
      },
      initialFamily: "home_runs",
      isPitcher: false,
      source: "hr_intelligence",
      dataStatus: row.truthStatus === "official" ? "official" : "projected",
      reasoningSnapshot: row.reasons[0] ?? null,
      riskSnapshot: row.warnings[0] ?? null,
    });
  };

  if (rows.length === 0) {
    return (
      <AuroraMaxFallback title="No edge data available" detail="Waiting for real slate prices and model probabilities. No market edge is inferred while either input is missing." />
    );
  }

  return (
    <section className="hr-edge-desk aurora-max-ranked-workspace space-y-4" data-workspace="edge">
      {/* ── Top Header Banner & Stats ────────────────────────────── */}
      <AuroraMaxPanel className="relative overflow-hidden p-4 sm:p-6">

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="aurora-max-eyebrow inline-flex items-center gap-1.5 border px-3 py-1">
                <Sparkles className="h-3 w-3" />
                Vegas Edge Desk
              </span>
              <span className="font-mono text-xs text-white/40">• Real-Time Odds Intelligence</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Model HR Probability vs Sportsbook Implied Odds
            </h1>
            <p className="max-w-2xl text-xs text-white/60 sm:text-sm">
              Discover expected value (+EV) home run bets where our proprietary ML model projects a higher probability than the sportsbook implied odds.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <AuroraMaxPanel className="p-2.5 text-center sm:p-4">
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-white/40 block truncate">+EV Picks</span>
              <div className="mt-1 text-lg sm:text-2xl font-black text-emerald-400">{stats.positiveEvCount}</div>
            </AuroraMaxPanel>
            <AuroraMaxPanel className="p-2.5 text-center sm:p-4">
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-white/40 block truncate">Max EV</span>
              <div className="mt-1 text-lg sm:text-2xl font-black text-vouch-cyan">
                {stats.hasPricedEdge ? `+${stats.topEdge.toFixed(1)}%` : "—"}
              </div>
            </AuroraMaxPanel>
            <AuroraMaxPanel className="p-2.5 text-center sm:p-4">
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-white/40 block truncate">Avg Edge</span>
              <div className="mt-1 text-lg sm:text-2xl font-black text-amber-300">
                {stats.hasPricedEdge ? `+${stats.avgEdge.toFixed(1)}%` : "—"}
              </div>
            </AuroraMaxPanel>
          </div>
        </div>

        {/* Top Highlight Banner if present */}
        {stats.topEntry && (
          <div className="relative z-10 mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:flex-row sm:px-6">
            <div className="flex items-center gap-4">
              <PlayerHeadshot
                name={stats.topEntry.row.playerName}
                playerId={stats.topEntry.row.playerId}
                headshotUrl={stats.topEntry.row.headshotUrl}
                size={48}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-400/20 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-emerald-300">
                    Top +EV Edge
                  </span>
                  <span className="text-xs font-semibold text-white/60">
                    {stats.topEntry.row.team} vs {stats.topEntry.row.opponent}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-white">{stats.topEntry.row.playerName}</h4>
                  <PlayerHrTag
                    player={stats.topEntry.row}
                    hrResult={getHrResult?.(stats.topEntry.row.playerId) ?? null}
                  />
                </div>
                <p className="text-xs text-emerald-200/80">
                  vs {stats.topEntry.row.pitcherName || "Opposing Starter"} • HR Score: <strong className="text-white">{stats.topEntry.row.hrScore}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300/70">Book Odds</span>
                <div className="font-mono text-xl font-extrabold text-white">
                  {stats.topEntry.oddsLabel ?? '—'}
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300/70">Calculated Edge</span>
                <div className="font-mono text-xl font-extrabold text-emerald-400">
                  +{stats.topEdge.toFixed(1)}% EV
                </div>
              </div>
              <AuroraMaxControl
                tone="primary"
                onClick={() => handleAddToSlip(stats.topEntry!.row)}
                className="gap-1.5 px-4 py-2.5"
              >
                <Plus className="h-4 w-4" />
                Add Pick
              </AuroraMaxControl>
            </div>
          </div>
        )}
      </AuroraMaxPanel>

      {/* ── Toolbar & Filters ────────────────────────────────────── */}
      <AuroraMaxPanel className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search edge candidates by name, team, pitcher..."
            className="aurora-max-control w-full justify-start py-2.5 pl-10 pr-4 text-left font-mono text-xs normal-case tracking-normal placeholder:text-white/40"
          />
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              { id: "all", label: "All Candidates" },
              { id: "prime", label: "Prime Edge (+8%+)" },
              { id: "solid", label: "Solid Edge (+4-8%)" },
              { id: "positive", label: "Any +EV (>0%)" },
            ] as const
          ).map((tier) => (
            <AuroraMaxControl
              key={tier.id}
              type="button"
              tone={tierFilter === tier.id ? "primary" : "neutral"}
              aria-pressed={tierFilter === tier.id}
              onClick={() => setTierFilter(tier.id)}
              className="whitespace-nowrap px-3 py-1.5 text-[11px]"
            >
              {tier.label}
            </AuroraMaxControl>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="aurora-max-control px-3 py-1.5 font-mono text-xs font-bold normal-case tracking-normal"
          >
            <option value="edge">Highest EV Edge</option>
            <option value="score">Highest HR Score</option>
            <option value="prob">Highest Model Prob</option>
            <option value="odds">Longest Book Odds</option>
          </select>
        </div>
      </AuroraMaxPanel>

      {/* ── Candidates Edge Grid ─────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRows.map(({ row, modelProb, impliedProb, evEdge, oddsLabel }, idx) => {
          const isPrime = evEdge != null && evEdge >= 8;
          const isPositive = evEdge != null && evEdge > 0;
          const logoUrl = row.teamLogoUrl || logoByTeamName(row.team);

          return (
            <AuroraMaxPanel
              key={row.stableId}
              className={`group relative flex flex-col justify-between p-5 transition-all duration-300 ${
                isPrime
                  ? "border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(49,181,131,0.16)]"
                  : isPositive
                  ? "border-vouch-cyan/30 hover:border-vouch-cyan/55 hover:shadow-[0_0_25px_rgba(0,217,160,0.12)]"
                  : "hover:border-white/20"
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PlayerHeadshot
                      name={row.playerName}
                      playerId={row.playerId}
                      headshotUrl={row.headshotUrl}
                      size={40}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        {logoUrl && (
                          <img src={logoUrl} alt="" className="h-4 w-4 object-contain" />
                        )}
                        <span className="font-mono text-xs font-bold text-white/70">
                          {row.team}
                        </span>
                        <span className="text-white/30">vs</span>
                        <span className="font-mono text-xs font-semibold text-white/50">
                          {row.opponent}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white group-hover:text-vouch-cyan transition-colors">
                          {row.playerName}
                        </h3>
                        <PlayerHrTag player={row} hrResult={getHrResult?.(row.playerId) ?? null} />
                      </div>
                      <p className="text-[11px] text-white/50">
                        vs {row.pitcherName || "Starter TBD"}
                      </p>
                    </div>
                  </div>

                  {/* Book odds badge — omitted entirely when no price is posted. */}
                  {oddsLabel ? (
                    <div className="flex flex-col items-end">
                      <span className="rounded-lg border border-vouch-cyan/30 bg-vouch-cyan/10 px-2.5 py-1 font-mono text-sm font-black text-vouch-cyan">
                        {oddsLabel}
                      </span>
                      <span className="mt-1 font-mono text-[9px] text-white/40 uppercase tracking-widest">
                        Book Odds
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Comparative probability gauges */}
                <div className="mt-5 space-y-3 rounded-xl border border-white/5 bg-black/30 p-3.5">
                  {/* Model Probability — no bar when the model has not priced it. */}
                  <div>
                    <div className="flex justify-between font-mono text-[10px] font-bold">
                      <span className="text-vouch-cyan uppercase tracking-wider">Model HR Prob</span>
                      <span className={modelProb != null ? "text-white font-extrabold" : "text-white/40"}>
                        {modelProb != null ? `${(modelProb * 100).toFixed(1)}%` : "Model probability unavailable"}
                      </span>
                    </div>
                    {modelProb != null && (
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-vouch-cyan to-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, modelProb * 100 * 2))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Implied Probability — omitted entirely when no price is posted. */}
                  <div>
                    <div className="flex justify-between font-mono text-[10px] font-bold">
                      <span className="text-white/40 uppercase tracking-wider">Book Implied Prob</span>
                      <span className="text-white/40">
                        {impliedProb != null ? (
                          <span className="text-white/70">{(impliedProb * 100).toFixed(1)}%</span>
                        ) : (
                          "Market unavailable"
                        )}
                      </span>
                    </div>
                    {impliedProb != null && (
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-white/30 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, impliedProb * 100 * 2))}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Score and Edge Badges */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">HR Score</span>
                    <div className="font-mono text-lg font-black text-white">{row.hrScore}</div>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${
                    isPrime
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : isPositive
                      ? "border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan"
                      : "border-white/5 bg-white/[0.02] text-white/50"
                  }`}>
                    <span className="font-mono text-[9px] uppercase tracking-wider opacity-70">EV Edge</span>
                    <div className={evEdge != null ? "font-mono text-lg font-black" : "font-mono text-[10px] font-bold leading-tight text-white/40"}>
                      {evEdge == null
                        ? "Market unavailable"
                        : evEdge > 0
                        ? `+${evEdge.toFixed(1)}%`
                        : "0.0%"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
                  <ShieldCheck className="h-3.5 w-3.5 text-vouch-cyan" />
                  <span>{row.truthStatus === "official" ? "Official Lineup" : "Projected"}</span>
                </div>

                <AuroraMaxControl
                  tone="primary"
                  onClick={() => handleAddToSlip(row)}
                  className="gap-1.5 px-3 py-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Leg
                </AuroraMaxControl>
              </div>
            </AuroraMaxPanel>
          );
        })}
      </div>
    </section>
  );
}
