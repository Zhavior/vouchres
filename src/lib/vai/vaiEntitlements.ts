import type { VaiPersonaId } from './vaiPersonas';

export type VaiAccessTier =
  | 'free'
  | 'pro'
  | 'research_seller_pro'
  | 'admin';

export interface VaiEntitlementResult {
  tier: VaiAccessTier;
  allowedPersonaIds: VaiPersonaId[];
  canSeeAllPersonas: boolean;
  reason: string;
}

const ROTATION: VaiPersonaId[] = ['banker', 'analyst', 'hunter', 'shark'];

function normalizeDateKey(dateKey?: string): string {
  if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  return new Date().toISOString().slice(0, 10);
}

export function getDailyVaiPersona(dateKey?: string): VaiPersonaId {
  const safeDateKey = normalizeDateKey(dateKey);
  const date = new Date(`${safeDateKey}T00:00:00.000Z`);
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return ROTATION[dayNumber % ROTATION.length];
}

export function getVaiEntitlements({
  tier,
  dateKey,
}: {
  tier?: VaiAccessTier | string | null;
  dateKey?: string;
}): VaiEntitlementResult {
  const normalizedTier = normalizeVaiTier(tier);

  if (normalizedTier === 'admin' || normalizedTier === 'research_seller_pro') {
    return {
      tier: normalizedTier,
      allowedPersonaIds: [...ROTATION],
      canSeeAllPersonas: true,
      reason: 'Full V.A.I research desk unlocked.',
    };
  }

  if (normalizedTier === 'pro') {
    return {
      tier: normalizedTier,
      allowedPersonaIds: [getDailyVaiPersona(dateKey)],
      canSeeAllPersonas: false,
      reason: 'Pro rotation unlocks one V.A.I room per day.',
    };
  }

  return {
    tier: 'free',
    allowedPersonaIds: [],
    canSeeAllPersonas: false,
    reason: 'Upgrade required for the locked V.A.I parlay bank.',
  };
}

export function normalizeVaiTier(tier?: VaiAccessTier | string | null): VaiAccessTier {
  const value = String(tier ?? 'free').toLowerCase().trim();

  if (value === 'admin' || value === 'owner') return 'admin';

  if (
    value === 'research_seller_pro' ||
    value === 'research-seller-pro' ||
    value === 'seller_pro' ||
    value === 'seller-pro' ||
    value === 'researcher_pro' ||
    value === 'researcher-pro'
  ) {
    return 'research_seller_pro';
  }

  if (value === 'pro' || value === 'premium' || value === 'paid') return 'pro';

  return 'free';
}
