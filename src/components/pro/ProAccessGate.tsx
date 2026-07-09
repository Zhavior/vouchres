import React from 'react';
import { Lock, Zap, Star, Crown, MessageSquare, Store, Microscope } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import { useEntitlements } from '../../features/hr/hooks/useEntitlements';
import { isFounderEmail } from '../../lib/founderAccess';

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

function readSessionEmail(): string | null {
  try {
    const raw = localStorage.getItem('vouchedge.auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      currentSession?: { user?: { email?: string | null } };
      user?: { email?: string | null };
    };
    const session = parsed.currentSession ?? parsed;
    return session.user?.email ?? null;
  } catch {
    return null;
  }
}

interface TierTheme {
  badge: string;
  tone: 'gold' | 'cyan';
  benefits: { icon: React.ComponentType<{ className?: string }>; text: string }[];
  price: string;
  ctaLabel: string;
}

const TIER_THEMES: Record<RequiredTier, TierTheme> = {
  GOLD: {
    badge: 'VEdge Gold — Pro Analyst',
    tone: 'gold',
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
    tone: 'cyan',
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
  const entitlements = useEntitlements();

  if (
    hasTierAccess(profile, requiredTier) ||
    entitlements.isPro ||
    entitlements.isStaff ||
    isFounderEmail(readSessionEmail())
  ) {
    return <>{children}</>;
  }

  const theme = TIER_THEMES[requiredTier];
  const currentTier = normalizeSubscriptionTier(profile.subscriptionTier);
  const isGoldTone = theme.tone === 'gold';
  const toneClasses = isGoldTone
    ? 'border-[hsl(var(--ve-accent-gold)/0.32)] bg-[hsl(var(--ve-accent-gold)/0.10)] text-[hsl(var(--ve-accent-gold))]'
    : 'border-[hsl(var(--ve-accent-cyan)/0.32)] bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-accent-cyan))]';
  const iconClasses = isGoldTone ? 'text-[hsl(var(--ve-accent-gold))]' : 'text-[hsl(var(--ve-accent-cyan))]';
  // A Gold user hitting a Seller Pro wall is "upgrading", not "subscribing"
  const isUpgradeFromGold = requiredTier === 'SELLER_PRO' && currentTier === 'GOLD';

  return (
    <main className="ve-page-shell flex min-h-screen items-center justify-center px-4 py-10 text-[hsl(var(--ve-text-primary))]">
      <div className="w-full max-w-xl space-y-5 text-center">

        {/* Lock icon */}
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${toneClasses}`}>
          {requiredTier === 'SELLER_PRO' ? (
            <Crown className={`h-7 w-7 ${iconClasses}`} />
          ) : (
            <Lock className={`h-7 w-7 ${iconClasses}`} />
          )}
        </div>

        <div className="space-y-2">
          <span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${toneClasses}`}>
            {theme.badge} · {theme.price}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-[hsl(var(--ve-text-primary))]">
            {featureName} {requiredTier === 'SELLER_PRO' ? 'is an Elite Feature' : 'is a Pro Feature'}
          </h1>
          <p className="text-sm leading-relaxed text-[hsl(var(--ve-text-secondary))]">
            {requiredTier === 'SELLER_PRO' ? (
              <>This is our top tier — deep research tools, your own paid pick storefront, and subscriber chat/clubs. {isUpgradeFromGold ? 'Upgrade from Gold to unlock it.' : 'Available on Research Seller PRO.'}</>
            ) : (
              <>Upgrade to <span className="font-bold text-[hsl(var(--ve-accent-gold))]">VEdge Gold</span> to unlock real-time analytics labs, signal graphs, and verified data tools.</>
            )}
          </p>
        </div>

        {/* Benefits */}
        <div className="ve-card rounded-2xl p-5 text-left space-y-3">
          {theme.benefits.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${iconClasses}`} />
              <span className="text-[hsl(var(--ve-text-secondary))]">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onNavigatePremium}
            className={isGoldTone ? 've-button-premium rounded-xl px-8 py-3.5 text-sm' : 've-button-primary rounded-xl px-8 py-3.5 text-sm'}
          >
            {isUpgradeFromGold ? 'Upgrade to Research Seller PRO' : theme.ctaLabel}
          </button>
        </div>

        <p className="text-[10px] text-[hsl(var(--ve-text-muted))]">
          Current tier: {currentTier}. Subscriptions managed securely via Stripe.
        </p>
      </div>
    </main>
  );
}

export default ProAccessGate;
