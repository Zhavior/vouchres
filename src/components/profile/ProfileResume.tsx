import React from 'react';
import { Trophy, ShieldCheck } from 'lucide-react';
import type { Parlay } from '../../types';
import { ScorePill, RiskBadge, StatusBadge } from '../ui/primitives';
import { getFounderPointsLabel } from "../../lib/founderAccess";

/** Sports-betting "resume" strip from real saved parlays + profile win rate. */
export default function ProfileResume({ savedParlays = [], winRate }: { savedParlays?: Parlay[]; winRate?: number }) {
  const by = (s: string) => savedParlays.filter((p) => p.status === s);
  const won = by('WON').length, lost = by('LOST').length, pending = by('PENDING').length;
  const settled = won + lost;
  const realWinRate = settled ? Math.round((won / settled) * 100) : null;

  const stake = (p: Parlay) => p.wagerAmount ?? 1;
  const staked = savedParlays.filter((p) => p.status === 'WON' || p.status === 'LOST').reduce((s, p) => s + stake(p), 0);
  const profit = by('WON').reduce((s, p) => s + ((p.payoutAmount ?? stake(p) * (p.oddsValue || 2)) - stake(p)), 0) - by('LOST').reduce((s, p) => s + stake(p), 0);
  const roi = staked ? Math.round((profit / staked) * 100) : null;

  // Risk style from saved slips' risk tiers.
  const tiers = savedParlays.map((p) => p.riskTier);
  const high = tiers.filter((t) => t === 'HIGH').length, low = tiers.filter((t) => t === 'LOW').length;
  const riskStyle = savedParlays.length === 0 ? '—' : high > low ? 'Aggressive' : low > high ? 'Conservative' : 'Balanced';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Betting Resume</h3>
        <StatusBadge status={settled ? 'Pending' : 'Demo'} />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <ScorePill label="Record" value={`${won}-${lost}`} />
        <ScorePill label="Win rate" value={realWinRate != null ? `${realWinRate}%` : winRate != null ? `${winRate.toFixed(0)}%` : '—'} color="#34d399" />
        <ScorePill label="ROI" value={roi != null ? `${roi > 0 ? '+' : ''}${roi}%` : '—'} color={roi && roi >= 0 ? '#34d399' : '#f87171'} />
        <ScorePill label="Pending" value={pending} color="#fbbf24" />
        <ScorePill label="Verified" value="0" color="#94a3b8" />
        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-950/50 border border-slate-800 px-2 py-1.5">
          <p className="text-[8px] text-slate-500 font-mono uppercase tracking-wider mb-0.5">Style</p>
          <RiskBadge risk={riskStyle === 'Aggressive' ? 'Risky' : riskStyle === 'Conservative' ? 'Safe' : 'Balanced'} />
        </div>
      </div>
      <p className="text-[10px] text-slate-600 mt-3 flex items-center gap-1">
        <ShieldCheck className="w-2.5 h-2.5" /> Built from your saved slips. Picks are <span className="text-slate-400">Unverified</span> until graded after finals.
      </p>
    </div>
  );
}
