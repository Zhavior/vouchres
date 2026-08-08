import type { RequiredTier } from './proAccessUtils';
import { FREE_BETA_ALL_ACCESS } from '../../lib/betaAccess';

export interface ProAccessPresentation {
  badge: string;
  requirement: string;
  description: string;
  disclosure: string;
  ctaLabel: string;
  facts: readonly string[];
}

const ACCESS_PRESENTATION: Record<RequiredTier, ProAccessPresentation> = {
  GOLD: {
    badge: 'VouchEdge Beta',
    requirement: 'Beta research access required',
    description: 'This surface is part of the current paid MLB research workflow.',
    disclosure: '7 days free, then $7.99 per month through the current Stripe checkout.',
    ctaLabel: 'Review Beta access',
    facts: [
      'Top Player Lab research workflow',
      'Pitcher matchup intelligence',
      'Pro Graphs comparisons from current board data',
    ],
  },
  SELLER_PRO: {
    badge: 'Creator access',
    requirement: 'Seller Pro access required',
    description: 'This creator surface requires a Seller Pro entitlement.',
    disclosure: 'Seller Pro is not sold through the current VouchEdge Beta checkout.',
    ctaLabel: 'Review account access',
    facts: [
      'Your current tier remains visible on the Account page',
      'Beta checkout does not grant creator access',
      'No simulated creator tools are shown while access is locked',
    ],
  },
};

export function getProAccessPresentation(requiredTier: RequiredTier): ProAccessPresentation {
  return ACCESS_PRESENTATION[requiredTier];
}

export function hasServerAccessForTier(
  requiredTier: RequiredTier,
  entitlements: { isPro: boolean; isCreator: boolean },
): boolean {
  if (FREE_BETA_ALL_ACCESS) return true;
  return requiredTier === 'SELLER_PRO' ? entitlements.isCreator : entitlements.isPro;
}
