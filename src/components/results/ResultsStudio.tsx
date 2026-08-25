import { useMemo, useState } from 'react';
import { Archive, BarChart3 } from 'lucide-react';
import type { Leg, Parlay, FeedPost, CreatorProofProfile } from '../../types';
import { useSlateResults } from '../../features/hr/hooks/useSlateResults';
import { localISODate } from '../../features/hr/utils/localDate';
import type {
  SlateCapperResult,
  SlateGameResult,
  SlateHomeRun,
  SlateTally,
} from '../../kernel/contracts/slateResults';
import { ResultsSlipsPanel } from './ResultsSlipsPanel';
import { gradeSlipsForSlate } from './slateSlipGrading';

/**
 * Results desk — one MLB slate, graded.
 *
 * Every number on this screen is derived server-side from the real HR
 * play-by-play feed against calls that were recorded before first pitch
 * (server/services/results/slateResultsService.ts). Nothing here computes an
 * outcome, and nothing renders a placeholder in place of one: a tier with no
 * pregame snapshot behind it reads UNKNOWN rather than a fraction.
 *
 * Styled on the V4 landing vocabulary — obsidian bands, sharp borders,
 * `terminal-text` eyebrows, emerald for confirmed and red for missed.
 */

interface Props {
  posts?: FeedPost[];
  profile?: CreatorProofProfile;
  savedParlays?: Parlay[];
  onTailParlay?: (legs: Leg[]) => void;
}

type DeskTab = 'slate' | 'slips';

/** Dates offered on the rail. A slate older than a week is not what this desk is for. */
const RAIL_DAYS = 7;

