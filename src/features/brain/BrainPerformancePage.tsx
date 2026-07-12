import { useMemo } from 'react';
import { Database, History, ShieldAlert } from 'lucide-react';
import { useHrBoardViewModel } from '../hr/hooks/useHrBoardViewModel';
import { selectBrainPicks } from './brainSelection';
import { BrainPageShell } from './BrainPageShell';
import { Z8_LABEL, Z8_PANEL_PREMIUM, Z8_SURFACE } from '../../theme/z8Tokens';

export default function BrainPerformancePage({ onNavigate }: { onNavigate: (section: string) => void }) {
  const vm = useHrBoardViewModel();
  const picks = useMemo(() => selectBrainPicks(vm.rows ?? []), [vm.rows]);
  const settled = picks.map((pick) => ({ pick, result: vm.getHrResult(pick.player.playerId) }));
  const hits = settled.filter((item) => item.result === 'hit').length;
  const misses = settled.filter((item) => item.result === 'no-hr').length;
  const resolved = hits + misses;
  const hitRate = resolved ? Math.round((hits / resolved) * 100) : 0;

  return (
    <BrainPageShell active="performance" onNavigate={onNavigate}>
      <div className="flex items-start gap-3 border border-amber-400/20 bg-amber-400/5 p-4"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><strong className="text-sm text-amber-100">Learning ledger is not active yet.</strong><p className="mt-1 text-sm leading-6 text-white/55">This page grades the currently reconstructed slate against official HR events. True learning requires immutable pre-game snapshots stored before first pitch; without that, historical backtests could leak later information.</p></div></div>
      <section className="grid gap-3 sm:grid-cols-4">
        {[['Brain selections', picks.length], ['Resolved', resolved], ['Home runs', hits], ['Hit rate', resolved ? `${hitRate}%` : 'Pending']].map(([label, value]) => <div key={String(label)} className={`${Z8_SURFACE} p-4`}><div className={`${Z8_LABEL} text-white/40`}>{label}</div><div className="mt-1 font-mono text-2xl font-black text-white">{value}</div></div>)}
      </section>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className={`${Z8_PANEL_PREMIUM} p-4 sm:p-5`}><div className="flex items-center justify-between"><div><div className={`${Z8_LABEL} text-vouch-emerald`}>Decision outcomes</div><h2 className="mt-1 text-lg font-bold text-white">Chosen players versus result</h2></div><History className="h-5 w-5 text-white/35" /></div><div className="mt-4 grid gap-2">{settled.map(({ pick, result }) => <div key={pick.player.stableId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border border-white/10 bg-black/25 p-3"><div className="min-w-0"><strong className="block truncate text-sm text-white">{pick.player.playerName}</strong><span className="font-mono text-[10px] uppercase text-white/35">Brain {pick.selectionScore} · {pick.player.riskTier}</span></div><span className={`${Z8_LABEL} self-center ${result === 'hit' ? 'text-vouch-emerald' : result === 'no-hr' ? 'text-rose-300' : 'text-white/35'}`}>{result === 'hit' ? 'HR hit' : result === 'no-hr' ? 'No HR' : 'Pending'}</span></div>)}</div></div>
        <aside className={`${Z8_PANEL_PREMIUM} p-5`}><Database className="h-6 w-6 text-vouch-emerald" /><h2 className="mt-3 text-lg font-bold text-white">What unlocks real learning</h2><div className="mt-4 space-y-3">{['Store every pre-game feature snapshot and engine version.', 'Join official settled outcomes by player, game, and market.', 'Measure tier calibration, false confidence, and missed-player opportunity.', 'Promote new weights only after replay tests beat the current version.'].map((item, index) => <div key={item} className="flex gap-3 text-sm leading-6 text-white/55"><span className="font-mono text-vouch-emerald">0{index + 1}</span><span>{item}</span></div>)}</div></aside>
      </section>
    </BrainPageShell>
  );
}
