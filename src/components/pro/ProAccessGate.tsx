import React from 'react';
import { Lock, Zap, Star, Crown, MessageSquare, Store, Microscope } from 'lucide-react';
import { CreatorProofProfile } from '../../types';

export type RequiredTier = 'GOLD' | 'SELLER_PRO';

const TIER_RANK: Record<string, number> = {
  BASIC: 0,
  GOLD: 1,
  SELLER_PRO: 2,
};

function normalizeSubscriptionTier(tier?: string | null): keyof typeof TIER_RANK {
  const normalized = String(tier ?? 'BASIC').trim().toUpperCase();
  if (normalized === 'FREE') return 'BASIC';
  if (normalized === 'GOLD') return 'GOLD';
  if (normalized === 'SELLER_PRO' || normalized === 'SELLER PRO' || normalized === 'PRO') return 'SELLER_PRO';
  return 'BASIC';
}

/** True if the profile meets at least the given tier (defaults to GOLD). */
export function hasTierAccess(
  profile: Pick<CreatorProofProfile, 'subscriptionTier'>,
  required: RequiredTier = 'GOLD',
): boolean {
  return TIER_RANK[normalizeSubscriptionTier(profile.subscriptionTier)] >= TIER_RANK[required];
}

/** Backwards-compatible helper: true for GOLD or SELLER_PRO. */
export function isProUser(profile: Pick<CreatorProofProfile, 'subscriptionTier'>): boolean {
  return hasTierAccess(profile, 'GOLD');
}

interface TierTheme {
  badge: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  ctaGradient: string;
  ctaText: string;
  benefits: { icon: React.ComponentType<{ className?: string }>; text: string }[];
  price: string;
  ctaLabel: string;
}

const TIER_THEMES: Record<RequiredTier, TierTheme> = {
  GOLD: {
    badge: 'VEdge Gold — Pro Analyst',
    accent: 'text-amber-300',
    accentBg: 'bg-amber-400/10',
    accentBorder: 'border-amber-400/20',
    ctaGradient: 'from-amber-400 to-amber-500',
    ctaText: 'text-slate-950',
    price: '$12.99/mo',
    ctaLabel: 'Upgrade to Gold — Unlock Pro Labs',
    benefits: [
      { icon: Zap, text: 'Live Game Lab — real game-by-game signal panels' },
      { icon: Star, text: 'Player Edge Lab — verified HR edge scores and risk tiers' },
      { icon: Zap, text: 'Team Matchup Lab — runs, hits, and pitcher vulnerability' },
      { icon: Star, text: 'Pro Graphs Lab — signal breakdown and confidence meters' },
    ],
  },
  SELLER_PRO: {
    badge: 'Research Seller PRO — Elite',
    accent: 'text-indigo-300',
    accentBg: 'bg-indigo-500/10',
    accentBorder: 'border-indigo-500/20',
    ctaGradient: 'from-indigo-500 to-violet-600',
    ctaText: 'text-white',
    price: '$49.99/mo',
    ctaLabel: 'Go Elite — Unlock Research & Selling',
    benefits: [
      { icon: Microscope, text: 'Deep Research Suite — full regression & trend models' },
      { icon: Store, text: 'Sell Your Picks — paid storefront, 0% commission' },
      { icon: MessageSquare, text: 'Subscriber Chat & Clubs — run your own paid community' },
      { icon: Crown, text: 'Everything in Gold, plus elite verification' },
    ],
  },
};

interface ProAccessGateProps {
  profile: CreatorProofProfile;
  featureName?: string;
  /** Minimum tier required to view the children. Defaults to GOLD. */
  requiredTier?: RequiredTier;
  onNavigatePremium?: () => void;
  children: React.ReactNode;
}

export function ProAccessGate({
  profile,
  featureName = 'Pro Lab',
  requiredTier = 'GOLD',
  onNavigatePremium,
  children,
}: ProAccessGateProps) {
  if (hasTierAccess(profile, requiredTier)) {
    return <>{children}</>;
  }

  const theme = TIER_THEMES[requiredTier];
  const currentTier = normalizeSubscriptionTier(profile.subscriptionTier);
  // A Gold user hitting a Seller Pro wall is "upgrading", not "subscribing"
  const isUpgradeFromGold = requiredTier === 'SELLER_PRO' && currentTier === 'GOLD';

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 text-slate-100">
      <div className="w-full max-w-xl space-y-6 text-center">

        {/* Lock icon */}
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border ${theme.accentBorder} ${theme.accentBg}`}>
          {requiredTier === 'SELLER_PRO' ? (
            <Crown className={`h-8 w-8 ${theme.accent}`} />
          ) : (
            <Lock className={`h-8 w-8 ${theme.accent}`} />
          )}
        </div>

        <div className="space-y-2">
          <span className={`inline-block rounded-full border ${theme.accentBorder} ${theme.accentBg} px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${theme.accent}`}>
            {theme.badge} · {theme.price}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {featureName} {requiredTier === 'SELLER_PRO' ? 'is an Elite Feature' : 'is a Pro Feature'}
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            {requiredTier === 'SELLER_PRO' ? (
              <>This is our top tier — deep research tools, your own paid pick storefront, and subscriber chat/clubs. {isUpgradeFromGold ? 'Upgrade from Gold to unlock it.' : 'Available on Research Seller PRO.'}</>
            ) : (
              <>Upgrade to <span className="font-bold text-amber-300">VEdge Gold</span> to unlock real-time analytics labs, signal graphs, and verified data tools.</>
            )}
          </p>
        </div>

        {/* Benefits */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-left space-y-3">
          {theme.benefits.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${theme.accent}`} />
              <span className="text-slate-300">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onNavigatePremium}
            className={`rounded-xl bg-gradient-to-r ${theme.ctaGradient} px-8 py-3.5 text-sm font-black ${theme.ctaText} shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            {isUpgradeFromGold ? 'Upgrade to Research Seller PRO' : theme.ctaLabel}
          </button>
        </div>

        <p className="text-[10px] text-slate-600">
          Current tier: {currentTier}. Subscriptions managed securely via Stripe.
        </p>
      </div>
    </main>
  );
}

export default ProAccessGate;
