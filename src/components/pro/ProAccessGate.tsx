import type { ReactNode } from 'react';
import { Check, Crown, Lock } from 'lucide-react';
import type { CreatorProofProfile } from '../../types';
import { useEntitlements } from '../../features/hr/hooks/useEntitlements';
import { isFounderEmail } from '../../lib/founderAccess';
import { FREE_BETA_ALL_ACCESS } from '../../lib/betaAccess';
import {
  AURORA_LABEL,
  AURORA_PANEL_PREMIUM,
  AURORA_SURFACE,
} from '../../theme/auroraTokens';
import { getProAccessPresentation, hasServerAccessForTier } from './proAccessPresentation';
import {
  hasTierAccess,
  normalizeSubscriptionTier,
  type RequiredTier,
} from './proAccessUtils';

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

interface ProAccessGateProps {
  profile: CreatorProofProfile;
  featureName?: string;
  requiredTier?: RequiredTier;
  onNavigatePremium?: () => void;
  children: ReactNode;
}

export function ProAccessGate({
  profile,
  featureName = 'Research surface',
  requiredTier = 'GOLD',
  onNavigatePremium,
  children,
}: ProAccessGateProps) {
  const entitlements = useEntitlements();

  // Free open beta: nothing is gated, so don't make anyone wait on the
  // entitlements query just to be let through.
  if (FREE_BETA_ALL_ACCESS) {
    return <>{children}</>;
  }

  if (entitlements.loading) {
    return (
      <main className="ve-page-shell flex min-h-[50vh] items-center justify-center px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-vouch-cyan" role="status" aria-label="Checking access" />
      </main>
    );
  }

  const hasServerEntitlement = hasServerAccessForTier(requiredTier, entitlements);
  const hasOverride = entitlements.isStaff || isFounderEmail(readSessionEmail());

  if (hasTierAccess(profile, requiredTier) || hasServerEntitlement || hasOverride) {
    return <>{children}</>;
  }

  const presentation = getProAccessPresentation(requiredTier);
  const currentTier = normalizeSubscriptionTier(profile.subscriptionTier);
  const isCreatorRequirement = requiredTier === 'SELLER_PRO';

  return (
    <main className="ve-page-shell flex min-h-screen items-center justify-center px-3 py-8 text-white sm:px-4 sm:py-10">
      <section className={`${AURORA_PANEL_PREMIUM} w-full max-w-xl space-y-5 p-5 text-left sm:p-6`} aria-labelledby="aurora-access-gate-title">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan">
            {isCreatorRequirement ? <Crown className="h-5 w-5" aria-hidden="true" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className={`${AURORA_LABEL} text-vouch-cyan`}>{presentation.badge}</p>
            <h1 id="aurora-access-gate-title" className="text-2xl font-black tracking-tight text-white">{featureName}</h1>
            <p className="text-sm font-bold text-white/75">{presentation.requirement}</p>
          </div>
        </div>

        <div>
          <p className="text-sm leading-relaxed text-white/55">{presentation.description}</p>
          <p className="mt-2 text-xs leading-relaxed text-amber-200/75">{presentation.disclosure}</p>
        </div>

        <ul className={`${AURORA_SURFACE} space-y-3 p-4`}>
          {presentation.facts.map((fact) => (
            <li key={fact} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/60">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-vouch-emerald" aria-hidden="true" />
              <span>{fact}</span>
            </li>
          ))}
        </ul>

        {onNavigatePremium && (
          <button
            type="button"
            onClick={onNavigatePremium}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-vouch-cyan px-5 text-sm font-black text-black transition-colors hover:bg-vouch-cyan/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan"
          >
            {presentation.ctaLabel}
          </button>
        )}

        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/35">
          Profile tier {currentTier} · access checked against account entitlements
        </p>
      </section>
    </main>
  );
}

export default ProAccessGate;
