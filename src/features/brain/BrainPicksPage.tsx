import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, Target } from 'lucide-react';
import { useHrBoardViewModel } from '../hr/hooks/useHrBoardViewModel';
import { selectBrainPicks } from './brainSelection';
import { BrainPageShell } from './BrainPageShell';
import { Z8_LABEL, Z8_PANEL_PREMIUM, Z8_SURFACE } from '../../theme/z8Tokens';
import { fetchMlbStatHubRows } from '../mlb-stats/engine/mlbStatsApiData';
import { selectPitcherKBrainPicks } from './pitcherKSelection';

export default function BrainPicksPage({ onNavigate }: { onNavigate: (section: string) => void }) {
  const vm = useHrBoardViewModel();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const picks = useMemo(() => selectBrainPicks(vm.rows ?? []), [vm.rows]);
  const pitcherQuery = useQuery({
    queryKey: ['brain', 'pitcher-k', vm.date],
    queryFn: () => fetchMlbStatHubRows('pitcher_k', vm.date, 'season'),
    staleTime: 5 * 60_000,
  });
  const pitcherPicks = useMemo(() => selectPitcherKBrainPicks(pitcherQuery.data ?? []), [pitcherQuery.data]);
  const selected = picks.find((pick) => pick.player.stableId === selectedId) ?? picks[0] ?? null;
  const officialCount = picks.filter((pick) => pick.evidenceQuality === 'official').length;

  return (
    <BrainPageShell active="picks" onNavigate={onNavigate}>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ['Players chosen', picks.length],
          ['Official lineup', officialCount],
          ['Roster rows rejected', Math.max(0, (vm.rows?.length ?? 0) - picks.length)],
        ].map(([label, value]) => <div key={String(label)} className={`${Z8_SURFACE} p-4`}><div className={`${Z8_LABEL} text-white/40`}>{label}</div><div className="mt-1 font-mono text-2xl font-black text-white">{value}</div></div>)}
      </section>

      {picks.some((pick) => pick.evidenceQuality === 'preview') && <div className="flex items-start gap-2 border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100/75"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Official lineups are incomplete. Preview selections are penalized and may change.</div>}

      {vm.loading ? (
        <div className={`${Z8_PANEL_PREMIUM} flex min-h-64 items-center justify-center gap-3`}><RefreshCw className="h-5 w-5 animate-spin text-vouch-emerald" /><span className={`${Z8_LABEL} text-white/55`}>Comparing eligible players</span></div>
      ) : picks.length === 0 ? (
        <div className={`${Z8_PANEL_PREMIUM} p-8 text-center`}><ShieldCheck className="mx-auto h-8 w-8 text-white/30" /><h2 className="mt-3 text-lg font-bold text-white">No player clears the brain threshold.</h2><p className="mt-2 text-sm text-white/50">That is a valid result. The brain will not force a pick from a weak or incomplete slate.</p></div>
      ) : (
        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid content-start gap-2">
            {picks.map((pick, index) => (
              <button key={pick.player.stableId} type="button" onClick={() => setSelectedId(pick.player.stableId)} className={`brain-choice-row grid min-h-[88px] grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 border p-3 text-left ${selected?.player.stableId === pick.player.stableId ? 'border-vouch-emerald/45 bg-vouch-emerald/8' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                <span className="grid h-10 w-10 place-items-center border border-white/10 font-mono text-sm font-black text-white/55">{index + 1}</span>
                <span className="min-w-0"><strong className="block truncate text-sm text-white">{pick.player.playerName}</strong><span className="mt-1 block truncate font-mono text-[10px] uppercase text-white/40">{pick.player.team} vs {pick.player.opponent} · {pick.player.pitcherName || 'Pitcher TBD'}</span></span>
                <span className="text-right"><strong className="brain-score block font-mono text-xl text-vouch-emerald">{pick.selectionScore}</strong><small className={`${Z8_LABEL} text-white/35`}>Brain</small></span>
              </button>
            ))}
          </div>

          {selected && <article className={`${Z8_PANEL_PREMIUM} brain-premium-card min-w-0 p-4 sm:p-6`}>
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div><div className={`${Z8_LABEL} text-vouch-emerald`}>Selected over the slate</div><h2 className="mt-1 text-2xl font-black text-white">{selected.player.playerName}</h2><p className="mt-1 text-sm text-white/45">{selected.player.team} vs {selected.player.opponent} · {selected.player.venue || 'Venue pending'}</p></div>
              <div className="border border-vouch-emerald/25 bg-vouch-emerald/8 px-4 py-3 text-center"><strong className="font-mono text-3xl text-vouch-emerald">{selected.slatePercentile}</strong><span className={`${Z8_LABEL} block text-white/40`}>Slate percentile</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">{selected.tags.map((tag) => <span key={tag.label} className={`${Z8_LABEL} border px-2.5 py-1 ${tag.tone === 'positive' ? 'border-vouch-emerald/30 bg-vouch-emerald/8 text-vouch-emerald' : tag.tone === 'warning' ? 'border-amber-400/25 bg-amber-400/5 text-amber-200' : 'border-white/10 text-white/55'}`}>{tag.label}</span>)}</div>
            <p className="mt-5 text-base leading-7 text-white/75">{selected.explanation}</p>
            <div className="mt-6 grid gap-2 lg:grid-cols-3" aria-label="Intelligence comparison">
              <div className={`${Z8_SURFACE} p-3`}><div className={`${Z8_LABEL} text-white/40`}>Normal intelligence</div><strong className="mt-1 block font-mono text-2xl text-white">{selected.player.hrScore}</strong><p className="mt-1 text-xs leading-5 text-white/40">Raw player HR score before slate scarcity and exposure rules.</p></div>
              <div className="border border-vouch-emerald/30 bg-vouch-emerald/8 p-3"><div className={`${Z8_LABEL} text-vouch-emerald`}>Brain decision</div><strong className="mt-1 block font-mono text-2xl text-vouch-emerald">{selected.selectionScore}</strong><p className="mt-1 text-xs leading-5 text-white/50">Choosy score after evidence, lineup, pitcher, and slate comparison.</p></div>
              <div className={`${Z8_SURFACE} p-3`}><div className={`${Z8_LABEL} text-vouch-cyan`}>Sol review</div><strong className="mt-1 block text-sm text-white">Deterministic explanation</strong><p className="mt-1 text-xs leading-5 text-white/40">AI review remains explanation-only until a versioned model and eval suite are connected.</p></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[['Power', selected.player.hitterPower], ['Pitcher risk', selected.player.pitcherVulnerability], ['Recent form', selected.player.recentForm], ['Data confidence', selected.player.dataConfidence]].map(([label, value]) => <div key={String(label)} className={`${Z8_SURFACE} p-3`}><div className="flex justify-between text-xs text-white/55"><span>{label}</span><strong className="font-mono text-white">{value ?? '—'}</strong></div><div className="mt-2 h-1.5 bg-white/5"><div className="h-full bg-vouch-emerald" style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }} /></div></div>)}
            </div>
            <div className="mt-6 border-t border-white/10 pt-4"><div className={`${Z8_LABEL} flex items-center gap-2 text-white/45`}><Target className="h-4 w-4" /> Why this survived</div><ul className="mt-3 space-y-2">{selected.player.reasons.slice(0, 4).map((reason) => <li key={reason} className="flex gap-2 text-sm leading-6 text-white/60"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-vouch-emerald" />{reason}</li>)}</ul></div>
          </article>}
        </section>
      )}

      <section className={`${Z8_PANEL_PREMIUM} brain-premium-card p-4 sm:p-6`}>
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className={`${Z8_LABEL} text-vouch-cyan`}>Pitcher strikeout brain · Beta</div><h2 className="mt-1 text-xl font-black text-white">Choosy K predictions</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">A separate pitcher model. It does not borrow HR tiers or pretend a heuristic score is a sportsbook probability.</p></div>
          <span className={`${Z8_LABEL} border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-amber-200`}>Not backtested yet</span>
        </div>
        {pitcherQuery.isLoading ? <div className="flex min-h-40 items-center justify-center gap-2 text-white/45"><RefreshCw className="h-4 w-4 animate-spin" /> Comparing probable pitchers</div> : pitcherPicks.length === 0 ? <div className="py-10 text-center text-sm text-white/45">No pitcher clears the K threshold today.</div> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{pitcherPicks.map(({ pitcher, tags, explanation }) => <article key={pitcher.stableId} className="border border-white/10 bg-black/25 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-bold text-white">{pitcher.playerName}</h3><p className="mt-0.5 font-mono text-[10px] uppercase text-white/35">{pitcher.team} vs {pitcher.opponent}</p></div><div className="text-right"><strong className="font-mono text-2xl text-vouch-cyan">{pitcher.statScore}</strong><span className={`${Z8_LABEL} block text-white/35`}>K score</span></div></div><div className="mt-3 flex flex-wrap gap-1.5">{tags.map((tag) => <span key={tag.label} className={`${Z8_LABEL} border px-2 py-1 ${tag.tone === 'positive' ? 'border-vouch-cyan/30 bg-vouch-cyan/8 text-vouch-cyan' : tag.tone === 'warning' ? 'border-amber-400/25 text-amber-200' : 'border-white/10 text-white/50'}`}>{tag.label}</span>)}</div><p className="mt-3 text-sm leading-6 text-white/60">{explanation}</p><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><span className={`${Z8_LABEL} text-white/35`}>Confidence</span><span className="font-mono text-sm font-bold text-white">{pitcher.confidence}/100</span></div></article>)}</div>}
      </section>
    </BrainPageShell>
  );
}