function railDates(today: string): string[] {
  const base = new Date(`${today}T12:00:00`);
  const out: string[] = [];
  for (let back = RAIL_DAYS - 1; back >= 0; back -= 1) {
    const day = new Date(base);
    day.setDate(base.getDate() - back);
    out.push(
      `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
    );
  }
  return out;
}

function shortDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}`;
}

function longDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function tallyText(tally: SlateTally | null): string {
  return tally ? `${tally.hit}/${tally.total}` : 'UNKNOWN';
}

function tallyTone(tally: SlateTally | null): string {
  if (!tally) return 'text-white/25';
  return tally.hit > 0 ? 'text-ve-emerald' : 'text-white/40';
}

/* ============ Verdict ============ */

function GradeDial({ letter, reason }: { letter: string | null; reason: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-8">
      <div
        className={`flex h-32 w-32 items-center justify-center rounded-full border ${
          letter ? 'border-ve-emerald/40 shadow-[0_0_60px_rgba(49,181,131,0.12)]' : 'border-white/10'
        }`}
      >
        <span
          className={`text-5xl font-bold italic tracking-tighter ${letter ? 'text-ve-emerald' : 'text-white/20'}`}
        >
          {letter ?? '—'}
        </span>
      </div>
      <div className="text-center">
        <span className="terminal-text block">Slate grade</span>
        <p className="mt-2 max-w-[16rem] text-[10px] leading-relaxed text-white/30">{reason}</p>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'confirmed' | 'unknown';
}) {
  const valueTone =
    tone === 'confirmed' ? 'text-ve-emerald' : tone === 'unknown' ? 'text-white/25' : 'text-white';
  // A word ("UNKNOWN") set at the numeral size overruns the cell and collides
  // with its neighbour, so non-numeric values drop to the label scale.
  const numeric = /^[\d/.]+$/.test(value);
  const valueSize = numeric
    ? 'text-3xl font-bold italic tracking-tighter'
    : 'font-mono text-xs font-bold uppercase tracking-widest';
  return (
    <div className="min-w-0 border-l border-white/5 px-4 py-6 first:border-l-0">
      <div className={`${valueSize} ${valueTone}`}>{value}</div>
      <span className="terminal-text mt-2 block">{label}</span>
    </div>
  );
}

/* ============ Per-game grid ============ */

function GameTile({ game }: { game: SlateGameResult }) {
  const produced = game.homeRuns > 0;
  return (
    <div
      className={`border px-3 py-2.5 text-center transition-colors ${
        produced ? 'border-ve-emerald/25 bg-ve-emerald/[0.03]' : 'border-white/5 bg-white/[0.01]'
      }`}
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/70">
        {game.matchup}
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-2 font-mono text-[10px]">
        {game.topPlays || game.zoneFit ? (
          <>
            <span className={tallyTone(game.topPlays)}>{tallyText(game.topPlays)}</span>
            <span className="text-white/15">·</span>
            <span className={tallyTone(game.zoneFit)}>{tallyText(game.zoneFit)}</span>
          </>
        ) : (
          // Ungraded, and the band above already says why. Repeating UNKNOWN
          // thirty times across the grid states nothing the note has not.
          <span className="text-white/15">Ungraded</span>
        )}
      </div>
      <div
        className={`mt-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
          produced ? 'text-ve-emerald' : 'text-white/20'
        }`}
      >
        {game.homeRuns} {game.homeRuns === 1 ? 'Total HR' : 'Total HRs'}
      </div>
    </div>
  );
}

/* ============ Cappers ============ */

function TicketRow({ capper }: { capper: SlateCapperResult }) {
  const ticket = capper.ticket;
  return (
    <div className="flex items-center gap-3 border-b border-white/5 py-3.5 last:border-b-0">
      <span className="w-14 shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-white/40">
        {capper.displayName}
      </span>

      {ticket ? (
        <>
          <img
            src={ticket.headshot}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-sm font-bold italic text-white">
            {ticket.playerName}
            {ticket.teamAbbr ? (
              <span className="ml-2 font-mono text-[10px] font-normal not-italic text-white/30">
                {ticket.teamAbbr}
              </span>
            ) : null}
          </span>
          <span
            className={`shrink-0 border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest ${
              ticket.hit === true
                ? 'border-ve-emerald/40 text-ve-emerald'
                : ticket.hit === false
                  ? 'border-ve-red/40 text-ve-red'
                  : 'border-white/10 text-white/30'
            }`}
          >
            {ticket.hit === true ? 'Bang' : ticket.hit === false ? 'No go' : 'Live'}
          </span>
        </>
      ) : (
        <span className="flex-1 font-mono text-[10px] uppercase tracking-widest text-white/20">
          No pick recorded
        </span>
      )}
    </div>
  );
}

function CapperScoreRow({ capper }: { capper: SlateCapperResult }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-4 last:border-b-0">
      <div className="min-w-0">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/70">
          {capper.displayName}
        </span>
        <span className="ml-2 font-mono text-[10px] text-white/20">@{capper.handle}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-2xl font-bold italic tracking-tighter ${
            capper.correct > 0 ? 'text-ve-emerald' : 'text-white/25'
          }`}
        >
          {capper.correct}
        </span>
        <span className="font-mono text-[10px] text-white/20">/ {capper.picks}</span>
      </div>
    </div>
  );
}

/* ============ Home runs ============ */

function HomeRunRow({ event }: { event: SlateHomeRun }) {
  // Statcast is absent for some parks and some plays; the row shows what MLB
  // published and stays silent about what it did not.
  const velo = event.exitVelocity != null ? `${event.exitVelocity.toFixed(1)} mph` : null;
  const distance = event.distance != null ? `${Math.round(event.distance)} ft` : null;

  return (
    <div className="flex items-center gap-3 border-b border-white/5 py-3 last:border-b-0">
      <img
        src={event.headshot}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover"
      />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold italic text-white">{event.playerName}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/25">
          {event.teamAbbr} · {event.matchup}
        </span>
      </div>
      <span className="shrink-0 text-right font-mono text-[10px] text-white/40">
        {velo && distance ? `${velo} · ${distance}` : (velo ?? distance ?? `Inn ${event.inning}`)}
      </span>
    </div>
  );
}

/* ============ Panels ============ */

function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-white/5 bg-white/[0.01] p-5 ${className}`}>
      <h2 className="terminal-text mb-1 text-ve-emerald">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center font-mono text-[10px] uppercase tracking-widest text-white/20">
      {children}
    </p>
  );
}

/* ============ Desk ============ */

