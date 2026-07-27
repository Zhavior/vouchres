import React from 'react';
import { Award, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import { formatProfileWinRateShort } from '../../lib/profileWinRateDisplay';

interface ProofBuildersPanelProps {
  profile: CreatorProofProfile;
}

export default function ProofBuildersPanel({ profile }: ProofBuildersPanelProps) {
  // We display the active real-time tracking from the feed or user profile.
  // This features zero fake profiles, only the user's actual transparent track record that builds as they play!
  const hasProof = profile && profile.totalPicks > 0;

  return (
    <div className="glass-panel glass-border font-z8 rounded-2xl p-4" id="proof-builders-panel">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-vouch-emerald" />
        <h3 className="terminal-text text-white/70">Verified Leader Proof</h3>
      </div>

      {!hasProof ? (
        <div className="text-xs text-white/30 py-4 text-center">
          Proof builders coming soon.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Real user proof */}
          <div className="p-3 bg-white/[0.02] rounded-lg border border-white/10" id="user-proof-card">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-vouch-emerald/10 flex items-center justify-center font-bold text-vouch-emerald text-xs">
                  {profile.displayName.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-white text-xs flex items-center gap-1">
                    {profile.displayName}
                    {profile.verified && <span className="terminal-text bg-vouch-emerald/10 text-vouch-emerald px-1 py-0.2 rounded">VERIFIED</span>}
                  </h4>
                  <p className="text-white/40 text-[10px]">@{profile.username}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-vouch-emerald">
                  {formatProfileWinRateShort(profile)}
                </div>
                <div className="text-[10px] text-white/40">
                  {profile.wonPicks}/{profile.totalPicks} picks
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-1.5 bg-white/[0.02] rounded">
                <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Net Return</p>
                <p className={['text-xs font-bold', profile.unitsNetProfit >= 0 ? 'text-vouch-emerald' : 'text-rose-400'].join(' ')}>
                  {profile.unitsNetProfit >= 0 ? '+' : ''}{profile.unitsNetProfit.toFixed(1)} units
                </p>
              </div>
              <div className="p-1.5 bg-white/[0.02] rounded">
                <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Risk Level</p>
                <p className="font-semibold text-vouch-cyan text-xs">STANDARD</p>
              </div>
            </div>

            <p className="text-[10px] text-white/40 mt-2 italic line-clamp-1">
              "{profile.bio}"
            </p>
          </div>

          <p className="text-[10px] text-white/25 leading-relaxed px-1">
            * Leader statistics update automatically based on actual parlay results and verified grading. No fake or simulated records.
          </p>
        </div>
      )}
    </div>
  );
}
