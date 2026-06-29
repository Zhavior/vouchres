import React from 'react';
import { X, Activity, AlertTriangle, Crown, Lock, Target, ShieldAlert, TrendingUp } from 'lucide-react';
import type { VulnerablePitcher } from '../../types/mlb';

interface Props {
  pitcher: VulnerablePitcher | null;
  isPro: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const RISK_COLOR: Record<string, string> = {
  LOW: '#34d399', MEDIUM: '#fbbf24', HIGH: '#fb923c', EXTREME: '#f87171',
};

function scoreColor(s: number): string {
  return s >= 80 ? '#f87171' : s >= 60 ? '#fb923c' : s >= 40 ? '#fbbf24' : '#34d399';
}

const throwsLabel = (t: string) => (t === 'L' ? 'LHP' : t === 'R' ? 'RHP' : 'Pitcher');

/** A locked Pro panel — shown to free users in place of deep analytics. */
function ProUpsell({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
        <Crown className="h-5 w-5 text-amber-300" />
      </div>
      <h4 className="text-sm font-black text-white">Pitcher Pro Profile</h4>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
        Unlock the deep scouting report: risk factors, attackable counts, and verified trend feeds.
      </p>
      <ul className="mx-auto mt-3 max-w-xs space-y-1.5 text-left text-[11px] text-slate-300">
        <li className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5 text-amber-300" /> What could go wrong (risk factors)</li>
        <li className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-amber-300" /> Recent form & pitch-mix trends</li>
        <li className="flex items-center gap-2"><Target className="h-3.5 w-3.5 text-amber-300" /> Handedness & count-based splits</li>
      </ul>
      <button
        onClick={onUpgrade}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Upgrade to unlock Pitcher Pro
      </button>
    </div>
  );
}

/** A "verified feed required" placeholder — honest, no fabricated analytics. */
function LockedFeed({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-800/70 bg-slate-950/50 px-3 py-5 text-center">
      <Lock className="h-4 w-4 text-slate-700" />
      <p className="text-[11px] font-bold text-slate-400">{title}</p>
      <p className="max-w-[220px] text-[10px] leading-relaxed text-slate-600">{detail}</p>
    </div>
  );
}

export default function PitcherProfileDrawer({ pitcher, isPro, onClose, onUpgrade }: Props) {
  if (!pitcher) return null;
  const p = pitcher;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-[#0b1120] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-800 bg-[#0b1120]/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10">
                <Activity className="h-4 w-4 text-rose-300" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-black text-white">{p.pitcherName}</h2>
                <p className="truncate text-[11px] font-mono text-slate-500">
                  {throwsLabel(p.throws)} · {p.team} vs {p.opponent}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-5">
          {/* Vulnerability score */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Vulnerability</span>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-black uppercase"
                style={{ color: RISK_COLOR[p.riskTier] ?? '#94a3b8', background: (RISK_COLOR[p.riskTier] ?? '#94a3b8') + '1a' }}
              >
                {p.riskTier}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black" style={{ color: scoreColor(p.vulnerabilityScore) }}>{p.vulnerabilityScore}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full" style={{ width: `${p.vulnerabilityScore}%`, background: scoreColor(p.vulnerabilityScore) }} />
              </div>
            </div>
          </div>

          {/* Free: why hittable */}
          <section>
            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-300">Why he's hittable</h3>
            <ul className="space-y-1.5">
              {p.attackReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-slate-300">
                  <Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-300" /> {r}
                </li>
              ))}
            </ul>
          </section>

          {/* Free: recommended markets */}
          <section>
            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-300">Recommended markets</h3>
            <div className="flex flex-wrap gap-2">
              {p.recommendedMarkets.map((m, i) => (
                <span key={i} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-200">{m}</span>
              ))}
            </div>
          </section>

          {/* Pro section */}
          <div className="flex items-center gap-2 pt-1">
            <Crown className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Pitcher Pro Profile</span>
            <span className="h-px flex-1 bg-gradient-to-r from-amber-400/30 to-transparent" />
          </div>

          {!isPro ? (
            <ProUpsell onUpgrade={onUpgrade} />
          ) : (
            <div className="space-y-4">
              {/* Pro: risk factors (what could go wrong) */}
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-300" /> Risk factors
                </h3>
                {p.whatCouldGoWrong.length ? (
                  <ul className="space-y-1.5">
                    {p.whatCouldGoWrong.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-slate-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300" /> {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-500">No major countervailing factors flagged for this matchup.</p>
                )}
              </section>

              {/* Pro: deep feeds (honest locked state — no fabricated data) */}
              <div className="grid grid-cols-1 gap-3">
                <LockedFeed title="Recent form & pitch mix" detail="Connects to the verified Statcast feed. No fabricated trend data shown." />
                <LockedFeed title="Handedness & count splits" detail="vL/vR and count-based splits unlock with the verified splits feed." />
              </div>

              <p className="text-[10px] text-slate-600">
                Data quality: {p.dataQuality}. Profile uses only fields returned by the production intelligence endpoint.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
