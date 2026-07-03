import { useMemo, useState, type ReactNode } from 'react';
import { Search, FlaskConical, Plus, Microscope, ShieldAlert, History } from 'lucide-react';
import type { RealCandidate, CandidateScoreBreakdown } from './smartAiEngine.logic';
import { getMlbHeadshotUrl } from '../../lib/parlayDisplay';
import { safeJsonFetch } from '../../api/safeApiClient';

/**
 * Deep Research Board — real candidates only.
 *
 * Every value rendered here comes from the validated HR board pipeline
 * (real MLB season stats, probable pitchers, sourced park factors).
 * Missing data renders as an explicit "TBD/Missing" chip — never invented.
 * Model probability is labeled as a model estimate, never as sportsbook odds.
 */

interface SmartAiDeepResearchPanelProps {
  candidates: RealCandidate[];
  loading: boolean;
  onAddToSlip?: (candidate: RealCandidate) => void;
  onOpenResearch?: (candidate: RealCandidate) => void;
}

type SortKey = 'score' | 'confidence' | 'form' | 'park';

/** Real career batter-vs-pitcher line from /api/mlb/matchup-matrix (MLB vsPlayerTotal). */
type MatchupBatter = {
  id: number;
  name: string;
  recentForm: { games: number; hr: number; hits: number; atBats: number; strikeOuts: number } | null;
  vsPitcher: {
    ab: number;
    h: number;
    hr: number;
    avgText: string | null;
    slgText: string | null;
    opsText: string | null;
  } | null;
  tags: string[];
};

type MatchupState = 'loading' | 'error' | MatchupBatter[];

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: 'score', label: 'Board Score' },
  { id: 'confidence', label: 'Data Confidence' },
  { id: 'form', label: 'Recent Form' },
  { id: 'park', label: 'Park Context' },
];

const SIGNAL_LABELS: Array<{ key: keyof CandidateScoreBreakdown; label: string }> = [
  { key: 'hitterPower', label: 'Power' },
  { key: 'pitcherVulnerability', label: 'Pitcher Vuln' },
  { key: 'parkContext', label: 'Park' },
  { key: 'handednessEdge', label: 'Hand Edge' },
  { key: 'recentForm', label: 'Form' },
  { key: 'lineupVolume', label: 'Lineup Vol' },
];

const TIER_STYLES: Record<string, string> = {
  elite: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
  strong: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200',
  watchlist: 'border-sky-300/25 bg-sky-400/10 text-sky-200',
  thin: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  avoid: 'border-rose-300/25 bg-rose-400/10 text-rose-200',
};

function sortValue(candidate: RealCandidate, key: SortKey): number {
  if (key === 'confidence') return candidate.dataConfidence ?? -1;
  if (key === 'form') return candidate.scoreBreakdown?.recentForm ?? -1;
  if (key === 'park') return candidate.scoreBreakdown?.parkContext ?? -1;
  return candidate.score ?? -1;
}

