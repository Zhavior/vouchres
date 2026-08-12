import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CreditCard,
  ExternalLink,
  FlaskConical,
  Loader,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ProductEvents } from '../lib/productEvents';
import {
  fetchBillingStatus,
  openBillingPortal,
  startStripeCheckout,
  tierToSubscriptionTier,
  type BillingStatus,
} from '../lib/billingClient';
import type { CreatorProofProfile } from '../types';
import {
  buildPremiumAccessModel,
  type BillingSourceState,
} from './premiumAccessModel';
import {
  AuroraMaxCommandHeader,
  AuroraMaxControl,
  AuroraMaxEyebrow,
  AuroraMaxPanel,
  AuroraMaxRankedWorkspace,
  AuroraMaxTruthBadge,
} from './aurora-max/AuroraMaxPrimitives';
import {
  FREE_BETA_ALL_ACCESS,
  FREE_BETA_BLURB,
  PAYMENTS_ENABLED,
} from '../lib/betaAccess';
import './billing-settings-aurora-max.css';

interface PremiumSubPageProps {
  profile: CreatorProofProfile;
  onUpdateProfile: (updated: Partial<CreatorProofProfile>) => void;
}

const BASIC_FEATURES = [
  'Research the daily HR board',
  'Build and save slips',
  'Review local and backend-synced record states',
] as const;

const BETA_FEATURES = [
  'Top Player Lab research workflow',
  'Pitcher matchup intelligence',
  'Pro Graphs comparisons from current board data',
] as const;

const FREE_BETA_FEATURES = [
  'Every research surface — Top Player Lab, pitcher matchups, Pro Graphs',
  'All V.A.I rooms, AI Edge Lab, and Brain picks',
  'ParlayOS building, saving, and tracking',
  'Profile theming, notifications, and an ad-free feed',
] as const;

