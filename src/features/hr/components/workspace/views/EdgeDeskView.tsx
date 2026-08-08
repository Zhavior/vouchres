import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  Percent,
  Search,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Zap,
  Info,
  DollarSign,
} from "lucide-react";
import type { HrWatchRow } from "../../../types/hrWatch";
import PlayerHeadshot from "../../../../../components/parlays/PlayerHeadshot";
import { openParlayAdd } from "../../../../../lib/parlays/parlayAddContract";
import { toHrParlayPickerPlayer } from "../../../utils/hrDecisionBrief";
import { logoByTeamName } from "../../../../../lib/teamLogos";
import { PlayerHrTag } from "../../HrHitBadge";
import { oddsDisplay } from "../../../engine/signalScore";

interface Props {
  rows: HrWatchRow[];
}

type EdgeTierFilter = "all" | "prime" | "solid" | "positive";

function calculateEdge(row: HrWatchRow): {
  modelProb: number;
  impliedProb: number;
  evEdge: number;
  oddsLabel: string | null;
} {
  const modelProb = row.hrProbability ?? (row.hrScore ? row.hrScore / 100 * 0.35 : 0.20);
  const impliedProb = row.impliedProbability ?? (row.bookOdds ? (row.bookOdds > 0 ? 100 / (row.bookOdds + 100) : Math.abs(row.bookOdds) / (Math.abs(row.bookOdds) + 100)) : 0.22);
  const evEdge = Math.max(0, (modelProb - impliedProb) * 100);
  // Null when the book hasn't posted a price — the desk shows a dash, never an
  // invented number dressed up as a real market.
  const oddsLabel = oddsDisplay(row);

  return { modelProb, impliedProb, evEdge, oddsLabel };
}

