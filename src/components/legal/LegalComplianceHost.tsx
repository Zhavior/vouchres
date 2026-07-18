import React from 'react';
import { CookieConsentBanner } from './CookieConsentBanner';
import { LegalGate } from './LegalGate';
import { useAuth } from '../../lib/useAuth';

/**
 * Mounts store/compliance chrome once:
 * - Cookie consent for all visitors
 * - LegalGate for signed-in users who have not confirmed age + jurisdiction
 */
export function LegalComplianceHost({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <>
      <CookieConsentBanner />
      {isLoggedIn ? <LegalGateIfNeeded /> : null}
    </>
  );
}

function LegalGateIfNeeded() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  if (user.age_confirmed_at && user.jurisdiction_confirmed_at) return null;
  return <LegalGate />;
}
