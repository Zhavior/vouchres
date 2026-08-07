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
import {
  AURORA_LABEL,
  AURORA_PANEL,
  AURORA_PANEL_PREMIUM,
  AURORA_SURFACE,
} from '../theme/auroraTokens';
import type { CreatorProofProfile } from '../types';
import {
  buildPremiumAuroraModel,
  type BillingSourceState,
} from './premiumAuroraModel';
import {
  FREE_BETA_ALL_ACCESS,
  FREE_BETA_BLURB,
  FREE_BETA_HEADLINE,
  PAYMENTS_ENABLED,
} from '../lib/betaAccess';

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

  const model = buildPremiumAuroraModel({
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
    <main className="mx-auto min-h-screen max-w-[900px] space-y-4 p-3 font-z8 sm:p-5" id="premium-hub-panel">
      <section className={`${AURORA_PANEL_PREMIUM} space-y-5 p-5 sm:p-6`} aria-labelledby="aurora-account-access-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-2">
            <p className={`${AURORA_LABEL} flex items-center gap-2 text-vouch-cyan`}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Aurora account
            </p>
            <h1 id="aurora-account-access-title" className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Account access
            </h1>
            <p className="text-sm leading-relaxed text-white/55">
              See what your account can open now and whether that access was confirmed by the billing source.
            </p>
          </div>
          <div className={`${AURORA_SURFACE} min-w-[180px] p-3`}>
            <div className={`${AURORA_LABEL} text-white/40`}>Current access</div>
            <div className="mt-1 text-lg font-black text-white">{model.accessLabel}</div>
            <div className="mt-1 font-mono text-[11px] text-vouch-cyan">Tier {model.activeTier}</div>
          </div>
        </div>

        <div className={`${AURORA_SURFACE} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="min-w-0">
            <div className={`${AURORA_LABEL} text-white/40`}>Billing source</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
              {billingSourceState === 'checking' ? <Loader className="h-4 w-4 animate-spin text-vouch-cyan" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4 text-vouch-cyan" aria-hidden="true" />}
              {model.billingLabel}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{model.billingDetail}</p>
          </div>
          {billingSourceState === 'unavailable' && (
            <button
              type="button"
              onClick={() => void refreshBilling()}
              className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-bold text-white transition-colors hover:border-vouch-cyan/40 hover:text-vouch-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry status
            </button>
          )}
        </div>
      </section>

      {FREE_BETA_ALL_ACCESS ? (
        <section className="space-y-3" aria-labelledby="aurora-plan-choice-title">
          <div>
            <p className={`${AURORA_LABEL} text-vouch-cyan`}>{FREE_BETA_HEADLINE}</p>
            <h2 id="aurora-plan-choice-title" className="mt-1 text-xl font-black text-white">Everything is unlocked</h2>
            <p className="mt-1 text-xs text-white/45">{FREE_BETA_BLURB}</p>
          </div>

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
        </section>
      ) : (
      <section className="space-y-3" aria-labelledby="aurora-plan-choice-title">
        <div>
          <p className={`${AURORA_LABEL} text-vouch-cyan`}>Choose by need</p>
          <h2 id="aurora-plan-choice-title" className="mt-1 text-xl font-black text-white">Plans</h2>
          <p className="mt-1 text-xs text-white/45">Basic stays free. Beta adds the deeper research workflow.</p>
        </div>

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
              <button
                type="button"
                onClick={() => void handleManageBilling()}
                disabled={portalLoading}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 px-4 text-xs font-black text-vouch-cyan transition-colors hover:bg-vouch-cyan/15 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan"
              >
                {portalLoading ? <Loader className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
                Manage billing
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubscribe()}
                disabled={checkoutLoading}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-vouch-emerald px-4 text-xs font-black text-black transition-colors hover:bg-vouch-emerald/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan"
              >
                {checkoutLoading && <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {checkoutLoading ? 'Opening secure checkout…' : 'Start 7-day free trial'}
              </button>
            )}
          </PlanSurface>
        </div>
      </section>
      )}

      {billingError && (
        <section className={`${AURORA_PANEL} flex items-start gap-3 p-4 text-sm text-amber-200`} role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <div>{billingError}</div>
        </section>
      )}

      <section className={`${AURORA_PANEL} flex items-start gap-3 p-4`} aria-labelledby="aurora-secure-billing-title">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-vouch-cyan" aria-hidden="true" />
        <div>
          <h2 id="aurora-secure-billing-title" className={`${AURORA_LABEL} text-white/55`}>
            {PAYMENTS_ENABLED ? 'Secure billing notice' : 'Beta access notice'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            {PAYMENTS_ENABLED
              ? 'Stripe processes checkout and subscription management. Payment changes account access only; it does not verify identity, research quality, or prediction accuracy.'
              : 'No payment is collected during the beta and no card is stored. Access is granted to every signed-in account; it does not verify identity, research quality, or prediction accuracy.'}
          </p>
        </div>
      </section>
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
    <article className={`${premium ? AURORA_PANEL_PREMIUM : AURORA_PANEL} flex min-h-full flex-col justify-between gap-6 p-5`}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-white">{title}</h3>
            {active && <span className="rounded-full border border-vouch-emerald/30 bg-vouch-emerald/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-vouch-emerald">Current access</span>}
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
    </article>
  );
}

export default PremiumSubPage;
