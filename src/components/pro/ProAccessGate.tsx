import React from 'react';
import { Lock, Zap, Star } from 'lucide-react';
import { CreatorProofProfile } from '../../types';

export function isProUser(profile: Pick<CreatorProofProfile, 'subscriptionTier'>): boolean {
  return profile.subscriptionTier === 'GOLD' || profile.subscriptionTier === 'SELLER_PRO';
}

interface ProAccessGateProps {
  profile: CreatorProofProfile;
  featureName?: string;
  onNavigatePremium?: () => void;
  children: React.ReactNode;
}

export function ProAccessGate({ profile, featureName = 'Pro Lab', onNavigatePremium, children }: ProAccessGateProps) {
  if (isProUser(profile)) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 text-slate-100">
      <div className="w-full max-w-xl space-y-6 text-center">

        {/* Lock icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/20 bg-amber-400/10">
          <Lock className="h-8 w-8 text-amber-300" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white">
            {featureName} is a Pro Feature
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Upgrade to <span className="font-bold text-amber-300">VEdge Gold</span> or{' '}
            <span className="font-bold text-cyan-300">Research Seller PRO</span> to unlock real-time
            analytics labs, signal graphs, and verified data tools.
          </p>
        </div>

        {/* Benefits */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-left space-y-3">
          {[
            { icon: Zap, text: 'Live Game Lab — real game-by-game signal panels' },
            { icon: Star, text: 'Player Edge Lab — verified HR edge scores and risk tiers' },
            { icon: Zap, text: 'Team Matchup Lab — runs, hits, and pitcher vulnerability' },
            { icon: Star, text: 'Pro Graphs Lab — signal breakdown and confidence meters' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
              <span className="text-slate-300">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onNavigatePremium}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3.5 text-sm font-black text-slate-950 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Upgrade to Gold — Unlock Pro Labs
          </button>
        </div>

        <p className="text-[10px] text-slate-600">
          Current tier: {profile.subscriptionTier || 'BASIC'}. Subscriptions managed via Stripe.
        </p>
      </div>
    </main>
  );
}

export default ProAccessGate;
