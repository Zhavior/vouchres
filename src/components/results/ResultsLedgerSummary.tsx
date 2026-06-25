import React from 'react';
import { BarChart3, Info } from 'lucide-react';
import type { Parlay } from '../../types';
import { StatusBadge, ScorePill } from '../ui/primitives';

/** Honest results ledger summary computed from the user's REAL saved parlays. */
export default function ResultsLedgerSummary({ savedParlays = [] }: { savedParlays?: Parlay[] }) {
  const by = (s: string) => savedParlays.filter((p) => p.status === s);
  const won = by('WON'), lost = by('LOST'), pending = by('PENDING'), voids = by('VOID');
  const pushed = savedParlays.filter((p) => (p.status as string) === 'PUSH' || (p.status as string) === 'PUSHED');
  const settled = won.length + lost.length;
  const winRate = settled ? Math.round((won.length / settled) * 100) : null;

  const stake = (p: Parlay) => p.wagerAmount ?? 1;
  const staked = [...won, ...lost].reduce((s, p) => s + stake(p), 0);
  const profit = won.reduce((s, p) => s + ((p.payoutAmount ?? stake(p) * (p.oddsValue || 2)) - stake(p)), 0) - lost.reduce((s, p) => s + stake(p), 0);
  const roi = staked ? Math.round((profit / staked) * 100) : null;
  const units = staked ? Math.round((profit / (savedParlays.reduce((s, p) => s + stake(p), 0) / Math.max(1, savedParlays.length))) * 10) / 10 : 0;

  const counts: { label: string; n: number }[] = [
    { label: 'Pending', n: pending.length }, { label: 'Won', n: won.length }, { label: 'Lost', n: lost.length },
    { label: 'Pushed', n: pushed.length }, { label: 'Void', n: voids.length },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> Your Results Ledger</h3>
        <StatusBadge status={settled ? 'Pending' : 'Demo'} />
      </div>

      {savedParlays.length === 0 ? (
        <p className="text-[11px] text-slate-500 font-mono py-2">No saved slips yet — build and save a parlay to start tracking real results.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {counts.map((c) => <ScorePill key={c.label} label={c.label} value={c.n} />)}
            <ScorePill label="Win rate" value={winRate != null ? `${winRate}%` : '—'} color="#34d399" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <ScorePill label="ROI" value={roi != null ? `${roi > 0 ? '+' : ''}${roi}%` : '—'} color={roi && roi >= 0 ? '#34d399' : '#f87171'} />
            <ScorePill label="Units" value={`${units > 0 ? '+' : ''}${units}u`} color={units >= 0 ? '#34d399' : '#f87171'} />
            <ScorePill label="Verified" value="0" color="#94a3b8" />
          </div>
        </>
      )}

      <p className="text-[10px] text-slate-600 mt-3 flex items-center gap-1">
        <Info className="w-2.5 h-2.5" /> Tracked from your saved slips. Picks are <span className="text-slate-400">Unverified</span> until graded after game finals — no faked verified records.
      </p>
    </div>
  );
}
