import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "../../lib/motion";
import {
  BarChart3, Calendar, CheckCircle2, XCircle, Lock,
  TrendingUp, Award, Filter, Search, ChevronLeft, ChevronRight,
  Trophy, Flame, Zap,
} from "lucide-react";
import { Parlay, Leg, FeedPost, CreatorProofProfile } from "../../types";
import ResultsLedgerSummary from "./ResultsLedgerSummary";
import ResultsPartition from "./ResultsPartition";
import SmartParlaySlipCard from "../parlay/smart/SmartParlaySlipCard";
import { projectSmartParlayFromParlay } from "../../domain/parlay";

/**
 * ResultsStudio — Premium proof dashboard
 *
 * Desktop: 2-panel (Calendar + Slip Feed | Win Rates + Breakdown)
 * Mobile: Stacked with filter chips + week strip
 *
 * Uses existing savedSlips + posts data. No fake results.
 */

interface Props {
  posts?: FeedPost[];
  profile?: CreatorProofProfile;
  savedParlays?: Parlay[];
  onTailParlay?: (legs: Leg[]) => void;
}

type ResultFilter = "all" | "wins" | "losses" | "pushes" | "voids" | "pending";

export default function ResultsStudio({ posts = [], profile, savedParlays = [], onTailParlay }: Props) {
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Build all slips from savedParlays
  const allSlips = useMemo(() => {
    const slips = savedParlays.map((p) => ({
      id: p.id,
      title: p.title,
      ownerName: profile?.displayName || "You",
      ownerType: "user" as const,
      legs: p.legs,
      totalLegs: p.legs.length,
      status: p.status,
      postedAt: p.createdAt,
      resultDate: p.createdAt.slice(0, 10),
      riskTier: p.riskTier,
      oddsValue: p.oddsValue,
      isDemo: false,
    }));
    return slips;
  }, [savedParlays, profile]);

  const filteredParlays = useMemo(() => {
    let result = savedParlays;
    if (filter === "wins") result = result.filter((s) => s.status === "WON");
    else if (filter === "losses") result = result.filter((s) => s.status === "LOST");
    else if (filter === "pending") result = result.filter((s) => s.status === "PENDING");
    else if (filter === "voids") result = result.filter((s) => s.status === "VOID");
    if (selectedDate) {
      result = result.filter((s) => s.createdAt.slice(0, 10) === selectedDate);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q)
          || s.legs.some((l) => l.selection.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [savedParlays, filter, selectedDate, search]);

  // Calendar data — now includes winRate % and net units per day
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{
      date: string; day: number; slips: number;
      wins: number; losses: number; pending: number;
      winRate: number; units: number;
    }> = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const daySlips = allSlips.filter((s) => s.resultDate === dateStr);
      const wins    = daySlips.filter((s) => s.status === "WON");
      const losses  = daySlips.filter((s) => s.status === "LOST");
      const settled = wins.length + losses.length;
      // Net units: wins return (decimalOdds − 1), losses cost 1 unit each.
      // Falls back to +1 flat when oddsValue is missing or ≤ 1.
      const units = wins.reduce((sum, s) => {
        const dec = Number(s.oddsValue ?? 0);
        return sum + (dec > 1 ? dec - 1 : 1);
      }, 0) - losses.length;
      days.push({
        date: dateStr,
        day: d,
        slips: daySlips.length,
        wins: wins.length,
        losses: losses.length,
        pending: daySlips.filter((s) => s.status === "PENDING").length,
        winRate: settled > 0 ? Math.round((wins.length / settled) * 100) : -1,
        units: Math.round(units * 10) / 10,
      });
    }
    return days;
  }, [calendarMonth, allSlips]);

  // Summary stats — includes net units P&L
  const stats = useMemo(() => {
    const wonSlips  = allSlips.filter((s) => s.status === "WON");
    const lostSlips = allSlips.filter((s) => s.status === "LOST");
    const won     = wonSlips.length;
    const lost    = lostSlips.length;
    const pending = allSlips.filter((s) => s.status === "PENDING").length;
    const voids   = allSlips.filter((s) => s.status === "VOID").length;
    const settled = won + lost;
    const winRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
    const units   = Math.round((
      wonSlips.reduce((sum, s) => {
        const dec = Number(s.oddsValue ?? 0);
        return sum + (dec > 1 ? dec - 1 : 1);
      }, 0) - lost
    ) * 10) / 10;
    return { won, lost, pending, voids, settled, winRate, total: allSlips.length, units };
  }, [allSlips]);

  const monthName = calendarMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen pb-12" style={{ background: "#040810", color: "#e2e8f0" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Premium hero header */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 p-5 shadow-2xl">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
                <BarChart3 className="h-3.5 w-3.5" /> Proof Ledger
              </span>
              <h1 className="text-3xl font-black tracking-tight text-white">Results Studio</h1>
              <p className="mt-1.5 max-w-xl text-sm text-slate-400">
                Every saved slip, graded after final from the official box score. Unverified until settled — no faked records.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Slips',    value: stats.total,                                                         tone: 'text-white' },
                { label: 'Graded',   value: stats.settled,                                                        tone: 'text-cyan-300' },
                { label: 'Win rate', value: stats.settled > 0 ? `${stats.winRate}%` : '—',                       tone: 'text-emerald-300' },
                { label: 'Net units',value: stats.settled > 0 ? `${stats.units >= 0 ? '+' : ''}${stats.units}u` : '—',
                                     tone: stats.units > 0 ? 'text-emerald-300' : stats.units < 0 ? 'text-red-400' : 'text-slate-400' },
              ].map((kpi) => (
                <div key={kpi.label} className="min-w-[72px] rounded-2xl border border-white/[0.06] bg-slate-950/50 px-3 py-2.5 text-center">
                  <div className={`text-xl font-black ${kpi.tone}`}>{kpi.value}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{kpi.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-12 gap-5">
          {/* LEFT: Calendar + Slip Feed */}
          <div className="lg:col-span-8 space-y-5">
            {/* Summary cards */}
            <ResultsSummaryCards stats={stats} />

            {/* Calendar */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Calendar</div>
                  <div className="flex items-center gap-2.5 text-[9px] text-slate-600">
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgba(52,211,153,0.25)",border:"1px solid rgba(52,211,153,0.4)"}} />Win</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgba(248,113,113,0.2)",border:"1px solid rgba(248,113,113,0.35)"}} />Loss</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgba(34,211,238,0.15)",border:"1px solid rgba(34,211,238,0.3)"}} />Pending</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="text-slate-600 hover:text-white p-1">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-white">{monthName}</span>
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="text-slate-600 hover:text-white p-1">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {allSlips.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No graded slips yet.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Post picks before game time to build your proof history.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="text-[8px] text-slate-600 text-center font-mono uppercase">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for first week offset */}
                    {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {calendarDays.map((day) => {
                      const hasSlips   = day.slips > 0;
                      const hasSettled = day.wins + day.losses > 0;
                      const isAllWins  = hasSettled && day.losses === 0;
                      const isAllLoss  = hasSettled && day.wins  === 0;
                      const isMixed    = hasSettled && day.wins > 0 && day.losses > 0;
                      const isSelected = selectedDate === day.date;
                      const today      = new Date().toISOString().slice(0, 10);
                      const isToday    = day.date === today;
                      const unitsPos   = day.units > 0;
                      const unitsNeg   = day.units < 0;

                      // Background tint
                      const bg = isAllWins  ? "rgba(52,211,153,0.09)"
                               : isAllLoss  ? "rgba(248,113,113,0.09)"
                               : isMixed    ? "rgba(251,191,36,0.07)"
                               : hasSlips   ? "rgba(34,211,238,0.05)"
                               :              "rgba(255,255,255,0.01)";

                      // Border
                      const borderColor = isSelected   ? "rgba(34,211,238,0.7)"
                                        : isToday      ? "rgba(34,211,238,0.3)"
                                        : isAllWins    ? "rgba(52,211,153,0.2)"
                                        : isAllLoss    ? "rgba(248,113,113,0.2)"
                                        : isMixed      ? "rgba(251,191,36,0.15)"
                                        :                "rgba(255,255,255,0.03)";

                      return (
                        <button
                          key={day.date}
                          onClick={() => hasSlips && setSelectedDate(isSelected ? null : day.date)}
                          className={`rounded-lg flex flex-col items-center pt-1.5 pb-1 px-0.5 gap-0.5 transition-all relative ${
                            hasSlips ? "cursor-pointer hover:brightness-125" : "cursor-default"
                          } ${isSelected ? "ring-1 ring-cyan-400" : ""}`}
                          style={{ background: bg, border: `1px solid ${borderColor}`, minHeight: "56px" }}
                          title={hasSettled ? `${day.wins}W-${day.losses}L · ${day.winRate}% · ${day.units >= 0 ? "+" : ""}${day.units}u` : undefined}
                        >
                          {/* Day number */}
                          <span className={`text-[10px] font-mono leading-none ${
                            hasSlips ? "text-white" : "text-slate-700"
                          }`}>
                            {day.day}
                          </span>

                          {hasSettled ? (
                            <>
                              {/* Win rate */}
                              <span
                                className="text-[8px] font-extrabold leading-none"
                                style={{
                                  color: isAllWins ? "#34d399"
                                       : isAllLoss ? "#f87171"
                                       : day.winRate >= 50 ? "#fbbf24" : "#f87171",
                                }}
                              >
                                {day.winRate}%
                              </span>

                              {/* Units P&L */}
                              <span
                                className="text-[7.5px] font-bold leading-none rounded px-0.5"
                                style={{
                                  color: unitsPos ? "#34d399" : unitsNeg ? "#f87171" : "#94a3b8",
                                  background: unitsPos ? "rgba(52,211,153,0.12)"
                                            : unitsNeg ? "rgba(248,113,113,0.12)"
                                            :             "rgba(148,163,184,0.08)",
                                }}
                              >
                                {day.units >= 0 ? "+" : ""}{day.units}u
                              </span>

                              {/* Slip count dots */}
                              <div className="flex gap-[2px] mt-0.5">
                                {day.wins    > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                                {day.losses  > 0 && <div className="w-1 h-1 rounded-full bg-red-400" />}
                                {day.pending > 0 && <div className="w-1 h-1 rounded-full bg-cyan-400" />}
                              </div>
                            </>
                          ) : hasSlips ? (
                            // Pending-only days — no settled record yet
                            <>
                              <span className="text-[8px] font-bold leading-none" style={{ color: "#22d3ee" }}>live</span>
                              <div className="flex gap-[2px] mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-cyan-400" />
                              </div>
                            </>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDate && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Filtered to: {selectedDate}</span>
                      <button onClick={() => setSelectedDate(null)} className="text-[10px] text-cyan-400 hover:text-cyan-300">Clear</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[150px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search slips..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {([
                  { id: "all" as ResultFilter, label: "All" },
                  { id: "wins" as ResultFilter, label: "Wins", color: "#34d399" },
                  { id: "losses" as ResultFilter, label: "Losses", color: "#f87171" },
                  { id: "pending" as ResultFilter, label: "Pending", color: "#22d3ee" },
                  { id: "voids" as ResultFilter, label: "Void", color: "#94a3b8" },
                ]).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-md transition-all ${filter === f.id ? "text-slate-950" : "text-slate-500"}`}
                    style={filter === f.id ? { background: f.color || "#22d3ee" } : { background: "rgba(255,255,255,0.03)" }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slip feed */}
            <div className="space-y-3">
              {filteredParlays.length === 0 ? (
                <EmptyResultsState hasSlips={allSlips.length > 0} />
              ) : (
                <AnimatePresence>
                  {filteredParlays.map((parlay, i) => (
                    <ResultSmartSlipCard
                      key={parlay.id}
                      parlay={parlay}
                      index={i}
                      ownerName={profile?.displayName || "You"}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* RIGHT: Win Rates + Breakdown */}
          <div className="lg:col-span-4 space-y-5">
            {/* Ledger summary */}
            <ResultsLedgerSummary savedParlays={savedParlays} />

            {/* Parlay breakdown — result x leg-count, real saved-slip data */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Parlay Breakdown</div>
              <ResultsPartition slips={allSlips} />
              <p className="text-[9px] text-slate-700 mt-3">P/L unavailable — odds/stakes not fully tracked yet.</p>
            </div>

            {/* AI Capper placeholder */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">AI Capper Records</div>
              <div className="text-center py-4">
                <Trophy className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p className="text-[11px] text-slate-600">AI capper records will appear here once picks are graded.</p>
                <p className="text-[9px] text-slate-700 mt-1">Sample size: 0 · Record building</p>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[9px] text-slate-700 text-center px-4">
              VouchEdge is for sports research, social proof, and entertainment. Probability-based. No guarantees. Results are tracked from real saved slips — no faked verified records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


function ResultSmartSlipCard({
  parlay,
  index,
  ownerName,
}: {
  parlay: Parlay;
  index: number;
  ownerName: string;
}) {
  const smartSlip = useMemo(() => projectSmartParlayFromParlay(parlay), [parlay]);
  const metaLine = `${ownerName} · ${parlay.legs.length}-leg · ${new Date(parlay.createdAt).toLocaleDateString()}`;
  const footerParts = [
    parlay.oddsValue ? `Odds: ${parlay.oddsValue > 0 ? `+${parlay.oddsValue}` : parlay.oddsValue}` : null,
    parlay.riskTier ? `Risk: ${parlay.riskTier}` : null,
    "Graded after final",
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <SmartParlaySlipCard
        slip={smartSlip}
        variant="results"
        metaLine={metaLine}
        legVariant="pro"
        maxLegs={99}
        showTrustPanel={false}
        showOsBadges={false}
        footerNote={footerParts.join(" · ")}
        legOdds={Object.fromEntries(parlay.legs.map((leg) => [leg.id, leg.odds]))}
      />
    </motion.div>
  );
}

/* ============ Summary Cards ============ */
function ResultsSummaryCards({ stats }: { stats: { won: number; lost: number; pending: number; voids: number; settled: number; winRate: number; total: number; units: number } }) {
  const unitsColor = stats.units > 0 ? "#34d399" : stats.units < 0 ? "#f87171" : "#64748b";
  const cards = [
    { label: "Total Slips", value: stats.total,                                                                              icon: BarChart3,    color: "#22d3ee" },
    { label: "Wins",        value: stats.won,                                                                                icon: CheckCircle2, color: "#34d399" },
    { label: "Losses",      value: stats.lost,                                                                               icon: XCircle,      color: "#f87171" },
    { label: "Win Rate",    value: stats.settled > 0 ? `${stats.winRate}%` : "—",                                          icon: TrendingUp,   color: "#a78bfa" },
    { label: "Net Units",   value: stats.settled > 0 ? `${stats.units >= 0 ? "+" : ""}${stats.units}u` : "—",             icon: Zap,          color: unitsColor },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.4)", border: `1px solid ${c.color}20` }}>
          <c.icon className="w-3.5 h-3.5 mb-2" style={{ color: c.color }} />
          <div className="text-lg font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
          <div className="text-[8px] text-slate-600 uppercase tracking-widest">{c.label}</div>
        </div>
      ))}
    </div>
  );
}


/* ============ Empty State ============ */
function EmptyResultsState({ hasSlips }: { hasSlips: boolean }) {
  return (
    <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(15,23,42,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <BarChart3 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
      {hasSlips ? (
        <>
          <p className="text-sm text-slate-400 mb-1">No slips match your filters.</p>
          <p className="text-[10px] text-slate-600">Try changing the filter or search term.</p>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-1">No graded slips yet.</p>
          <p className="text-[10px] text-slate-600">Post picks before game time to build your proof history.</p>
        </>
      )}
    </div>
  );
}
