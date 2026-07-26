import type { BillingStatus } from '../lib/billingClient';
import { tierToSubscriptionTier } from '../lib/subscriptionTier';
import type { CreatorProofProfile } from '../types';

export type BillingSourceState = 'checking' | 'confirmed' | 'unavailable';

export interface PremiumAuroraModel {
  activeTier: NonNullable<CreatorProofProfile['subscriptionTier']>;
  accessLabel: string;
  billingLabel: string;
  billingDetail: string;
  hasPaidAccess: boolean;
  shouldManageBilling: boolean;
}

interface BuildPremiumAuroraModelInput {
  profileTier?: CreatorProofProfile['subscriptionTier'];
  billingStatus: BillingStatus | null;
  billingSourceState: BillingSourceState;
}

function humanizeBillingStatus(status: string): string {
  const normalized = status.trim().replaceAll('_', ' ');
  return normalized ? normalized.replace(/^./, (character) => character.toUpperCase()) : 'Status received';
}

export function buildPremiumAuroraModel({
  profileTier,
  billingStatus,
  billingSourceState,
}: BuildPremiumAuroraModelInput): PremiumAuroraModel {
  const profileFallback = profileTier ?? 'BASIC';
  const activeTier = billingStatus ? tierToSubscriptionTier(billingStatus.tier) : profileFallback;
  const hasPaidAccess = activeTier === 'GOLD' || activeTier === 'SELLER_PRO';

  if (billingSourceState === 'checking') {
    return {
      activeTier,
      accessLabel: hasPaidAccess ? 'Paid access in profile' : 'Basic access',
      billingLabel: 'Checking billing source',
      billingDetail: 'Aurora is waiting for the server before confirming subscription status.',
      hasPaidAccess,
      shouldManageBilling: hasPaidAccess,
    };
  }

  if (billingSourceState === 'unavailable' || !billingStatus) {
    return {
      activeTier,
      accessLabel: hasPaidAccess ? 'Paid access in profile' : 'Basic access',
      billingLabel: 'Billing source unavailable',
      billingDetail: 'Your saved access tier is shown, but live subscription status could not be confirmed.',
      hasPaidAccess,
      shouldManageBilling: hasPaidAccess,
    };
  }

  const statusLabel = humanizeBillingStatus(billingStatus.status);
  const cancellationDetail = billingStatus.cancelAtPeriodEnd
    ? 'Cancellation is scheduled at the end of the current billing period.'
    : 'Subscription status was returned by the VouchEdge billing API.';

  return {
    activeTier,
    accessLabel: hasPaidAccess ? 'Beta research access' : 'Basic access',
    billingLabel: statusLabel,
    billingDetail: cancellationDetail,
    hasPaidAccess,
    shouldManageBilling: hasPaidAccess,
  };
}