export function ResultsStudio({ profile, savedParlays = [] }: Props) {
  const today = localISODate();
  const dates = useMemo(() => railDates(today), [today]);
  // Yesterday by default: today's slate is still being played, so the graded
  // record a visitor came for is the one that finished.
  const [date, setDate] = useState(() => dates[dates.length - 2] ?? today);
  const [tab, setTab] = useState<DeskTab>('slate');

  const { results, loading, error } = useSlateResults(date);

  // The user's own calls, settled by the same home runs the desk is showing.
  // This is what fuses the parlay system into the record: one slate, one feed,
  // the tracked cappers and the user graded side by side.
  const mySlate = useMemo(
    () => gradeSlipsForSlate(savedParlays, date, results?.homeRuns ?? [], results?.isToday ?? false),
    [savedParlays, date, results],
  );

  return (
    <main className="min-h-screen bg-obsidian-950 pb-24 text-white sm:pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 sm:py-12">
        {/* Masthead */}
        <header className="flex flex-col gap-6 border-b border-white/5 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="terminal-text text-ve-emerald">05 / Slate_Record</span>
            <h1 className="mt-3 text-5xl font-bold italic tracking-tighter sm:text-6xl">Results</h1>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-white/30">
              {longDate(date)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Slate date">
            {dates.map((option) => {
              const active = option === date;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDate(option)}
                  aria-pressed={active}
                  className={`border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    active
                      ? 'border-ve-emerald/50 bg-ve-emerald/10 text-ve-emerald'
                      : 'border-white/5 text-white/30 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  {shortDate(option)}
                </button>
              );
            })}
          </div>
        </header>

        {/* Desk tabs */}
        <nav className="mt-6 flex gap-1" aria-label="Results view">
          {([
            ['slate', 'Slate record', BarChart3],
            ['slips', 'My slips', Archive],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`inline-flex items-center gap-2 border px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                tab === id
                  ? 'border-ve-emerald/40 bg-ve-emerald/[0.06] text-ve-emerald'
                  : 'border-white/5 text-white/30 hover:border-white/20 hover:text-white/60'
              }`}
            >
              <Icon size={12} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {tab === 'slips' ? (
          <div className="mt-8">
            <ResultsSlipsPanel
              profile={profile}
              savedParlays={savedParlays}
              slateHomeRuns={results?.homeRuns ?? []}
              slateDate={date}
              slateIsToday={results?.isToday ?? date === today}
              onSelectSlate={(next) => {
                setDate(next);
                setTab('slate');
              }}
            />
          </div>
        ) : loading && !results ? (
          // One quiet frame for the whole desk. Panels never arrive one at a
          // time — a staggered reveal reads as a broken page, not as progress.
          <div
            className="mt-8 border border-white/5 bg-white/[0.01] py-32 text-center"
            role="status"
            aria-live="polite"
          >
            <span className="terminal-text text-white/25">Grading {shortDate(date)} slate…</span>
          </div>
        ) : error && !results ? (
          <div className="mt-8 border border-ve-red/20 bg-ve-red/[0.03] p-8">
            <span className="terminal-text text-ve-red">Slate unavailable</span>
            <p className="mt-3 text-sm text-white/50">{error}</p>
          </div>
        ) : results ? (
          <div className="mt-8 space-y-4">
            {/* Verdict band */}
            <section className="grid gap-4 border border-white/5 bg-white/[0.01] p-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
              <div className="grid min-w-0 gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
                <GradeDial letter={results.grade.letter} reason={results.grade.reason} />

                <div className="grid min-w-0 grid-cols-3 border-t border-white/5 sm:border-l sm:border-t-0">
                  <MetricCell label="Total slate HRs" value={String(results.totals.slateHomeRuns)} />
                  <MetricCell
                    label="Bangs"
                    value={String(results.totals.bangs)}
                    tone={results.totals.bangs > 0 ? 'confirmed' : 'default'}
                  />
                  <MetricCell
                    label="Correct cappers picks"
                    value={String(results.totals.correctCapperPicks)}
                    tone={results.totals.correctCapperPicks > 0 ? 'confirmed' : 'default'}
                  />
                  <MetricCell
                    label="Cappers ticket"
                    value={tallyText(results.tiers.cappersTicket)}
                    tone={results.tiers.cappersTicket.hit > 0 ? 'confirmed' : 'default'}
                  />
                  <MetricCell
                    label="Top plays"
                    value={tallyText(results.tiers.topPlays)}
                    tone={results.tiers.topPlays ? 'confirmed' : 'unknown'}
                  />
                  <MetricCell
                    label="Zone fit"
                    value={tallyText(results.tiers.zoneFit)}
                    tone={results.tiers.zoneFit ? 'confirmed' : 'unknown'}
                  />
                  <MetricCell
                    label="Your HR legs"
                    value={
                      mySlate.legTally.total > 0
                        ? `${mySlate.legTally.hit}/${mySlate.legTally.total}`
                        : 'No slip'
                    }
                    tone={mySlate.legTally.hit > 0 ? 'confirmed' : mySlate.legTally.total > 0 ? 'default' : 'unknown'}
                  />
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {results.games.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyLine>No games scheduled for this date</EmptyLine>
                  </div>
                ) : (
                  results.games.map((game) => <GameTile game={game} key={game.gamePk} />)
                )}
              </div>
            </section>

            {/* Tier provenance — says out loud what the fractions were graded against. */}
            <p className="px-1 font-mono text-[10px] uppercase tracking-widest text-white/20">
              {results.board.note}
              {results.tiers.topPlays
                ? ' · Top plays = 5 per game by pregame HR score; zone fit = 3 per game by pitcher vulnerability × park.'
                : ''}
            </p>

            {/* Ticket · leaderboard · home runs */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Cappers ticket">
                {results.cappers.length === 0 ? (
                  <EmptyLine>No cappers tracked yet</EmptyLine>
                ) : (
                  results.cappers.map((capper) => <TicketRow capper={capper} key={capper.id} />)
                )}

                {mySlate.slips.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setTab('slips')}
                    className="mt-4 w-full border border-ve-emerald/25 px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ve-emerald transition-colors hover:bg-ve-emerald/[0.06]"
                  >
                    Your ticket · {mySlate.legTally.hit}/{mySlate.legTally.total} HR legs
                  </button>
                ) : null}
              </Panel>

              <Panel title="All cappers results">
                {results.cappers.length === 0 && mySlate.legTally.total === 0 ? (
                  <EmptyLine>No cappers tracked yet</EmptyLine>
                ) : (
                  <>
                    {results.cappers.map((capper) => <CapperScoreRow capper={capper} key={capper.id} />)}
                    {mySlate.legTally.total > 0 ? (
                      <div className="mt-2 flex items-center justify-between border-t border-ve-emerald/20 pt-4">
                        <div className="min-w-0">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-ve-emerald">
                            You
                          </span>
                          <span className="ml-2 font-mono text-[10px] text-white/20">
                            {mySlate.slips.length} {mySlate.slips.length === 1 ? 'slip' : 'slips'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`text-2xl font-bold italic tracking-tighter ${
                              mySlate.legTally.hit > 0 ? 'text-ve-emerald' : 'text-white/25'
                            }`}
                          >
                            {mySlate.legTally.hit}
                          </span>
                          <span className="font-mono text-[10px] text-white/20">/ {mySlate.legTally.total}</span>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </Panel>

              <Panel title="All home runs">
                <div className="max-h-[22rem] overflow-y-auto pr-1">
                  {results.homeRuns.length === 0 ? (
                    <EmptyLine>
                      {results.isToday ? 'No home runs yet today' : 'No home runs on this slate'}
                    </EmptyLine>
                  ) : (
                    results.homeRuns.map((event) => <HomeRunRow event={event} key={event.id} />)
                  )}
                </div>
              </Panel>
            </div>

            {results.warnings.length > 0 ? (
              <ul className="space-y-1 px-1">
                {results.warnings.map((warning) => (
                  <li key={warning} className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                    {warning}
                  </li>
                ))}
              </ul>
            ) : null}

            {results.cappers.length > 0 ? (
              <footer className="border-t border-white/5 pt-8 text-center">
                <span className="terminal-text block text-white/30">Tracked handles</span>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/20">
                  {results.cappers.map((capper) => `@${capper.handle}`).join('  ')}
                </p>
              </footer>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default ResultsStudio;