function SignalBars({ breakdown, maxima }: { breakdown: CandidateScoreBreakdown; maxima: CandidateScoreBreakdown }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
      {SIGNAL_LABELS.map(({ key, label }) => {
        const value = breakdown[key] ?? 0;
        const max = Math.max(1, maxima[key] ?? 1);
        const width = Math.max(4, Math.min(100, Math.round((value / max) * 100)));
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.14em]">
              <span className="text-slate-500">{label}</span>
              <span className="font-black text-slate-300">{Math.round(value)}</span>
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-slate-800/80">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-cyan-400/70 to-emerald-400/70"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContextChip({ label, value, missing }: { label: string; value: string; missing?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-wide ${
        missing
          ? 'border-amber-300/20 bg-amber-400/5 text-amber-300/90'
          : 'border-slate-700 bg-slate-950/70 text-slate-300'
      }`}
    >
      <span className="text-slate-500 normal-case">{label}</span>
      {value}
    </span>
  );
}

export function SmartAiDeepResearchPanel({
  candidates,
  loading,
  onAddToSlip,
  onOpenResearch,
}: SmartAiDeepResearchPanelProps) {
  const [query, setQuery] = useState('');
  const [lineupFilter, setLineupFilter] = useState<'all' | 'confirmed' | 'projected'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');

  // Matchup history cache keyed by `${gamePk}:${pitcherId}` — one fetch covers
  // every candidate facing that pitcher. `revealed` controls which cards show it.
  const [matchups, setMatchups] = useState<Record<string, MatchupState>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const loadMatchup = (candidate: RealCandidate) => {
    if (!candidate.opponentPitcherId) return;
    const cardKey = `${candidate.playerId}:${candidate.gamePk}`;
    const fetchKey = `${candidate.gamePk}:${candidate.opponentPitcherId}`;
    setRevealed((prev) => ({ ...prev, [cardKey]: true }));

    const existing = matchups[fetchKey];
    if (existing && existing !== 'error') return; // loaded or in flight

    setMatchups((prev) => ({ ...prev, [fetchKey]: 'loading' }));
    safeJsonFetch<any>(
      `/api/mlb/matchup-matrix/${candidate.gamePk}/pitcher/${candidate.opponentPitcherId}`,
      { fallbackData: null, timeoutMs: 12000 }
    ).then((r) => {
      const lineup = r.data?.opponent?.projectedLineup;
      setMatchups((prev) => ({
        ...prev,
        [fetchKey]: Array.isArray(lineup) ? (lineup as MatchupBatter[]) : 'error',
      }));
    });
  };

  const filtered = useMemo(() => {
    let result = candidates;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          c.playerName.toLowerCase().includes(q) ||
          c.team.toLowerCase().includes(q) ||
          c.opponent.toLowerCase().includes(q) ||
          (c.opponentPitcherName ?? '').toLowerCase().includes(q)
      );
    }

    if (lineupFilter === 'confirmed') {
      result = result.filter((c) => String(c.lineupStatus ?? '').toLowerCase() === 'confirmed');
    } else if (lineupFilter === 'projected') {
      result = result.filter((c) => String(c.lineupStatus ?? '').toLowerCase() !== 'confirmed');
    }

    return [...result].sort((a, b) => sortValue(b, sortBy) - sortValue(a, sortBy));
  }, [candidates, query, lineupFilter, sortBy]);

  // Per-signal maxima across the visible list so bars are relative, not invented scales.
  const maxima = useMemo<CandidateScoreBreakdown>(() => {
    const base: CandidateScoreBreakdown = {
      hitterPower: 0,
      pitcherVulnerability: 0,
      parkContext: 0,
      lineupVolume: 0,
      handednessEdge: 0,
      recentForm: 0,
      penalties: 0,
    };
    for (const c of filtered) {
      if (!c.scoreBreakdown) continue;
      for (const { key } of SIGNAL_LABELS) {
        base[key] = Math.max(base[key], c.scoreBreakdown[key] ?? 0);
      }
    }
    return base;
  }, [filtered]);

  const confirmedCount = candidates.filter((c) => String(c.lineupStatus ?? '').toLowerCase() === 'confirmed').length;

  return (
    <div className="space-y-4" id="deep-research-board">
      {/* Controls */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4 space-y-3 shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300 font-mono">Deep Research Board</p>
            <h3 className="mt-1 text-lg font-black text-white tracking-tight">
              Today&apos;s verified candidates
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">
              {confirmedCount} confirmed
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-400">
              {candidates.length} total
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player, team, or pitcher..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              id="deep-research-search"
            />
          </div>

          <select
            value={lineupFilter}
            onChange={(e) => setLineupFilter(e.target.value as typeof lineupFilter)}
            className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-xs font-bold text-slate-300 focus:border-cyan-400/40 focus:outline-none"
            id="deep-research-lineup-filter"
          >
            <option value="all">All lineups</option>
            <option value="confirmed">Confirmed only</option>
            <option value="projected">Projected only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-xs font-bold text-slate-300 focus:border-cyan-400/40 focus:outline-none"
            id="deep-research-sort"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                Sort: {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-12 text-center">
          <FlaskConical className="mx-auto h-8 w-8 animate-pulse text-cyan-400" />
          <p className="mt-3 text-sm font-bold text-slate-400">Loading today&apos;s validated board...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-12 text-center space-y-2">
          <ShieldAlert className="mx-auto h-8 w-8 text-amber-400/80" />
          <p className="text-sm font-bold text-slate-300">No candidates match.</p>
          <p className="text-xs text-slate-500">
            {candidates.length === 0
              ? 'No validated candidates are available yet — lineups may not be posted. Nothing is generated to fill the gap.'
              : 'Try clearing the search or lineup filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const tier = c.confidenceTier ?? null;
            const headshot = getMlbHeadshotUrl(c.playerId);
            const probability =
              typeof c.estimatedHrProbability === 'number' && c.estimatedHrProbability > 0
                ? `${Math.round(c.estimatedHrProbability * 100)}%`
                : null;
            const lineupLabel = String(c.lineupStatus ?? '').toLowerCase() === 'confirmed'
              ? c.battingOrder
                ? `Confirmed · #${Math.round(c.battingOrder / 100)}`
                : 'Confirmed'
              : 'Projected';

            return (
              <article
                key={`${c.playerId}-${c.gamePk}`}
                className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-[#07101d]/90 p-4 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-cyan-300/25"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  {/* Identity */}
                  <div className="flex min-w-0 items-start gap-3">
                    {headshot ? (
                      <img
                        src={headshot}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 shrink-0 rounded-2xl border border-cyan-300/20 bg-slate-950 object-cover"
                      />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-slate-800 bg-slate-900 text-xs font-black text-slate-500">
                        {c.playerName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-black text-white">{c.playerName}</span>
                        {tier && (
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-black uppercase ${TIER_STYLES[tier] ?? TIER_STYLES.watchlist}`}>
                            {tier}
                          </span>
                        )}
                        {c.riskLabel && (
                          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[9px] font-mono font-black uppercase text-slate-400">
                            {c.riskLabel}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500">
                        {c.team} vs {c.opponent}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <ContextChip
                          label="P"
                          value={
                            c.opponentPitcherName && c.opponentPitcherName !== 'TBD'
                              ? `${c.opponentPitcherName}${c.pitcherHand ? ` · ${c.pitcherHand}HP` : ' · Hand TBD'}`
                              : 'Pitcher TBD'
                          }
                          missing={!c.opponentPitcherName || c.opponentPitcherName === 'TBD'}
                        />
                        <ContextChip
                          label="Park"
                          value={
                            typeof c.parkFactor === 'number'
                              ? `${c.venue ?? 'Venue'} · ${c.parkFactor}`
                              : 'Missing park factor'
                          }
                          missing={typeof c.parkFactor !== 'number'}
                        />
                        <ContextChip label="Lineup" value={lineupLabel} missing={lineupLabel === 'Projected'} />
                      </div>
                    </div>
                  </div>

                  {/* Model estimate + actions */}
                  <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                    <div className="text-left lg:text-right">
                      <span className="block text-[9px] font-mono font-black uppercase tracking-[0.2em] text-slate-500">
                        Model HR est. — not sportsbook odds
                      </span>
                      <span className="text-lg font-mono font-black text-cyan-200">
                        {probability ?? '—'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {c.opponentPitcherId ? (
                        <button
                          type="button"
                          onClick={() => loadMatchup(c)}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-[10px] font-mono font-black uppercase text-slate-300 transition hover:border-sky-300/40 hover:text-sky-200"
                        >
                          <History className="h-3.5 w-3.5" />
                          Matchup
                        </button>
                      ) : null}
                      {onOpenResearch && (
                        <button
                          type="button"
                          onClick={() => onOpenResearch(c)}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-[10px] font-mono font-black uppercase text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                        >
                          <Microscope className="h-3.5 w-3.5" />
                          Research
                        </button>
                      )}
                      {onAddToSlip && (
                        <button
                          type="button"
                          onClick={() => onAddToSlip(c)}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-400/30 bg-emerald-500/90 px-3 py-2 text-[10px] font-mono font-black uppercase text-emerald-950 transition hover:bg-emerald-400"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add to Slip
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Real signal breakdown */}
                {c.scoreBreakdown ? (
                  <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-cyan-300">
                        Signal Breakdown
                      </span>
                      {typeof c.dataConfidence === 'number' && (
                        <span className="text-[9px] font-mono font-black uppercase text-slate-500">
                          Data confidence {Math.round(c.dataConfidence)}%
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <SignalBars breakdown={c.scoreBreakdown} maxima={maxima} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-400/5 p-3 text-[11px] font-semibold text-amber-200/90">
                    Signal breakdown unavailable for this candidate — using verified board score only.
                  </div>
                )}

                {/* Career batter-vs-pitcher history — real MLB vsPlayerTotal, never estimated */}
                {revealed[`${c.playerId}:${c.gamePk}`] && c.opponentPitcherId ? (() => {
                  const state = matchups[`${c.gamePk}:${c.opponentPitcherId}`];
                  const pitcherLabel = c.opponentPitcherName && c.opponentPitcherName !== 'TBD'
                    ? c.opponentPitcherName
                    : 'this pitcher';

                  let body: ReactNode;
                  if (!state || state === 'loading') {
                    body = <p className="text-[11px] font-semibold text-slate-400">Loading career history vs {pitcherLabel}...</p>;
                  } else if (state === 'error') {
                    body = <p className="text-[11px] font-semibold text-amber-200/90">Matchup history unavailable right now — nothing is estimated in its place.</p>;
                  } else {
                    const batter = state.find((b) => String(b.id) === String(c.playerId));
                    if (!batter) {
                      body = <p className="text-[11px] font-semibold text-slate-400">Not in the posted lineup for this matchup yet.</p>;
                    } else if (!batter.vsPitcher || batter.vsPitcher.ab === 0) {
                      body = <p className="text-[11px] font-semibold text-slate-400">No recorded career at-bats vs {pitcherLabel}.</p>;
                    } else {
                      const v = batter.vsPitcher;
                      body = (
                        <div className="space-y-1.5">
                          <p className="text-xs font-black text-slate-200">
                            {v.h}-for-{v.ab} career vs {pitcherLabel} · {v.hr} HR
                            <span className="ml-2 font-mono text-[10px] text-slate-400">
                              AVG {v.avgText ?? '—'} · SLG {v.slgText ?? '—'} · OPS {v.opsText ?? '—'}
                            </span>
                          </p>
                          {batter.recentForm && (
                            <p className="text-[10px] font-mono text-slate-500">
                              Last {batter.recentForm.games} games: {batter.recentForm.hits}/{batter.recentForm.atBats}, {batter.recentForm.hr} HR
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {v.ab < 6 && (
                              <span className="rounded-full border border-amber-300/20 bg-amber-400/5 px-2 py-0.5 text-[9px] font-mono font-black uppercase text-amber-300/90">
                                Small sample ({v.ab} AB)
                              </span>
                            )}
                            {batter.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[9px] font-mono font-black uppercase text-sky-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  }

                  return (
                    <div className="mt-3 rounded-2xl border border-sky-300/15 bg-sky-400/5 p-3">
                      <span className="mb-1.5 block text-[9px] font-mono font-black uppercase tracking-[0.2em] text-sky-300">
                        Matchup History — MLB career data
                      </span>
                      {body}
                    </div>
                  );
                })() : null}

                {/* Reasons + warnings, straight from the pipeline */}
                {(c.reasons?.length || c.boardWarnings?.length) ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {c.reasons && c.reasons.length > 0 && (
                      <ul className="space-y-1 rounded-2xl border border-emerald-300/10 bg-emerald-400/5 p-3 text-[11px] leading-relaxed text-slate-300">
                        {c.reasons.slice(0, 3).map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                    )}
                    {c.boardWarnings && c.boardWarnings.length > 0 && (
                      <ul className="space-y-1 rounded-2xl border border-amber-300/10 bg-amber-400/5 p-3 text-[11px] leading-relaxed text-amber-200/90">
                        {c.boardWarnings.slice(0, 3).map((warning) => (
                          <li key={warning}>⚠ {warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
