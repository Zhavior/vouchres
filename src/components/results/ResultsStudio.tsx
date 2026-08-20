import { useState, useMemo } from "react";
import {
  BarChart3, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Parlay, Leg, FeedPost, CreatorProofProfile } from "../../types";
import { ResultsLedgerSummary } from "./ResultsLedgerSummary";
import ResultsPartition from "./ResultsPartition";
import SmartParlaySlipCard from "../parlay/smart/SmartParlaySlipCard";
import { projectSmartParlayFromParlay } from "../../domain/parlay";
import {
  AuroraMaxCommandHeader,
  AuroraMaxControl,
  AuroraMaxEyebrow,
  AuroraMaxFallback,
  AuroraMaxMetricStrip,
  AuroraMaxPanel,
  AuroraMaxRankedWorkspace,
  AuroraMaxTruthBadge,
} from '../aurora-max/AuroraMaxPrimitives';
import {
  buildResultsRecordSummary,
  type ResultsRecordSummary,
} from './resultsRecordModel';
import './results-aurora-max.css';

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
  const ownerName = profile?.displayName || "You";

  // Build all slips from savedParlays
  const allSlips = useMemo(() => {
    const slips = savedParlays.map((p) => ({
      id: p.id,
      title: p.title,
      ownerName,
      ownerType: "user" as const,
      legs: p.legs,
      totalLegs: p.legs.length,
      status: p.status,
      postedAt: p.createdAt,
      resultDate: p.createdAt.slice(0, 10),
      riskTier: p.riskTier,
    }));
    return slips;
  }, [savedParlays, ownerName]);

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

  const stats = useMemo(() => buildResultsRecordSummary(savedParlays), [savedParlays]);

  const monthName = calendarMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <main className="results-aurora-max min-h-screen min-w-0 overflow-x-hidden pb-24 sm:pb-12 font-mono">
      <div className="mx-auto w-full max-w-[1280px] min-w-0 space-y-4 px-3 py-4 sm:px-6 sm:py-5">
        
        {/* Top Command Desk Panel */}
        <AuroraMaxPanel as="section" className="results-command-panel p-4 sm:p-5 border-2 border-white/15 bg-black shadow-2xl" ariaLabelledBy="track-record-title">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                    VOUCHEDGE // TRACK RECORD & AUDIT LEDGER
                  </span>
                  <span className="hidden md:inline px-1.5 py-0.2 border border-white/20 bg-zinc-900 text-[8px] font-black text-zinc-400">
                    STAGE: 04 / DETERMINISTIC PROOF
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  Verified Research Receipts · Cryptographic Proof · Zero Fake Records
                </p>
              </div>
            </div>

            <AuroraMaxTruthBadge state={stats.synced > 0 ? 'confirmed' : 'missing'}>
              {stats.synced > 0 ? `${stats.synced} receipts synced` : 'No synced receipts'}
            </AuroraMaxTruthBadge>
          </div>

          <AuroraMaxCommandHeader
            eyebrow={<span className="inline-flex items-center gap-2 text-cyan-400 font-bold uppercase"><BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Results command desk</span>}
            title={<span id="track-record-title" className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Track Record</span>}
            description="Saved slips and their current recorded states. Backend-synced and local records remain visibly distinct."
          />

          <AuroraMaxMetricStrip
            className="mt-4"
            items={[
              { label: 'Saved slips', value: stats.total, tone: 'neutral' },
              { label: 'Settled', value: stats.settled, tone: 'neutral' },
              { label: 'Win rate', value: stats.winRate === null ? 'Unavailable' : `${stats.winRate}%`, tone: stats.winRate === null ? 'warning' : 'confirmed' },
              { label: 'Backend synced', value: stats.synced, tone: stats.synced > 0 ? 'confirmed' : 'warning' },
            ]}
          />
        </AuroraMaxPanel>

        <div className="grid min-w-0 gap-4 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 lg:col-span-8">
            
            {/* Evidence Calendar Panel */}
            <AuroraMaxPanel as="section" className="results-calendar p-3 sm:p-4 border-2 border-white/15 bg-black shadow-2xl" ariaLabelledBy="saved-activity-title">
              <div className="results-calendar__header border-b border-white/10 pb-3">
                <div className="min-w-0">
                  <AuroraMaxEyebrow>EVIDENCE CALENDAR</AuroraMaxEyebrow>
                  <h2 id="saved-activity-title" className="mt-1 text-base font-black uppercase tracking-wider text-white">Saved activity</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase text-zinc-400">
                    <span className="flex items-center gap-1.5"><span className="results-key results-key--won border border-emerald-400" />Win</span>
                    <span className="flex items-center gap-1.5"><span className="results-key results-key--lost border border-rose-400" />Loss</span>
                    <span className="flex items-center gap-1.5"><span className="results-key results-key--pending border border-cyan-400" />Live/Pending</span>
                  </div>
                </div>
                <div className="results-month-control">
                  <AuroraMaxControl aria-label="Previous month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="!h-9 !w-9 !p-0 border border-white/20 bg-zinc-950 text-zinc-300 hover:border-cyan-400 hover:text-white cursor-pointer">
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </AuroraMaxControl>
                  <span className="min-w-0 text-center text-xs font-black uppercase text-cyan-300 font-mono">{monthName}</span>
                  <AuroraMaxControl aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="!h-9 !w-9 !p-0 border border-white/20 bg-zinc-950 text-zinc-300 hover:border-cyan-400 hover:text-white cursor-pointer">
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </AuroraMaxControl>
                </div>
              </div>

              {allSlips.length === 0 ? (
                <AuroraMaxFallback compact title="No saved activity" detail="Save a decision to begin a traceable track record." />
              ) : (
                <>
                  <div className="results-calendar-grid mb-1 mt-4">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="text-center font-mono text-[9px] font-black uppercase text-zinc-500">{d}</div>
                    ))}
                  </div>
                  <div className="results-calendar-grid">
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
                      const bg = isAllWins  ? "rgba(52,211,153,0.12)"
                               : isAllLoss  ? "rgba(248,113,113,0.12)"
                               : isMixed    ? "rgba(251,191,36,0.10)"
                               : hasSlips   ? "rgba(0,240,255,0.08)"
                               :              "rgba(255,255,255,0.02)";

                      // Border
                      const borderColor = isSelected   ? "#00F0FF"
                                        : isToday      ? "rgba(0,240,255,0.4)"
                                        : isAllWins    ? "rgba(52,211,153,0.4)"
                                        : isAllLoss    ? "rgba(248,113,113,0.4)"
                                        : isMixed      ? "rgba(251,191,36,0.3)"
                                        :                "rgba(255,255,255,0.08)";

                      return (
                        <button
                          key={day.date}
                          onClick={() => hasSlips && setSelectedDate(isSelected ? null : day.date)}
                          className={`results-calendar-day relative flex min-w-0 flex-col items-center justify-between p-1.5 transition-all font-mono ${
                            hasSlips ? "cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,240,255,0.25)]" : "cursor-default opacity-60"
                          } ${isSelected ? "border-2 border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(0,240,255,0.3)]" : ""}`}
                          style={{ background: bg, border: `1px solid ${borderColor}`, minHeight: "56px" }}
                          title={hasSettled ? `${day.wins} won, ${day.losses} lost; saved on ${day.date}` : hasSlips ? `Saved on ${day.date}` : undefined}
                        >
                          {/* Day number */}
                          <span className={`text-[10px] font-mono font-bold leading-none ${
                            hasSlips ? "text-white" : "text-zinc-600"
                          }`}>
                            {day.day}
                          </span>

                          {hasSettled ? (
                            <>
                              {/* Win rate */}
                              <span
                                className="text-[9px] font-black leading-none"
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
                                {day.wins    > 0 && <div className="w-1.5 h-1.5 bg-emerald-400" />}
                                {day.losses  > 0 && <div className="w-1.5 h-1.5 bg-rose-500" />}
                                {day.pending > 0 && <div className="w-1.5 h-1.5 bg-cyan-400" />}
                              </div>
                            </>
                          ) : hasSlips ? (
                            <>
                              <span className="text-[8px] font-black uppercase leading-none text-cyan-400">live</span>
                              <div className="flex gap-[2px] mt-0.5">
                                <div className="w-1.5 h-1.5 bg-cyan-400" />
                              </div>
                            </>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDate && (
                    <div className="mt-3 flex items-center justify-between border border-cyan-400/40 bg-cyan-950/30 p-2 font-mono">
                      <span className="text-[10px] font-black uppercase text-cyan-300">FILTERED DATE: {selectedDate}</span>
                      <button onClick={() => setSelectedDate(null)} className="px-2 py-0.5 border border-white/20 bg-black text-[9px] font-bold uppercase text-zinc-300 hover:border-white hover:text-white cursor-pointer">Clear Filter</button>
                    </div>
                  )}
                </>
              )}
            </AuroraMaxPanel>

            {/* Filter and Search Panel */}
            <AuroraMaxPanel className="results-filter-panel p-3 border-2 border-white/15 bg-black shadow-2xl">
              <div className="relative min-w-0 flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="SEARCH SLIPS BY TITLE OR LEG..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="results-search min-h-10 w-full border-2 border-white/15 bg-black py-2 pl-9 pr-3 font-mono text-xs text-white uppercase placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="results-filter-grid">
                {([
                  { id: "all" as ResultFilter, label: "All" },
                  { id: "wins" as ResultFilter, label: "Wins" },
                  { id: "losses" as ResultFilter, label: "Losses" },
                  { id: "pending" as ResultFilter, label: "Pending" },
                  { id: "voids" as ResultFilter, label: "Void" },
                ]).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`results-filter-control min-h-10 px-3 text-[10px] font-black uppercase transition-colors cursor-pointer ${filter === f.id ? "is-active" : ""}`}
                    data-tone={f.id}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </AuroraMaxPanel>

            {/* Research Receipt Ledger */}
            <AuroraMaxRankedWorkspace
              title="Research receipt ledger"
              subtitle={`${filteredParlays.length} visible of ${allSlips.length} saved slips`}
              className="results-receipt-workspace border-2 border-white/15 bg-black shadow-2xl"
            >
              {filteredParlays.length === 0 ? (
                <EmptyResultsState hasSlips={allSlips.length > 0} />
              ) : (
                <div className="space-y-3">
                  {filteredParlays.map((parlay) => (
                    <ResultSmartSlipCard
                      key={parlay.id}
                      parlay={parlay}
                      ownerName={ownerName}
                    />
                  ))}
                </div>
              )}
            </AuroraMaxRankedWorkspace>
          </div>

          {/* Right Rail Breakdown */}
          <aside className="min-w-0 space-y-4 lg:col-span-4 font-mono">
            <ResultsLedgerSummary summary={stats} />

            <AuroraMaxPanel as="section" className="p-3 sm:p-4 border-2 border-white/15 bg-black shadow-2xl" ariaLabelledBy="record-breakdown-title">
              <AuroraMaxEyebrow>RANKED WORKSPACE</AuroraMaxEyebrow>
              <h2 id="record-breakdown-title" className="mb-3 mt-1 text-base font-black uppercase tracking-wider text-white">Record breakdown</h2>
              <ResultsPartition slips={allSlips} />
              <p className="mt-3 text-[10px] font-bold uppercase leading-relaxed text-zinc-500 border-t border-white/10 pt-2">Grouped by current saved status and leg count.</p>
            </AuroraMaxPanel>

            <div className="border border-white/10 bg-zinc-950 p-3 text-center text-[9px] uppercase leading-relaxed text-zinc-500 font-mono">
              VOUCHEDGE DETERMINISTIC PROTOCOL // AUDIT LEDGER · ZERO FAKE METRICS · RESEARCH & ENTERTAINMENT
            </div>
          </aside>
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

export default ResultsStudio;


/* ============ Empty State ============ */
function EmptyResultsState({ hasSlips }: { hasSlips: boolean }) {
  return <AuroraMaxFallback title={hasSlips ? 'No matching receipts' : 'No saved slips'} detail={hasSlips ? 'Change the active filter or search term to restore receipt rows.' : 'Save a researched decision to begin a traceable track record.'} />;
}
