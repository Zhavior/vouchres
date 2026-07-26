import React, { useState, useMemo } from "react";
import {
  BarChart3, Calendar, CheckCircle2, XCircle,
  TrendingUp, Search, ChevronLeft, ChevronRight, Database,
} from "lucide-react";
import { Parlay, Leg, FeedPost, CreatorProofProfile } from "../../types";
import { ResultsLedgerSummary } from "./ResultsLedgerSummary";
import ResultsPartition from "./ResultsPartition";
import SmartParlaySlipCard from "../parlay/smart/SmartParlaySlipCard";
import { projectSmartParlayFromParlay } from "../../domain/parlay";
import {
  AURORA_LABEL,
  AURORA_PAGE,
  AURORA_PANEL,
  AURORA_SURFACE,
} from '../../theme/auroraTokens';
import {
  buildResultsAuroraSummary,
  type ResultsAuroraSummary,
} from './resultsAuroraModel';

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

export function ResultsStudio({ profile, savedParlays = [] }: Props) {
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

  // Calendar placement uses the saved timestamp. It does not imply a grading date.
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{
      date: string; day: number; slips: number;
      wins: number; losses: number; pending: number;
      winRate: number;
    }> = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const daySlips = allSlips.filter((s) => s.resultDate === dateStr);
      const wins    = daySlips.filter((s) => s.status === "WON");
      const losses  = daySlips.filter((s) => s.status === "LOST");
      const settled = wins.length + losses.length;
      days.push({
        date: dateStr,
        day: d,
        slips: daySlips.length,
        wins: wins.length,
        losses: losses.length,
        pending: daySlips.filter((s) => s.status === "PENDING").length,
        winRate: settled > 0 ? Math.round((wins.length / settled) * 100) : -1,
      });
    }
    return days;
  }, [calendarMonth, allSlips]);

  const stats = useMemo(() => buildResultsAuroraSummary(savedParlays), [savedParlays]);

  const monthName = calendarMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <main className={`${AURORA_PAGE} min-h-screen pb-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <section className={`${AURORA_PANEL} p-5`} aria-labelledby="track-record-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={`${AURORA_LABEL} flex items-center gap-2 text-vouch-cyan`}>
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Aurora track record
              </p>
              <h1 id="track-record-title" className="mt-2 text-3xl font-black tracking-tight text-white">Track Record</h1>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/55">
                Saved slips and their current recorded states. Backend-synced and local records stay visibly distinct.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Slips',    value: stats.total,                                                         tone: 'text-white' },
                { label: 'Settled',  value: stats.settled,                                                        tone: 'text-vouch-cyan' },
                { label: 'Win rate', value: stats.winRate === null ? 'Unavailable' : `${stats.winRate}%`,        tone: 'text-vouch-emerald' },
                { label: 'Synced',   value: stats.synced,                                                         tone: 'text-white/70' },
              ].map((kpi) => (
                <div key={kpi.label} className={`${AURORA_SURFACE} min-w-[82px] px-3 py-2.5 text-center`}>
                  <div className={`font-mono text-lg font-black tabular-nums ${kpi.tone}`}>{kpi.value}</div>
                  <div className={`${AURORA_LABEL} mt-1 text-white/35`}>{kpi.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-12 gap-5">
          {/* LEFT: Calendar + Slip Feed */}
          <div className="lg:col-span-8 space-y-5">
            {/* Summary cards */}
            <ResultsSummaryCards stats={stats} />

            <section className={`${AURORA_PANEL} p-4`} aria-labelledby="saved-activity-title">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div id="saved-activity-title" className={`${AURORA_LABEL} text-white/45`}>Saved activity</div>
                  <div className="flex items-center gap-2.5 text-[9px] text-slate-600">
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgba(52,211,153,0.25)",border:"1px solid rgba(52,211,153,0.4)"}} />Win</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgba(248,113,113,0.2)",border:"1px solid rgba(248,113,113,0.35)"}} />Loss</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgba(34,211,238,0.15)",border:"1px solid rgba(34,211,238,0.3)"}} />Pending</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Previous month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="flex h-11 w-11 items-center justify-center text-white/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan/80">
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className="text-xs font-bold text-white">{monthName}</span>
                  <button type="button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="flex h-11 w-11 items-center justify-center text-white/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan/80">
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {allSlips.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-white/50">No saved slips yet.</p>
                  <p className="mt-1 text-[10px] text-white/35">Save a decision to begin a track record.</p>
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
                          title={hasSettled ? `${day.wins} won, ${day.losses} lost; saved on ${day.date}` : hasSlips ? `Saved on ${day.date}` : undefined}
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
                      <button type="button" onClick={() => setSelectedDate(null)} className="min-h-11 px-3 text-[10px] text-vouch-cyan hover:text-white">Clear</button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[150px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search slips..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-h-11 w-full border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-vouch-cyan/80"
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
                    className={`min-h-11 px-3 text-[10px] font-bold uppercase transition-colors ${filter === f.id ? "text-slate-950" : "text-white/45"}`}
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
                <>
                  {filteredParlays.map((parlay) => (
                    <ResultSmartSlipCard
                      key={parlay.id}
                      parlay={parlay}
                      ownerName={profile?.displayName || "You"}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Win Rates + Breakdown */}
          <div className="lg:col-span-4 space-y-5">
            {/* Ledger summary */}
            <ResultsLedgerSummary summary={stats} />

            {/* Parlay breakdown — result x leg-count, real saved-slip data */}
            <section className={`${AURORA_PANEL} p-4`} aria-labelledby="record-breakdown-title">
              <div id="record-breakdown-title" className={`${AURORA_LABEL} mb-3 text-white/45`}>Record breakdown</div>
              <ResultsPartition slips={allSlips} />
              <p className="mt-3 text-[10px] leading-5 text-white/35">Grouped by current saved status and leg count.</p>
            </section>

            {/* Disclaimer */}
            <p className="text-[9px] text-slate-700 text-center px-4">
              VouchEdge is for sports research and entertainment. Local records are not presented as verified. No guarantees.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}


function ResultSmartSlipCard({
  parlay,
  ownerName,
}: {
  parlay: Parlay;
  ownerName: string;
}) {
  const smartSlip = useMemo(() => projectSmartParlayFromParlay(parlay), [parlay]);
  const savedAt = new Date(parlay.createdAt);
  const savedDate = Number.isNaN(savedAt.getTime()) ? 'Saved date unavailable' : savedAt.toLocaleDateString();
  const metaLine = `${ownerName} · ${parlay.legs.length}-leg · ${savedDate}`;
  const recordState = parlay.status === 'PENDING'
    ? 'Awaiting recorded outcome'
    : parlay.backendSyncState === 'synced' && parlay.backendPickId
      ? 'Backend-synced result'
      : 'Local result state';
  const footerParts = [
    parlay.oddsValue ? `Odds: ${parlay.oddsValue > 0 ? `+${parlay.oddsValue}` : parlay.oddsValue}` : null,
    parlay.riskTier ? `Risk: ${parlay.riskTier}` : null,
    recordState,
  ].filter(Boolean);

  return (
    <div>
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
    </div>
  );
}

/* ============ Summary Cards ============ */
function ResultsSummaryCards({ stats }: { stats: ResultsAuroraSummary }) {
  const cards = [
    { label: "Total Slips", value: stats.total,                                                                              icon: BarChart3,    color: "#22d3ee" },
    { label: "Wins",        value: stats.won,                                                                                icon: CheckCircle2, color: "#34d399" },
    { label: "Losses",      value: stats.lost,                                                                               icon: XCircle,      color: "#f87171" },
    { label: "Win Rate",    value: stats.winRate === null ? "Unavailable" : `${stats.winRate}%`,                            icon: TrendingUp,   color: "#a78bfa" },
    { label: "Backend Synced", value: stats.synced,                                                                           icon: Database,     color: "#4FB8DC" },
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

export default ResultsStudio;


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
          <p className="mb-1 text-sm text-white/55">No saved slips yet.</p>
          <p className="text-[10px] text-white/35">Save a decision to begin a track record.</p>
        </>
      )}
    </div>
  );
}
