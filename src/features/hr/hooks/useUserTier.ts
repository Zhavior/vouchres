/**
 * useUserTier — composing the persisted Pro Mode toggle (Zustand) with the
 * real subscription entitlements from the backend.
 *
 * - `isProMode`    → the Zustand desk-level toggle (persisted in localStorage)
 * - `isPro`        → the real subscription gate (gold / creator / staff)
 * - `toggleProMode`→ flips the desk switch instantly
 */
import { useProMode } from './useProMode';
import { useEntitlements } from './useEntitlements';

export type UserTier = {
  isProMode: boolean;
  toggleProMode: () => void;
  isPro: boolean;
  tier: string;
  loading: boolean;
};

export function useUserTier(): UserTier {
  const [isProMode, toggleProMode] = useProMode();
  const { isPro, tier, loading } = useEntitlements();

  return {
    isProMode,
    toggleProMode,
    isPro,
    tier,
    loading,
  };
}
