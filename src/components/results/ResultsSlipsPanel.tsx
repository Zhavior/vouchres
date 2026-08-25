import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Parlay, CreatorProofProfile } from '../../types';
import type { SlateHomeRun } from '../../kernel/contracts/slateResults';
import { ResultsLedgerSummary } from './ResultsLedgerSummary';
import ResultsPartition from './ResultsPartition';
import { buildResultsRecordSummary } from './resultsRecordModel';
import { gradeSlipsForSlate, type GradedSlateLeg } from './slateSlipGrading';

/**
 * My slips — the saved-slip record, on the same desk and in the same visual
 * system as the graded slate.
 *
 * The fusion is the point: a slip's anytime-HR legs are graded here against the
 * exact home runs the desk is already showing for the selected date, so the
 * user's own calls and the tracked cappers' calls are settled by one source.
 * Markets the HR feed cannot settle are labelled, never assumed.
 */

interface Props {
  profile?: CreatorProofProfile;
  savedParlays?: Parlay[];
  /** Home runs on the slate the desk is showing — the grading source. */
  slateHomeRuns?: SlateHomeRun[];
  slateDate: string;
  slateIsToday: boolean;
  /** Selecting a day on the calendar moves the whole desk to that slate. */
  onSelectSlate?: (date: string) => void;
}

type ResultFilter = 'all' | 'wins' | 'losses' | 'pending' | 'voids';

const FILTERS: Array<{ id: ResultFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'wins', label: 'Wins' },
  { id: 'losses', label: 'Losses' },
  { id: 'pending', label: 'Pending' },
  { id: 'voids', label: 'Void' },
];

const STATUS_TONE: Record<string, string> = {
  WON: 'border-ve-emerald/40 text-ve-emerald',
  LOST: 'border-ve-red/40 text-ve-red',
  PENDING: 'border-white/15 text-white/50',
  VOID: 'border-white/10 text-white/30',
};

const VERDICT_LABEL: Record<GradedSlateLeg['verdict'], string> = {
  bang: 'Bang',
  no_go: 'No go',
  live: 'Live',
  ungraded: 'Not settled here',
};

const VERDICT_TONE: Record<GradedSlateLeg['verdict'], string> = {
  bang: 'border-ve-emerald/40 text-ve-emerald',
  no_go: 'border-ve-red/40 text-ve-red',
  live: 'border-white/15 text-white/50',
  ungraded: 'border-white/5 text-white/20',
};

