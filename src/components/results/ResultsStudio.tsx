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
    <main className="results-aurora-max min-h-screen min-w-0 overflow-x-hidden pb-24 sm:pb-12">
      <div className="mx-auto w-full max-w-[1240px] min-w-0 space-y-4 px-3 py-4 sm:px-6 sm:py-5">
        <AuroraMaxPanel as="section" className="results-command-panel p-4 sm:p-5" ariaLabelledBy="track-record-title">
          <AuroraMaxCommandHeader
            eyebrow={<span className="inline-flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Results command desk</span>}
            title={<span id="track-record-title">Track Record</span>}
            description="Saved slips and their current recorded states. Backend-synced and local records remain visibly distinct."
            meta={(
              <AuroraMaxTruthBadge state={stats.synced > 0 ? 'confirmed' : 'missing'}>
                {stats.synced > 0 ? `${stats.synced} receipts synced` : 'No synced receipts'}
              </AuroraMaxTruthBadge>
            )}
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
            <AuroraMaxPanel as="section" className="results-calendar p-3 sm:p-4" ariaLabelledBy="saved-activity-title">
              <div className="results-calendar__header">
                <div className="min-w-0">
                  <AuroraMaxEyebrow>Evidence calendar</AuroraMaxEyebrow>
                  <h2 id="saved-activity-title" className="mt-1 text-base font-black text-white">Saved activity</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[9px] text-white/38">
                    <span className="flex items-center gap-1"><span className="results-key results-key--won" />Win</span>
                    <span className="flex items-center gap-1"><span className="results-key results-key--lost" />Loss</span>
                    <span className="flex items-center gap-1"><span className="results-key results-key--pending" />Pending</span>
                  </div>
                </div>
                <div className="results-month-control">
                  <AuroraMaxControl aria-label="Previous month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="!h-11 !w-11 !p-0">
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </AuroraMaxControl>
                  <span className="min-w-0 text-center text-xs font-bold text-white">{monthName}</span>
                  <AuroraMaxControl aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="!h-11 !w-11 !p-0">
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
                      <div key={i} className="text-center font-mono text-[8px] uppercase text-white/28">{d}</div>
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
                      const bg = isAllWins  ? "rgba(52,211,153,0.09)"
                               : isAllLoss  ? "rgba(248,113,113,0.09)"
                               : isMixed    ? "rgba(251,191,36,0.07)"
                               : hasSlips   ? "rgba(0,217,160,0.05)"
                               :              "rgba(255,255,255,0.01)";

                      // Border
                      const borderColor = isSelected   ? "rgba(0,217,160,0.7)"
                                        : isToday      ? "rgba(0,217,160,0.3)"
                                        : isAllWins    ? "rgba(52,211,153,0.2)"
                                        : isAllLoss    ? "rgba(248,113,113,0.2)"
                                        : isMixed      ? "rgba(251,191,36,0.15)"
                                        :                "rgba(255,255,255,0.03)";

                      return (
                        <button
                          key={day.date}
                          onClick={() => hasSlips && setSelectedDate(isSelected ? null : day.date)}
                          className={`results-calendar-day relative flex min-w-0 flex-col items-center gap-0.5 px-0.5 pb-1 pt-1.5 transition-all ${
                            hasSlips ? "cursor-pointer hover:brightness-125" : "cursor-default"
                          } ${isSelected ? "ring-1 ring-emerald-400" : ""}`}
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
                                {day.pending > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                              </div>
                            </>
                          ) : hasSlips ? (
                            // Pending-only days — no settled record yet
                            <>
                              <span className="text-[8px] font-bold leading-none" style={{ color: "#00d9a0" }}>live</span>
                              <div className="flex gap-[2px] mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-400" />
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
                      <AuroraMaxControl onClick={() => setSelectedDate(null)} className="!min-h-9">Clear</AuroraMaxControl>
                    </div>
                  )}
                </>
              )}
            </AuroraMaxPanel>

            <AuroraMaxPanel className="results-filter-panel p-3">
              <div className="relative min-w-0 flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search slips..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="results-search min-h-11 w-full border py-2 pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none"
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
                    className={`results-filter-control min-h-11 px-3 text-[10px] font-bold uppercase transition-colors ${filter === f.id ? "is-active" : ""}`}
                    data-tone={f.id}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </AuroraMaxPanel>

            <AuroraMaxRankedWorkspace
              title="Research receipt ledger"
              subtitle={`${filteredParlays.length} visible of ${allSlips.length} saved slips`}
              className="results-receipt-workspace"
            >
              {filteredParlays.length === 0 ? (
                <EmptyResultsState hasSlips={allSlips.length > 0} />
              ) : (
                <div className="space-y-2.5">
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

          <aside className="min-w-0 space-y-4 lg:col-span-4">
            <ResultsLedgerSummary summary={stats} />

            <AuroraMaxPanel as="section" className="p-3 sm:p-4" ariaLabelledBy="record-breakdown-title">
              <AuroraMaxEyebrow>Ranked workspace</AuroraMaxEyebrow>
              <h2 id="record-breakdown-title" className="mb-3 mt-1 text-base font-black text-white">Record breakdown</h2>
              <ResultsPartition slips={allSlips} />
              <p className="mt-3 text-[10px] leading-5 text-white/35">Grouped by current saved status and leg count.</p>
            </AuroraMaxPanel>

            <p className="border border-white/[0.06] bg-[#071012]/60 px-3 py-2 text-center text-[9px] leading-4 text-white/28">
              VouchEdge is for sports research and entertainment. Local records are not presented as verified. No guarantees.
            </p>
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