export default function EdgeDeskView({ rows }: Props) {
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

  // Statistics
  const stats = useMemo(() => {
    const positiveEvRows = processedRows.filter((r) => r.evEdge > 0);
    const topEdgeRow = [...processedRows].sort((a, b) => b.evEdge - a.evEdge)[0];
    const avgEdge = positiveEvRows.length
      ? positiveEvRows.reduce((acc, curr) => acc + curr.evEdge, 0) / positiveEvRows.length
      : 0;

    return {
      positiveEvCount: positiveEvRows.length,
      topEdge: topEdgeRow?.evEdge ?? 0,
      topRow: topEdgeRow?.row ?? null,
      avgEdge,
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

        // Tier filter
        if (tierFilter === "prime") return evEdge >= 8;
        if (tierFilter === "solid") return evEdge >= 4 && evEdge < 8;
        if (tierFilter === "positive") return evEdge > 0 && evEdge < 4;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "edge") return b.evEdge - a.evEdge;
        if (sortBy === "score") return b.row.hrScore - a.row.hrScore;
        if (sortBy === "prob") return b.modelProb - a.modelProb;
        if (sortBy === "odds") return (b.row.bookOdds ?? 0) - (a.row.bookOdds ?? 0);
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
      <div className="rounded-3xl border border-dashed border-white/10 bg-black/30 p-12 text-center backdrop-blur-xl">
        <TrendingUp className="mx-auto h-10 w-10 text-vouch-cyan/40" />
        <h3 className="mt-3 text-lg font-bold text-white">No Edge Data Available</h3>
        <p className="mt-1 text-sm text-white/50">
          Waiting for slate odds & probability models to synthesize edge predictions.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* ── Top Header Banner & Stats ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-vouch-cyan/25 bg-gradient-to-r from-vouch-cyan/10 via-black/60 to-emerald-500/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-vouch-cyan/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-vouch-cyan/35 bg-vouch-cyan/10 px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-widest text-vouch-cyan">
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
            <div className="rounded-2xl border border-white/10 bg-black/40 p-2.5 sm:p-4 text-center backdrop-blur-md">
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-white/40 block truncate">+EV Picks</span>
              <div className="mt-1 text-lg sm:text-2xl font-black text-emerald-400">{stats.positiveEvCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-2.5 sm:p-4 text-center backdrop-blur-md">
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-white/40 block truncate">Max EV</span>
              <div className="mt-1 text-lg sm:text-2xl font-black text-vouch-cyan">
                +{stats.topEdge.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-2.5 sm:p-4 text-center backdrop-blur-md">
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-white/40 block truncate">Avg Edge</span>
              <div className="mt-1 text-lg sm:text-2xl font-black text-amber-300">
                +{stats.avgEdge.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Top Highlight Banner if present */}
        {stats.topRow && (
          <div className="relative z-10 mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:flex-row sm:px-6">
            <div className="flex items-center gap-4">
              <PlayerHeadshot
                name={stats.topRow.playerName}
                playerId={stats.topRow.playerId}
                headshotUrl={stats.topRow.headshotUrl}
                size={48}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-400/20 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-emerald-300">
                    Top +EV Edge
                  </span>
                  <span className="text-xs font-semibold text-white/60">
                    {stats.topRow.team} vs {stats.topRow.opponent}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-white">{stats.topRow.playerName}</h4>
                  <PlayerHrTag player={stats.topRow} />
                </div>
                <p className="text-xs text-emerald-200/80">
                  vs {stats.topRow.pitcherName || "Opposing Starter"} • HR Score: <strong className="text-white">{stats.topRow.hrScore}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300/70">Book Odds</span>
                <div className="font-mono text-xl font-extrabold text-white">
                  {stats.topRow.oddsLabel ?? '—'}
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300/70">Calculated Edge</span>
                <div className="font-mono text-xl font-extrabold text-emerald-400">
                  +{stats.topEdge.toFixed(1)}% EV
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAddToSlip(stats.topRow!)}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/20 px-4 py-2.5 font-mono text-xs font-bold text-emerald-300 transition duration-200 hover:bg-emerald-400/30 hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Add Pick
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar & Filters ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search edge candidates by name, team, pitcher..."
            className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-4 font-mono text-xs text-white placeholder-white/40 outline-none transition focus:border-vouch-cyan/50"
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
            <button
              key={tier.id}
              type="button"
              onClick={() => setTierFilter(tier.id)}
              className={[
                "rounded-xl px-3 py-1.5 font-mono text-[11px] font-bold transition-all select-none whitespace-nowrap",
                tierFilter === tier.id
                  ? "border border-vouch-cyan/40 bg-vouch-cyan/15 text-vouch-cyan"
                  : "border border-white/5 bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 font-mono text-xs font-bold text-white outline-none focus:border-vouch-cyan/50"
          >
            <option value="edge">Highest EV Edge</option>
            <option value="score">Highest HR Score</option>
            <option value="prob">Highest Model Prob</option>
            <option value="odds">Longest Book Odds</option>
          </select>
        </div>
      </div>

      {/* ── Candidates Edge Grid ─────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRows.map(({ row, modelProb, impliedProb, evEdge, oddsLabel }, idx) => {
          const isPrime = evEdge >= 8;
          const isPositive = evEdge > 0;
          const logoUrl = row.teamLogoUrl || logoByTeamName(row.team);

          return (
            <div
              key={`${row.stableId}-${idx}`}
              className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-300 p-5 ${
                isPrime
                  ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 via-black/50 to-black/70 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(49,181,131,0.2)]"
                  : isPositive
                  ? "border-vouch-cyan/25 bg-gradient-to-b from-vouch-cyan/10 via-black/50 to-black/70 hover:border-vouch-cyan/50 hover:shadow-[0_0_25px_rgba(79,184,220,0.15)]"
                  : "border-white/10 bg-black/40 hover:border-white/20"
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
                        <PlayerHrTag player={row} />
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
                  {/* Model Probability */}
                  <div>
                    <div className="flex justify-between font-mono text-[10px] font-bold">
                      <span className="text-vouch-cyan uppercase tracking-wider">Model HR Prob</span>
                      <span className="text-white font-extrabold">{(modelProb * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-vouch-cyan to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, modelProb * 100 * 2))}%` }}
                      />
                    </div>
                  </div>

                  {/* Implied Probability */}
                  <div>
                    <div className="flex justify-between font-mono text-[10px] font-bold">
                      <span className="text-white/40 uppercase tracking-wider">Book Implied Prob</span>
                      <span className="text-white/70">{(impliedProb * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white/30 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, impliedProb * 100 * 2))}%` }}
                      />
                    </div>
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
                    <div className="font-mono text-lg font-black">
                      {evEdge > 0 ? `+${evEdge.toFixed(1)}%` : "0.0%"}
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

                <button
                  type="button"
                  onClick={() => handleAddToSlip(row)}
                  className="flex items-center gap-1.5 rounded-xl border border-vouch-cyan/40 bg-vouch-cyan/10 px-3 py-1.5 font-mono text-xs font-bold text-vouch-cyan transition duration-200 hover:border-vouch-cyan hover:bg-vouch-cyan hover:text-black"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Leg
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
