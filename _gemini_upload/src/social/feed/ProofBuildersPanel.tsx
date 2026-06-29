import React from 'react';
import { Award, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { CreatorProofProfile } from '../../types';

interface ProofBuildersPanelProps {
  profile: CreatorProofProfile;
}

export default function ProofBuildersPanel({ profile }: ProofBuildersPanelProps) {
  // We display the active real-time tracking from the feed or user profile.
  // This features zero fake profiles, only the user's actual transparent track record that builds as they play!
  const hasProof = profile && profile.totalPicks > 0;

  return (
    <div className="bg-[#121824] rounded-xl border border-slate-850 p-4" id="proof-builders-panel">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-5 h-5 text-sky-400" />
        <h3 className="font-bold text-slate-100 text-sm tracking-wide uppercase">Verified Leader Proof</h3>
      </div>

      {!hasProof ? (
        <div className="text-xs text-slate-400 py-4 text-center">
          Proof builders coming soon.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Real user proof */}
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-slate-800" id="user-proof-card">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-sky-500/35 flex items-center justify-center font-bold text-sky-400 text-xs">
                  {profile.displayName.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-1">
                    {profile.displayName}
                    {profile.verified && <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded font-bold">VERIFIED</span>}
                  </h4>
                  <p className="text-slate-400 text-[10px]">@{profile.username}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">
                  {profile.winRate.toFixed(1)}% WR
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {profile.wonPicks}/{profile.totalPicks} picks
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-1.5 bg-slate-900/60 rounded">
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Net Return</p>
                <p className={`font-mono text-xs font-bold ${profile.unitsNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profile.unitsNetProfit >= 0 ? '+' : ''}{profile.unitsNetProfit.toFixed(1)} units
                </p>
              </div>
              <div className="p-1.5 bg-slate-900/60 rounded">
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Risk Level</p>
                <p className="font-semibold text-amber-500 font-mono text-xs">STANDARD</p>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-2 italic line-clamp-1">
              "{profile.bio}"
            </p>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed px-1">
            * Leader statistics update automatically based on actual parlay results and verified grading. No fake or simulated records.
          </p>
        </div>
      )}
    </div>
  );
}
