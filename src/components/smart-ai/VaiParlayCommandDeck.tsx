import { useEffect, useMemo, useState } from 'react';
import { Flame, Layers, Lock, ShieldAlert, TrendingUp } from 'lucide-react';
import type { RealCandidate } from './smartAiEngine.logic';
import type { VaiPersona } from '../../lib/vai/vaiPersonas';
import {
  buildVaiPersonaPickBundle,
  gradeHrLeg,
  gradeHrParlay,
  type VaiHrParlayPick,
  type VaiHrSinglePick,
  type VaiPickOutcome,
} from '../../lib/vai/vaiParlayBuilder';
import {
  getVaiCalendarDays,
  useVaiParlayHistory,
} from '../../hooks/useVaiParlayHistory';
import { useHrResultsForDate } from '../../features/hr/hooks/useHrResultsForDate';
import { getMlbHeadshotUrl } from '../../lib/parlayDisplay';
import JudgePixelIcon from '../judges/JudgePixelIcon';

interface VaiParlayCommandDeckProps {
  persona: VaiPersona;
  candidates: RealCandidate[];
  loading: boolean;
  usingProjectedPreview?: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const OUTCOME_STYLE: Record<VaiPickOutcome, string> = {
  WON: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  LOST: 'border-rose-400/40 bg-rose-500/10 text-rose-300',
  PENDING: 'border-slate-700 bg-slate-900/80 text-slate-400',
};

function OutcomeBadge({ outcome }: { outcome: VaiPickOutcome }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-black uppercase ${OUTCOME_STYLE[outcome]}`}>
      {outcome === 'WON' ? 'Hit' : outcome === 'LOST' ? 'Miss' : 'Live'}
    </span>
  );
}

function SingleHrCard({
  pick,
  outcome,
  rank,
}: {
  pick: VaiHrSinglePick;
  outcome: VaiPickOutcome;
  rank: number;
}) {
  const headshot = getMlbHeadshotUrl(pick.playerId);
  const hrPct =
    pick.estimatedHrProbability != null
      ? `${Math.round(pick.estimatedHrProbability * (pick.estimatedHrProbability <= 1 ? 100 : 1))}%`
      : '—';

  return (
    <article className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {headshot ? (
            <img src={headshot} alt="" className="h-10 w-10 rounded-xl border border-cyan-300/20 object-cover" loading="lazy" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-[10px] font-black text-slate-500">
              HR
            </div>
          )}
          <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/20 text-[8px] font-black text-amber-200">
            {rank}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-white">{pick.playerName}</span>
            <OutcomeBadge outcome={outcome} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-wide text-slate-500">
            {pick.team} vs {pick.opponent}
          </p>
          <p className="mt-1 text-xs text-slate-300">{pick.customSpec}</p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400 italic">{pick.reason}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-cyan-200">
              Model {hrPct}
            </span>
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-400">
              VE {Math.round(pick.score)}
            </span>
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-400">
              {pick.odds != null ? `${pick.odds.toFixed(2)} dec` : 'Odds TBD'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ParlayCard({
  parlay,
  outcome,
}: {
  parlay: VaiHrParlayPick;
  outcome: VaiPickOutcome;
}) {
  return (
    <article className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-300" />
          <span className="text-xs font-black uppercase tracking-wide text-white">{parlay.label}</span>
          <span className="text-[10px] font-mono text-slate-500">{parlay.legCount}-leg HR</span>
        </div>
        <OutcomeBadge outcome={outcome} />
      </div>
      <ul className="space-y-2">
        {parlay.legs.map((leg) => (
          <li key={`${parlay.id}-${leg.playerId}`} className="rounded-lg border border-slate-800/60 bg-black/20 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold text-slate-200">{leg.playerName}</span>
              <span className="shrink-0 font-mono text-[10px] text-slate-500">{leg.team}</span>
            </div>
            <p className="mt-0.5 text-[9px] leading-relaxed text-slate-500 italic">{leg.reason}</p>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
        <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-2 py-0.5 text-violet-200">
          {parlay.combinedOdds}
        </span>
        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-400">
          Conf {parlay.confidence}%
        </span>
      </div>
    </article>
  );
}

export function VaiParlayCommandDeck({
  persona,
  candidates,
  loading,
  usingProjectedPreview,
}: VaiParlayCommandDeckProps) {
  const date = todayISO();
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
  const hrToday = useHrResultsForDate(date);
  const { calendarStats, grading, overallWinRate, persistBundle } = useVaiParlayHistory(persona.id);

  const bundle = useMemo(
    () => buildVaiPersonaPickBundle(candidates, persona, date),
    [candidates, persona, date],
  );

  useEffect(() => {
    if (!loading && bundle.singles.length > 0) {
      persistBundle(bundle);
    }
  }, [bundle, loading, persistBundle]);

  const hrHitIds = useMemo(() => {
    const set = new Set<number>();
    for (const id of hrToday.hitByPlayerId.keys()) set.add(id);
    return set;
  }, [hrToday.hitByPlayerId]);

  const isToday = date === todayISO();

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-12 text-center">
        <Flame className="mx-auto h-8 w-8 animate-pulse text-amber-400" />
        <p className="mt-3 text-sm font-bold text-slate-400">Building {persona.shortName} HR parlays…</p>
      </div>
    );
  }

  if (bundle.singles.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-12 text-center space-y-2">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-400/80" />
        <p className="text-sm font-bold text-slate-300">No picks available yet.</p>
        <p className="text-xs text-slate-500">
          Validated HR board is empty — lineups may not be posted. Nothing is fabricated to fill this room.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" id="vai-parlay-command-deck">
      <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <JudgePixelIcon code={persona.judgeCode} size="sm" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300 font-mono">
                {persona.judgeCode} · Locked AI Made Parlays
              </p>
              <h3 className="mt-1 text-lg font-black text-white tracking-tight">
                {persona.roomName} — today&apos;s HR desk
              </h3>
              <p className="mt-1 text-xs text-slate-500">{persona.specialtyLine}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-right">
            <span className="block text-[9px] font-mono uppercase text-emerald-300/80">Room win rate</span>
            <span className="text-xl font-mono font-black text-emerald-300">
              {overallWinRate != null ? `${overallWinRate}%` : '—'}
            </span>
          </div>
        </div>

        {usingProjectedPreview && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/5 px-3 py-2 text-[11px] font-semibold text-amber-200/90">
            Official lineup not posted yet — preview candidates only.
          </div>
        )}

        {bundle.warnings.map((w) => (
          <div key={w} className="rounded-2xl border border-amber-300/15 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-200/90">
            {w}
          </div>
        ))}

        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-wider text-slate-500">
            <TrendingUp className="h-3.5 w-3.5" />
            Calendar win rate {grading ? '(grading…)' : ''}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedYmd(null)}
              className={`min-w-[52px] shrink-0 rounded-xl border px-2 py-2 text-center transition ${
                selectedYmd === null
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/70 text-slate-400'
              }`}
            >
              <span className="block text-[8px] font-mono uppercase">All</span>
              <span className="text-sm font-black">★</span>
            </button>
            {getVaiCalendarDays().map((day) => {
              const ymd = getLocalYMD(day);
              const stat = calendarStats[ymd];
              const isSelected = selectedYmd === ymd;
              const isCurrentDay = ymd === date;
              let sub = '—';
              let subColor = 'text-slate-500';
              if (stat?.hasPicks) {
                if (stat.winRate != null) {
                  sub = `${stat.winRate}%`;
                  subColor = stat.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400';
                } else if (stat.pending > 0) {
                  sub = 'Live';
                  subColor = 'text-cyan-400';
                }
              }

              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => setSelectedYmd(ymd)}
                  className={`relative min-w-[58px] shrink-0 rounded-xl border px-2 py-2 text-center transition ${
                    isSelected
                      ? 'border-cyan-400/40 bg-cyan-500/10'
                      : isCurrentDay
                        ? 'border-amber-400/30 bg-amber-500/5'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'
                  }`}
                >
                  <span className="block text-[8px] font-mono uppercase text-slate-500">
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-black text-white">{day.getDate()}</span>
                  <span className={`block text-[8px] font-mono font-bold ${subColor}`}>{sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400" />
          <h4 className="text-sm font-black uppercase tracking-wide text-white">Top 5 HR picks</h4>
        </header>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {bundle.singles.map((pick, i) => (
            <SingleHrCard
              key={pick.id}
              pick={pick}
              rank={i + 1}
              outcome={gradeHrLeg(pick.playerId, hrHitIds, isToday)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-300" />
          <h4 className="text-sm font-black uppercase tracking-wide text-white">4 double parlays</h4>
        </header>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {bundle.doubles.map((parlay) => (
            <ParlayCard
              key={parlay.id}
              parlay={parlay}
              outcome={gradeHrParlay(parlay.legs, hrHitIds, isToday)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-300" />
          <h4 className="text-sm font-black uppercase tracking-wide text-white">2 triple parlays</h4>
        </header>
        <div className="grid gap-2 md:grid-cols-2">
          {bundle.triples.map((parlay) => (
            <ParlayCard
              key={parlay.id}
              parlay={parlay}
              outcome={gradeHrParlay(parlay.legs, hrHitIds, isToday)}
            />
          ))}
        </div>
      </section>

      {bundle.lottery && (
        <section className="space-y-3">
          <header className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-fuchsia-300" />
            <h4 className="text-sm font-black uppercase tracking-wide text-white">Lottery 4-leg parlay</h4>
          </header>
          <ParlayCard
            parlay={bundle.lottery}
            outcome={gradeHrParlay(bundle.lottery.legs, hrHitIds, isToday)}
          />
        </section>
      )}

      <p className="text-[10px] leading-relaxed text-slate-600">
        <Lock className="mr-1 inline h-3 w-3" />
        Graded against real box-score home runs only. Model estimates are not sportsbook prices. Research / entertainment — verify every leg.
      </p>
    </div>
  );
}

export default VaiParlayCommandDeck;