export function ResultsSlipsPanel({
  profile,
  savedParlays = [],
  slateHomeRuns = [],
  slateDate,
  slateIsToday,
  onSelectSlate,
}: Props) {
  const [filter, setFilter] = useState<ResultFilter>('all');
  const [search, setSearch] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(`${slateDate}T12:00:00`));
  const ownerName = profile?.displayName || 'You';

  const stats = useMemo(() => buildResultsRecordSummary(savedParlays), [savedParlays]);

  const filteredParlays = useMemo(() => {
    let result = savedParlays;
    if (filter === 'wins') result = result.filter((slip) => slip.status === 'WON');
    else if (filter === 'losses') result = result.filter((slip) => slip.status === 'LOST');
    else if (filter === 'pending') result = result.filter((slip) => slip.status === 'PENDING');
    else if (filter === 'voids') result = result.filter((slip) => slip.status === 'VOID');

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (slip) =>
          slip.title.toLowerCase().includes(query)
          || slip.legs.some((leg) => leg.selection.toLowerCase().includes(query)),
      );
    }
    return result;
  }, [savedParlays, filter, search]);

  /** Legs graded against the slate the desk is on, keyed by slip. */
  const graded = useMemo(
    () => gradeSlipsForSlate(savedParlays, slateDate, slateHomeRuns, slateIsToday),
    [savedParlays, slateDate, slateHomeRuns, slateIsToday],
  );
  const gradedById = useMemo(
    () => new Map(graded.slips.map((slip) => [slip.id, slip])),
    [graded],
  );

  // Calendar placement uses the saved timestamp. It does not imply a grading date.
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySlips = savedParlays.filter((slip) => slip.createdAt.slice(0, 10) === date);
      const wins = daySlips.filter((slip) => slip.status === 'WON').length;
      const losses = daySlips.filter((slip) => slip.status === 'LOST').length;
      const settled = wins + losses;
      days.push({
        date,
        day,
        slips: daySlips.length,
        wins,
        losses,
        pending: daySlips.filter((slip) => slip.status === 'PENDING').length,
        winRate: settled > 0 ? Math.round((wins / settled) * 100) : -1,
      });
    }
    return days;
  }, [calendarMonth, savedParlays]);

  const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const monthOffset = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="min-w-0 space-y-4 lg:col-span-8">
        {/* Slate tie-in — the record's own line on the day the desk is showing. */}
        <section className="border border-white/5 bg-white/[0.01] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="terminal-text text-ve-emerald">Your calls on this slate</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">
              Graded from the same home-run feed
            </span>
          </div>

          {graded.slips.length === 0 ? (
            <p className="py-8 text-center font-mono text-[10px] uppercase tracking-widest text-white/20">
              No saved slip covers this slate
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-bold italic tracking-tighter ${
                    graded.legTally.hit > 0 ? 'text-ve-emerald' : 'text-white/25'
                  }`}
                >
                  {graded.legTally.hit}/{graded.legTally.total}
                </span>
                <span className="terminal-text">Home-run legs</span>
              </div>

              <div className="mt-4 space-y-3">
                {graded.slips.map((slip) => (
                  <div key={slip.id} className="border border-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-bold italic text-white">{slip.title}</span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-white/25">
                        {slip.hrHits}/{slip.hrLegs} HR legs
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {slip.legs.map((leg) => (
                        <li key={leg.id} className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate font-mono text-[11px] text-white/60">
                            {leg.selection}
                            <span className="ml-2 text-white/20">{leg.market}</span>
                          </span>
                          <span
                            className={`shrink-0 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${VERDICT_TONE[leg.verdict]}`}
                          >
                            {VERDICT_LABEL[leg.verdict]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Evidence calendar */}
        <section className="border border-white/5 bg-white/[0.01] p-5" aria-labelledby="saved-activity-title">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <span className="terminal-text text-ve-emerald">Evidence calendar</span>
              <h2 id="saved-activity-title" className="mt-2 text-lg font-bold italic tracking-tighter text-white">
                Saved activity
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="border border-white/5 p-2 text-white/40 transition-colors hover:border-white/20 hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">{monthName}</span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="border border-white/5 p-2 text-white/40 transition-colors hover:border-white/20 hover:text-white"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {savedParlays.length === 0 ? (
            <p className="py-8 text-center font-mono text-[10px] uppercase tracking-widest text-white/20">
              Save a decision to begin a traceable track record
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                  <div
                    key={`${label}-${index}`}
                    className="text-center font-mono text-[9px] font-bold uppercase text-white/20"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: monthOffset }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {calendarDays.map((day) => {
                  const settled = day.wins + day.losses > 0;
                  const active = day.date === slateDate;
                  const tone = !day.slips
                    ? 'border-white/5 text-white/15'
                    : day.losses === 0 && settled
                      ? 'border-ve-emerald/30 text-white'
                      : day.wins === 0 && settled
                        ? 'border-ve-red/30 text-white'
                        : 'border-white/10 text-white';

                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => onSelectSlate?.(day.date)}
                      aria-pressed={active}
                      title={
                        settled
                          ? `${day.wins} won, ${day.losses} lost; saved on ${day.date}`
                          : day.slips
                            ? `Saved on ${day.date}`
                            : `Grade the ${day.date} slate`
                      }
                      className={`flex min-h-[52px] flex-col items-center justify-between border p-1.5 font-mono transition-colors ${
                        active ? 'border-ve-emerald/60 bg-ve-emerald/[0.06] text-white' : tone
                      } hover:border-white/30`}
                    >
                      <span className="text-[10px] font-bold leading-none">{day.day}</span>
                      {settled ? (
                        <span
                          className={`text-[9px] font-bold leading-none ${
                            day.winRate >= 50 ? 'text-ve-emerald' : 'text-ve-red'
                          }`}
                        >
                          {day.winRate}%
                        </span>
                      ) : day.slips > 0 ? (
                        <span className="text-[8px] font-bold uppercase leading-none text-white/40">Live</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Filter + search */}
        <section className="flex flex-col gap-3 border border-white/5 bg-white/[0.01] p-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" aria-hidden="true" />
            <input
              type="text"
              placeholder="SEARCH SLIPS BY TITLE OR LEG…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search slips"
              className="min-h-10 w-full border border-white/5 bg-black/40 py-2 pl-9 pr-3 font-mono text-[11px] uppercase text-white placeholder-white/20 focus:border-ve-emerald/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={filter === option.id}
                className={`min-h-10 border px-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  filter === option.id
                    ? 'border-ve-emerald/40 bg-ve-emerald/[0.06] text-ve-emerald'
                    : 'border-white/5 text-white/30 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Receipt ledger */}
        <section className="border border-white/5 bg-white/[0.01] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/5 pb-4">
            <span className="terminal-text text-ve-emerald">Research receipt ledger</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">
              {filteredParlays.length} visible of {savedParlays.length} saved
            </span>
          </div>

          {filteredParlays.length === 0 ? (
            <p className="py-10 text-center font-mono text-[10px] uppercase tracking-widest text-white/20">
              {savedParlays.length > 0 ? 'No matching receipts' : 'No saved slips'}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredParlays.map((slip) => {
                const onSlate = gradedById.get(slip.id);
                const savedAt = new Date(slip.createdAt);
                const savedDate = Number.isNaN(savedAt.getTime())
                  ? 'Saved date unavailable'
                  : savedAt.toLocaleDateString();
                const recordState = slip.status === 'PENDING'
                  ? 'Awaiting recorded outcome'
                  : slip.backendSyncState === 'synced' && slip.backendPickId
                    ? 'Backend-synced result'
                    : 'Local result state';

                return (
                  <article key={slip.id} className="border border-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold italic text-white">{slip.title}</h3>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/25">
                          {ownerName} · {slip.legs.length}-leg · {savedDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {onSlate ? (
                          <span className="border border-ve-emerald/25 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-ve-emerald">
                            On this slate · {onSlate.hrHits}/{onSlate.hrLegs}
                          </span>
                        ) : null}
                        <span
                          className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest ${
                            STATUS_TONE[slip.status] ?? STATUS_TONE.VOID
                          }`}
                        >
                          {slip.status}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                      {slip.legs.map((leg) => (
                        <li key={leg.id} className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate font-mono text-[11px] text-white/60">
                            {leg.selection}
                            <span className="ml-2 text-white/20">{leg.market}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-white/30">
                            {leg.odds == null ? 'Odds TBD' : leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-3 border-t border-white/5 pt-3 font-mono text-[9px] uppercase tracking-widest text-white/20">
                      {[
                        slip.oddsValue ? `Odds ${slip.oddsValue > 0 ? `+${slip.oddsValue}` : slip.oddsValue}` : null,
                        slip.riskTier ? `Risk ${slip.riskTier}` : null,
                        recordState,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="min-w-0 space-y-4 lg:col-span-4">
        <ResultsLedgerSummary summary={stats} />

        <section className="border border-white/5 bg-white/[0.01] p-5" aria-labelledby="record-breakdown-title">
          <span className="terminal-text text-ve-emerald">Ranked workspace</span>
          <h2 id="record-breakdown-title" className="mb-4 mt-2 text-lg font-bold italic tracking-tighter text-white">
            Record breakdown
          </h2>
          <ResultsPartition
            slips={savedParlays.map((slip) => ({ status: slip.status, totalLegs: slip.legs.length }))}
          />
          <p className="mt-4 border-t border-white/5 pt-3 font-mono text-[9px] uppercase leading-relaxed tracking-widest text-white/20">
            Grouped by current saved status and leg count
          </p>
        </section>
      </aside>
    </div>
  );
}

export default ResultsSlipsPanel;
