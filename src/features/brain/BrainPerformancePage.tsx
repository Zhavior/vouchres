import { useQuery } from '@tanstack/react-query';
import { Database, History, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { BrainPageShell } from './BrainPageShell';
import { Z8_LABEL, Z8_PANEL_PREMIUM, Z8_SURFACE } from '../../theme/z8Tokens';

type LedgerPick = {
  decisionKey: string; date: string; playerName: string; team: string; opponent: string;
  rank: number; score: number; confidence: number; tier: string; evidenceQuality: 'official' | 'preview';
  result: 'pending' | 'hit' | 'miss' | 'void';
};
type LedgerResponse = {
  picks: LedgerPick[];
  performance: { total: number; resolved: number; pending: number; hits: number; misses: number; voids: number; hitRate: number | null; sampleWarning: string | null };
  modelRecords: Array<{ engineVersion: string; samples: number; readyForJudgment: boolean; evaluation: null | { brierScore: number; logLoss: number; calibrationError: number }; excluded: { missingProbability: number; invalidSnapshot: number; temporalLeakage: number } }>;
  stolenBase: { picks: LedgerPick[]; performance: { total: number; resolved: number; pending: number; hits: number; misses: number; voids: number; hitRate: number | null; sampleWarning: string | null } };
  pitcherStrikeouts: { picks: LedgerPick[]; performance: { total: number; resolved: number; pending: number; hits: number; misses: number; voids: number; hitRate: number | null; sampleWarning: string | null } };
};

export default function BrainPerformancePage({ onNavigate }: { onNavigate: (section: string) => void }) {
  const query = useQuery({
    queryKey: ['brain', 'ledger', 'mlb', 'home-run'],
    queryFn: () => apiClient.get<LedgerResponse>('/api/intelligence/brain/mlb/performance'),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
  const ledger = query.data;

  return (
    <BrainPageShell active="performance" onNavigate={onNavigate}>
      <div className="flex items-start gap-3 border border-vouch-emerald/25 bg-vouch-emerald/5 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-vouch-emerald" /><div><strong className="text-sm text-white">Accountability ledger active</strong><p className="mt-1 text-sm leading-6 text-white/55">Every recommendation is frozen server-side with its engine version before settlement. Results come from official MLB play-by-play; pending and void picks never inflate the win rate.</p></div></div>
      {query.isLoading ? <div className={`${Z8_PANEL_PREMIUM} flex min-h-64 items-center justify-center gap-3`}><RefreshCw className="h-5 w-5 animate-spin text-vouch-emerald" /><span className={`${Z8_LABEL} text-white/55`}>Opening verified ledger</span></div> : query.isError || !ledger ? <div className={`${Z8_PANEL_PREMIUM} p-8 text-center text-sm text-rose-200`}>The verified ledger could not be loaded. No estimated record is shown.</div> : <>
        {ledger.performance.sampleWarning && <div className="border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100/70">{ledger.performance.sampleWarning} Treat the displayed rate as early evidence, not proof of long-term performance.</div>}
        <section className="grid gap-3 sm:grid-cols-5">
          {[['Recorded', ledger.performance.total], ['Resolved', ledger.performance.resolved], ['Hits', ledger.performance.hits], ['Pending', ledger.performance.pending], ['Hit rate', ledger.performance.hitRate == null ? 'Pending' : `${ledger.performance.hitRate}%`]].map(([label, value]) => <div key={String(label)} className={`${Z8_SURFACE} p-4`}><div className={`${Z8_LABEL} text-white/40`}>{label}</div><div className="mt-1 font-mono text-2xl font-black text-white">{value}</div></div>)}
        </section>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div className={`${Z8_PANEL_PREMIUM} p-4 sm:p-5`}><div className="flex items-center justify-between"><div><div className={`${Z8_LABEL} text-vouch-emerald`}>Verified history</div><h2 className="mt-1 text-lg font-bold text-white">Brain decisions versus official result</h2></div><History className="h-5 w-5 text-white/35" /></div><div className="mt-4 grid gap-2">{ledger.picks.length ? ledger.picks.map((pick) => <div key={pick.decisionKey} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border border-white/10 bg-black/25 p-3"><div className="min-w-0"><strong className="block truncate text-sm text-white">{pick.playerName}</strong><span className="font-mono text-[10px] uppercase text-white/35">{pick.date} · {pick.team} vs {pick.opponent} · Brain {pick.score} · {pick.evidenceQuality}</span></div><span className={`${Z8_LABEL} self-center ${pick.result === 'hit' ? 'text-vouch-emerald' : pick.result === 'miss' ? 'text-rose-300' : 'text-white/35'}`}>{pick.result === 'hit' ? 'HR hit' : pick.result === 'miss' ? 'No HR' : pick.result}</span></div>) : <p className="py-10 text-center text-sm text-white/45">No Brain decisions have been recorded yet.</p>}</div></div>
          <aside className={`${Z8_PANEL_PREMIUM} p-5`}><Database className="h-6 w-6 text-vouch-emerald" /><h2 className="mt-3 text-lg font-bold text-white">Record integrity</h2><div className="mt-4 space-y-3">{['Server-authored decisions only.', 'Immutable pre-game scores and evidence.', 'Final-game settlement from MLB play-by-play.', 'Win rate equals hits divided by hits plus misses.'].map((item, index) => <div key={item} className="flex gap-3 text-sm leading-6 text-white/55"><span className="font-mono text-vouch-emerald">0{index + 1}</span><span>{item}</span></div>)}</div></aside>
        </section>
        <section className={`${Z8_PANEL_PREMIUM} p-4 sm:p-5`}>
          <div><div className={`${Z8_LABEL} text-vouch-cyan`}>Model accountability</div><h2 className="mt-1 text-lg font-bold text-white">Probability quality by engine version</h2><p className="mt-1 text-sm leading-6 text-white/45">These metrics use settled, pregame snapshots only. A model is not judged ready before 250 observations and 20 positive outcomes.</p></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">{ledger.modelRecords.length ? ledger.modelRecords.map((record) => <article key={record.engineVersion} className="border border-white/10 bg-black/25 p-4"><div className="flex items-start justify-between gap-3"><div><strong className="font-mono text-sm text-white">{record.engineVersion}</strong><p className="mt-1 text-xs text-white/40">{record.samples} valid probability observations</p></div><span className={`${Z8_LABEL} border px-2 py-1 ${record.readyForJudgment ? 'border-vouch-emerald/30 text-vouch-emerald' : 'border-amber-400/20 text-amber-200'}`}>{record.readyForJudgment ? 'Judgment ready' : 'Collecting evidence'}</span></div>{record.evaluation ? <div className="mt-4 grid grid-cols-3 gap-2">{[['Brier', record.evaluation.brierScore], ['Log loss', record.evaluation.logLoss], ['Calibration', record.evaluation.calibrationError]].map(([label, value]) => <div key={String(label)} className={`${Z8_SURFACE} p-3`}><span className={`${Z8_LABEL} text-white/35`}>{label}</span><strong className="mt-1 block font-mono text-lg text-white">{value}</strong></div>)}</div> : <p className="mt-4 text-sm text-white/45">No valid calibrated probabilities have settled yet.</p>}<p className="mt-3 font-mono text-[10px] uppercase text-white/30">Excluded · missing probability {record.excluded.missingProbability} · invalid {record.excluded.invalidSnapshot} · leakage {record.excluded.temporalLeakage}</p></article>) : <p className="py-8 text-sm text-white/45">No settled model versions are available yet. This section will populate from forward decisions, not reconstructed history.</p>}</div>
        </section>
        <section className={`${Z8_PANEL_PREMIUM} p-4 sm:p-5`}><div className={`${Z8_LABEL} text-amber-200`}>Stolen base record</div><h2 className="mt-1 text-lg font-bold text-white">Independent market accountability</h2><div className="mt-4 grid gap-3 sm:grid-cols-4">{[['Recorded', ledger.stolenBase.performance.total], ['Resolved', ledger.stolenBase.performance.resolved], ['Hits', ledger.stolenBase.performance.hits], ['Hit rate', ledger.stolenBase.performance.hitRate == null ? 'Pending' : `${ledger.stolenBase.performance.hitRate}%`]].map(([label, value]) => <div key={String(label)} className={`${Z8_SURFACE} p-3`}><span className={`${Z8_LABEL} text-white/35`}>{label}</span><strong className="mt-1 block font-mono text-xl text-white">{value}</strong></div>)}</div></section>
        <section className={`${Z8_PANEL_PREMIUM} p-4 sm:p-5`}><div className={`${Z8_LABEL} text-vouch-cyan`}>Pitcher strikeout record · 5+ K</div><h2 className="mt-1 text-lg font-bold text-white">Official final-boxscore accountability</h2><div className="mt-4 grid gap-3 sm:grid-cols-4">{[['Recorded', ledger.pitcherStrikeouts.performance.total], ['Resolved', ledger.pitcherStrikeouts.performance.resolved], ['Hits', ledger.pitcherStrikeouts.performance.hits], ['Hit rate', ledger.pitcherStrikeouts.performance.hitRate == null ? 'Pending' : `${ledger.pitcherStrikeouts.performance.hitRate}%`]].map(([label, value]) => <div key={String(label)} className={`${Z8_SURFACE} p-3`}><span className={`${Z8_LABEL} text-white/35`}>{label}</span><strong className="mt-1 block font-mono text-xl text-white">{value}</strong></div>)}</div></section>
      </>}
    </BrainPageShell>
  );
}