export function PremiumSubPage({ profile, onUpdateProfile }: PremiumSubPageProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingSourceState, setBillingSourceState] = useState<BillingSourceState>('checking');

  const refreshBilling = useCallback(async (trackCheckoutSuccess = false) => {
    setBillingSourceState('checking');
    const status = await fetchBillingStatus();

    if (!status) {
      setBillingStatus(null);
      setBillingSourceState('unavailable');
      return;
    }

    setBillingStatus(status);
    setBillingSourceState('confirmed');
    onUpdateProfile({ subscriptionTier: tierToSubscriptionTier(status.tier) });
    if (trackCheckoutSuccess) ProductEvents.proSubscribed(status.tier);
  }, [onUpdateProfile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutSucceeded = params.get('checkout') === 'success';
    void refreshBilling(checkoutSucceeded);

    if (!checkoutSucceeded) return;

    try {
      const url = new URL(window.location.href || '/', window.location.origin || 'http://localhost:3000');
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch (error) {
      console.warn('[premium] checkout URL cleanup skipped:', error);
    }
  }, [refreshBilling]);

  const model = buildPremiumAccessModel({
    profileTier: profile.subscriptionTier,
    billingStatus,
    billingSourceState,
  });

  const handleSubscribe = async () => {
    setBillingError(null);
    setCheckoutLoading(true);
    ProductEvents.checkoutStarted('pro');
    const result = await startStripeCheckout();
    setCheckoutLoading(false);

    if (result.ok) {
      window.location.href = result.url;
      return;
    }

    const checkoutError = 'error' in result ? result.error : 'Unknown checkout error';
    setBillingError(`Unable to start checkout: ${checkoutError}. Please try again or contact support.`);
  };

  const handleManageBilling = async () => {
    setBillingError(null);
    setPortalLoading(true);
    const result = await openBillingPortal();
    setPortalLoading(false);

    if (result.ok) {
      window.location.href = result.url;
      return;
    }

    const portalError = 'error' in result ? result.error : 'Unknown billing portal error';
    setBillingError(`Unable to open the billing portal: ${portalError}`);
  };

  return (
    <main className="billing-aurora-max mx-auto min-h-screen w-full max-w-[1000px] min-w-0 space-y-4 px-3 py-4 font-z8 sm:px-6 sm:py-5" id="premium-hub-panel">
      <AuroraMaxPanel as="section" className="billing-command-panel space-y-5 p-4 sm:p-5" ariaLabelledBy="billing-account-access-title">
        <AuroraMaxCommandHeader
          eyebrow={<span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden="true" /> Plan &amp; billing</span>}
          title={<span id="billing-account-access-title">Account access</span>}
          description="See what your account can open now and whether that access was confirmed by the billing source."
          meta={<AuroraMaxTruthBadge state={billingSourceState === 'confirmed' ? 'confirmed' : billingSourceState === 'checking' ? 'projected' : 'missing'}>{model.billingLabel}</AuroraMaxTruthBadge>}
        />

        <div className="billing-access-grid">
          <div className="billing-access-cell">
            <AuroraMaxEyebrow>Current access</AuroraMaxEyebrow>
            <strong>{model.accessLabel}</strong>
            <span>Tier {model.activeTier}</span>
          </div>
          <div className="billing-access-cell">
            <AuroraMaxEyebrow>Billing source</AuroraMaxEyebrow>
            <strong>{billingSourceState === 'confirmed' ? 'Connected' : billingSourceState === 'checking' ? 'Checking' : 'Unavailable'}</strong>
            <span>{model.billingDetail}</span>
          </div>
        </div>

        <div className="billing-source-row">
          <div className="min-w-0">
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
              {billingSourceState === 'checking' ? <Loader className="h-4 w-4 animate-spin text-vouch-cyan" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4 text-vouch-cyan" aria-hidden="true" />}
              {model.billingLabel}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{model.billingDetail}</p>
          </div>
          {billingSourceState === 'unavailable' && (
            <AuroraMaxControl onClick={() => void refreshBilling()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry status
            </AuroraMaxControl>
          )}
        </div>
      </AuroraMaxPanel>

      {FREE_BETA_ALL_ACCESS ? (
        <AuroraMaxRankedWorkspace title="Everything is unlocked" subtitle={FREE_BETA_BLURB} className="billing-plan-workspace">
              <div className="grid gap-3" id="upgrade-tiers-grid">
            <PlanSurface
              title="Free open beta"
              price="$0"
              cadence="No subscription, no card"
              description="Every research lab, AI surface, and building tool on the account you already have."
              features={FREE_BETA_FEATURES}
              active
              premium
              />
          </div>
        </AuroraMaxRankedWorkspace>
      ) : (
      <AuroraMaxRankedWorkspace title="Plans" subtitle="Basic stays free. Beta adds the deeper research workflow." className="billing-plan-workspace">
        <div className="grid gap-3 md:grid-cols-2" id="upgrade-tiers-grid">
          <PlanSurface
            title="Basic"
            price="$0"
            cadence="No subscription"
            description="Use the core research, slip-building, and record workflow."
            features={BASIC_FEATURES}
            active={model.activeTier === 'BASIC'}
          />

          <PlanSurface
            title="VouchEdge Beta"
            price="$7.99"
            cadence="per month after 7 free days"
            description="Open the current MLB research labs. Cancel from Stripe billing."
            features={BETA_FEATURES}
            active={model.hasPaidAccess}
            premium
          >
            {model.shouldManageBilling ? (
              <AuroraMaxControl
                onClick={() => void handleManageBilling()}
                disabled={portalLoading}
                className="w-full"
              >
                {portalLoading ? <Loader className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
                Manage billing
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </AuroraMaxControl>
            ) : (
              <AuroraMaxControl
                tone="primary"
                onClick={() => void handleSubscribe()}
                disabled={checkoutLoading}
                className="w-full"
              >
                {checkoutLoading && <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {checkoutLoading ? 'Opening secure checkout…' : 'Start 7-day free trial'}
              </AuroraMaxControl>
            )}
          </PlanSurface>
        </div>
      </AuroraMaxRankedWorkspace>
      )}

      {billingError && (
        <AuroraMaxPanel className="flex items-start gap-3 border-amber-400/20 p-4 text-sm text-amber-200" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <div>{billingError}</div>
        </AuroraMaxPanel>
      )}

      <AuroraMaxPanel as="section" className="flex items-start gap-3 p-4" ariaLabelledBy="secure-billing-title">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-vouch-cyan" aria-hidden="true" />
        <div>
          <h2 id="secure-billing-title" className="aurora-max-eyebrow text-white/55">
            {PAYMENTS_ENABLED ? 'Secure billing notice' : 'Beta access notice'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            {PAYMENTS_ENABLED
              ? 'Stripe processes checkout and subscription management. Payment changes account access only; it does not verify identity, research quality, or prediction accuracy.'
              : 'No payment is collected during the beta and no card is stored. Access is granted to every signed-in account; it does not verify identity, research quality, or prediction accuracy.'}
          </p>
        </div>
      </AuroraMaxPanel>
    </main>
  );
}

interface PlanSurfaceProps {
  title: string;
  price: string;
  cadence: string;
  description: string;
  features: readonly string[];
  active: boolean;
  premium?: boolean;
  children?: React.ReactNode;
}

function PlanSurface({
  title,
  price,
  cadence,
  description,
  features,
  active,
  premium = false,
  children,
}: PlanSurfaceProps) {
  return (
    <AuroraMaxPanel as="article" className={`billing-plan-card flex min-h-full flex-col justify-between gap-6 p-4 sm:p-5 ${premium ? 'billing-plan-card--premium' : ''}`}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-white">{title}</h3>
            {active ? <AuroraMaxTruthBadge state="confirmed">Current access</AuroraMaxTruthBadge> : null}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl font-black text-white">{price}</span>
            <span className="text-xs text-white/40">{cadence}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/50">{description}</p>
        </div>
        <ul className="space-y-2.5 border-t border-white/10 pt-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs leading-relaxed text-white/65">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-vouch-emerald" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      {children}
    </AuroraMaxPanel>
  );
}

export default PremiumSubPage;
