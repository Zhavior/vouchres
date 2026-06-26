import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Calendar, CheckCircle2, XCircle, Clock, Lock,
  TrendingUp, Award, Filter, Search, ChevronLeft, ChevronRight,
  Info, Trophy, Flame, Zap,
} from "lucide-react";
import { Parlay, Leg, FeedPost, CreatorProofProfile } from "../../types";
import ResultsLedgerSummary from "./ResultsLedgerSummary";

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

  // Filter slips
  const filteredSlips = useMemo(() => {
    let result = allSlips;
    if (filter === "wins") result = result.filter((s) => s.status === "WON");
    else if (filter === "losses") result = result.filter((s) => s.status === "LOST");
    else if (filter === "pending") result = result.filter((s) => s.status === "PENDING");
    else if (filter === "voids") result = result.filter((s) => s.status === "VOID");
    if (selectedDate) result = result.filter((s) => s.resultDate === selectedDate);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(q) || s.legs.some((l) => l.selection.toLowerCase().includes(q)));
    }
    return result;
  }, [allSlips, filter, selectedDate, search]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{ date: string; day: number; slips: number; wins: number; losses: number; pending: number }> = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const daySlips = allSlips.filter((s) => s.resultDate === dateStr);
      days.push({
        date: dateStr,
        day: d,
        slips: daySlips.length,
        wins: daySlips.filter((s) => s.status === "WON").length,
        losses: daySlips.filter((s) => s.status === "LOST").length,
        pending: daySlips.filter((s) => s.status === "PENDING").length,
      });
    }
    return days;
  }, [calendarMonth, allSlips]);

  // Summary stats
  const stats = useMemo(() => {
    const won = allSlips.filter((s) => s.status === "WON").length;
    const lost = allSlips.filter((s) => s.status === "LOST").length;
    const pending = allSlips.filter((s) => s.status === "PENDING").length;
    const voids = allSlips.filter((s) => s.status === "VOID").length;
    const settled = won + lost;
    const winRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
    return { won, lost, pending, voids, settled, winRate, total: allSlips.length };
  }, [allSlips]);

  // Parlay type breakdown
  const breakdown = useMemo(() => {
    const types = [
      { label: "Singles", test: (s: any) => s.totalLegs === 1 },
      { label: "Doubles", test: (s: any) => s.totalLegs === 2 },
      { label: "Triples", test: (s: any) => s.totalLegs === 3 },
      { label: "4+ Leg", test: (s: any) => s.totalLegs >= 4 },
    ];
    return types.map((t) => {
      const typeSlips = allSlips.filter(t.test);
      const won = typeSlips.filter((s) => s.status === "WON").length;
      const lost = typeSlips.filter((s) => s.status === "LOST").length;
      const settled = won + lost;
      return {
        label: t.label,
        total: typeSlips.length,
        won,
        lost,
        winRate: settled > 0 ? Math.round((won / settled) * 100) : 0,
      };
    });
  }, [allSlips]);

  const monthName = calendarMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen pb-12" style={{ background: "#040810", color: "#e2e8f0" }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(8,12,20,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
              <BarChart3 className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <span className="font-bold text-white text-sm">Results Studio</span>
            <span className="text-[9px] text-slate-600 hidden sm:inline">Proof after final</span>
          </div>
          <span className="text-[9px] text-slate-600 font-mono">{stats.total} slips · {stats.settled} graded</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-12 gap-5">
          {/* LEFT: Calendar + Slip Feed */}
          <div className="lg:col-span-8 space-y-5">
            {/* Summary cards */}
            <ResultsSummaryCards stats={stats} />

            {/* Calendar */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Calendar</div>
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
                      const hasSlips = day.slips > 0;
                      const isAllWins = hasSlips && day.wins > 0 && day.losses === 0;
                      const isAllLosses = hasSlips && day.losses > 0 && day.wins === 0;
                      const isSelected = selectedDate === day.date;
                      const today = new Date().toISOString().slice(0, 10);
                      const isToday = day.date === today;
                      return (
                        <button
                          key={day.date}
                          onClick={() => hasSlips && setSelectedDate(isSelected ? null : day.date)}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative ${
                            isSelected ? "ring-1 ring-cyan-400" : ""
                          } ${hasSlips ? "cursor-pointer" : "cursor-default"}`}
                          style={{
                            background: isAllWins ? "rgba(52,211,153,0.08)" : isAllLosses ? "rgba(248,113,113,0.08)" : hasSlips ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.01)",
                            border: isToday ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          <span className={`text-[10px] font-mono ${hasSlips ? "text-white" : "text-slate-700"}`}>{day.day}</span>
                          {hasSlips && (
                            <div className="flex gap-0.5 mt-0.5">
                              {day.wins > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                              {day.losses > 0 && <div className="w-1 h-1 rounded-full bg-red-400" />}
                              {day.pending > 0 && <div className="w-1 h-1 rounded-full bg-cyan-400" />}
                            </div>
                          )}
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
              {filteredSlips.length === 0 ? (
                <EmptyResultsState hasSlips={allSlips.length > 0} />
              ) : (
                <AnimatePresence>
                  {filteredSlips.map((slip, i) => (
                    <ResultSlipCard key={slip.id} slip={slip} index={i} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* RIGHT: Win Rates + Breakdown */}
          <div className="lg:col-span-4 space-y-5">
            {/* Ledger summary */}
            <ResultsLedgerSummary savedParlays={savedParlays} />

            {/* Parlay type breakdown */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Parlay Breakdown</div>
              {allSlips.length === 0 ? (
                <p className="text-[11px] text-slate-600">No data yet — build and save parlays to see breakdown.</p>
              ) : (
                <div className="space-y-2">
                  {breakdown.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <div className="w-16 text-[11px] text-slate-400 font-mono">{b.label}</div>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${b.winRate}%`, background: b.winRate >= 50 ? "#34d399" : b.winRate > 0 ? "#fbbf24" : "#64748b" }} />
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 w-20 text-right">
                        {b.won}-{b.lost} {b.total > 0 && `(${b.winRate}%)`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

/* ============ Summary Cards ============ */
function ResultsSummaryCards({ stats }: { stats: { won: number; lost: number; pending: number; voids: number; settled: number; winRate: number; total: number } }) {
  const cards = [
    { label: "Total Slips", value: stats.total, icon: BarChart3, color: "#22d3ee" },
    { label: "Wins", value: stats.won, icon: CheckCircle2, color: "#34d399" },
    { label: "Losses", value: stats.lost, icon: XCircle, color: "#f87171" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "#fbbf24" },
    { label: "Win Rate", value: stats.settled > 0 ? `${stats.winRate}%` : "—", icon: TrendingUp, color: "#a78bfa" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.4)", border: `1px solid ${c.color}15` }}>
          <c.icon className="w-3.5 h-3.5 mb-2" style={{ color: c.color }} />
          <div className="text-lg font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
          <div className="text-[8px] text-slate-600 uppercase tracking-widest">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ============ Result Slip Card ============ */
function ResultSlipCard({ slip, index }: { slip: any; index: number }) {
  const statusConfig = {
    WON: { label: "Hit", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)", icon: CheckCircle2 },
    LOST: { label: "Missed", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", icon: XCircle },
    PENDING: { label: "Pending final", color: "#22d3ee", bg: "rgba(34,211,238,0.06)", border: "rgba(34,211,238,0.15)", icon: Clock },
    VOID: { label: "Voided", color: "#94a3b8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)", icon: Info },
  };
  const config = statusConfig[slip.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl p-4"
      style={{ background: config.bg, border: `1px solid ${config.border}`, backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{slip.title}</div>
          <div className="text-[10px] text-slate-500">
            {slip.ownerName} · {slip.totalLegs}-leg · {new Date(slip.postedAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0" style={{ background: config.bg, border: `1px solid ${config.border}` }}>
          <Icon className="w-3 h-3" style={{ color: config.color }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>{config.label}</span>
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-1">
        {slip.legs.map((leg: Leg, i: number) => {
          const legStatus = {
            WON: { color: "#34d399", icon: "✓" },
            LOST: { color: "#f87171", icon: "✗" },
            PENDING: { color: "#22d3ee", icon: "•" },
            VOID: { color: "#94a3b8", icon: "—" },
          };
          const ls = legStatus[leg.status as keyof typeof legStatus] || legStatus.PENDING;
          return (
            <div key={leg.id} className="flex items-center gap-2 p-1.5 rounded-md" style={{ background: "rgba(255,255,255,0.02)" }}>
              <span className="text-[9px] font-mono text-slate-600">{i + 1}.</span>
              <span className="text-xs text-slate-300 flex-1 truncate">{leg.selection}</span>
              <span className="text-[9px] text-slate-500">{leg.game}</span>
              <span className="text-xs font-mono font-bold" style={{ color: ls.color }}>{ls.icon}</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
        {slip.oddsValue && <span className="text-[10px] font-mono text-slate-500">Odds: {slip.oddsValue > 0 ? `+${slip.oddsValue}` : slip.oddsValue}</span>}
        {slip.riskTier && <span className="text-[10px] text-slate-500">Risk: {slip.riskTier}</span>}
        <span className="text-[9px] text-slate-600 ml-auto">Graded after final</span>
      </div>
    </motion.div>
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
