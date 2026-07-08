import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Trophy,
  FlaskConical,
  Coins,
  Check,
  Loader,
  AlertCircle,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { CreatorProofProfile } from '../types';
import { startStripeCheckout, openBillingPortal, fetchBillingStatus, tierToSubscriptionTier } from '../lib/billingClient';

interface PremiumSubPageProps {
  profile: CreatorProofProfile;
  onUpdateProfile: (updated: Partial<CreatorProofProfile>) => void;
}

export default function PremiumSubPage({ profile, onUpdateProfile }: PremiumSubPageProps) {
  // Stripe checkout / portal state
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // On return from Stripe checkout success, refresh billing status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      fetchBillingStatus().then((status) => {
        if (status) {
          const subTier = tierToSubscriptionTier(status.tier);
          onUpdateProfile({
            subscriptionTier: subTier,
            verified: subTier === 'GOLD' || subTier === 'SELLER_PRO',
          });
        }
      });
      // Clean up URL safely
      try {
        const url = new URL(window.location.href || '/', window.location.origin || 'http://localhost:3000');
        url.searchParams.delete('checkout');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      } catch (error) {
        console.warn('[premium] checkout URL cleanup skipped:', error);
      }
    }
  }, []);

  const handleSubscribePlan = async (tier: 'BASIC' | 'GOLD' | 'SELLER_PRO') => {
    setBillingError(null);

    if (tier === 'BASIC') {
      // Downgrade to basic — open portal to manage/cancel
      await handleManageBilling();
      return;
    }

    const stripeTier = tier === 'GOLD' ? 'gold' : 'seller_pro';
    setCheckoutLoading(tier);

    const result = await startStripeCheckout(stripeTier);
    setCheckoutLoading(null);

    if (result.ok) {
      window.location.href = result.url;
    } else {
      const errMsg = (result as { ok: false; error: string }).error;
      setBillingError(`Stripe not active yet: ${errMsg}. Activating locally for preview.`);
      onUpdateProfile({ subscriptionTier: tier, verified: true });
    }
  };

  const handleManageBilling = async () => {
    setBillingError(null);
    setPortalLoading(true);
    const result = await openBillingPortal();
    setPortalLoading(false);

    if (result.ok) {
      window.location.href = result.url;
    } else {
      const errMsg = (result as { ok: false; error: string }).error;
      setBillingError(`Portal not active yet: ${errMsg}`);
    }
  };

  const activeTier = profile.subscriptionTier || 'BASIC';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[820px] mx-auto min-h-screen bg-transparent font-z8" id="premium-hub-panel">

      {/* Title Segment */}
      <div className="flex flex-col">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-vouch-emerald" />
          Upgrade
        </h2>
        <p className="text-xs text-white/40 mt-1">
          Unlock Pro research labs, or go Capper and sell your own picks.
        </p>
      </div>

      {/* Beta support banner */}
      <div className="glass-panel glass-border rounded-2xl p-4 flex items-start gap-3 border-amber-400/20" id="upgrade-beta-banner">
        <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
          <FlaskConical className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <span className="terminal-text bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">
            Beta
          </span>
          <p className="text-sm font-bold text-white mt-1.5">Pro and Capper are in beta.</p>
          <p className="text-xs text-white/40 leading-normal mt-0.5">
            Signing up now helps support development and locks in your price — $19.99 for Pro, $34.99 for Capper — for as long as you stay subscribed. These are Beta Prices.
          </p>
        </div>
      </div>

      {/* Subscription cards segment */}
      <div className="space-y-4">
        <div className="flex flex-col">
          <h3 className="terminal-text text-white/50 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-vouch-emerald" />
            Plans
          </h3>
          <p className="text-[11px] text-white/40 mt-1">
            <span className="text-vouch-emerald font-bold">Pro ($19.99)</span> unlocks every research lab. <span className="text-vouch-cyan font-bold">Capper ($34.99)</span> adds pick selling and your own subscriber chat & clubs. These are Beta Prices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="upgrade-tiers-grid">

          {/* Tier 1: Basic */}
          <div className={`glass-panel glass-border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-200 ${
            activeTier === 'BASIC' ? 'border-white/25' : ''
          }`} id="plan-tier-basic">

            <div className="space-y-4">
              {/* Badge & Price */}
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Basic
                </h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-sans">$0</span>
                  <span className="text-white/30 text-[10px]">/ Forever Free</span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed pt-1">
                  Track picks and build slips, no cost.
                </p>
              </div>

              {/* Benefits list */}
              <div className="border-t border-white/10 pt-3.5 space-y-2.5">
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
                  <span>Build up to 20 slips inside Parlay Lab</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
                  <span>Interactive local board bookmarks</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
                  <span>Transparent unit settlement ledger</span>
                </div>
              </div>
            </div>

            {/* Sub/Claim Button */}
            <div className="pt-6">
              <button
                onClick={() => handleSubscribePlan('BASIC')}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTier === 'BASIC'
                    ? 'bg-white/[0.06] text-white/40 cursor-default'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-white'
                }`}
              >
                {activeTier === 'BASIC' ? 'Active Plan' : 'Select Plan'}
              </button>
            </div>
          </div>

          {/* Tier 2: Pro */}
          <div className={`glass-panel glass-border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-200 ${
            activeTier === 'GOLD' ? 'border-vouch-emerald/50' : ''
          }`} id="plan-tier-gold">
            <div className="absolute -top-3 left-4 flex items-center gap-1.5">
              <span className="terminal-text bg-vouch-emerald/15 text-vouch-emerald px-2.5 py-0.5 rounded-full">
                Most Popular
              </span>
              <span className="terminal-text bg-amber-400/15 text-amber-400 px-2.5 py-0.5 rounded-full">
                Beta
              </span>
            </div>

            <div className="space-y-4">
              {/* Badge & Price */}
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Pro
                  <ShieldCheck className="w-4 h-4 text-vouch-emerald" />
                </h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-vouch-emerald font-sans">$19.99</span>
                  <span className="text-white/40 text-xs">/ Month</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed pt-1">
                  Unlock all Pro analytics labs, verification & advanced graphs. Locked-in beta price — won't increase later.
                </p>
              </div>

              {/* Benefits list */}
              <div className="border-t border-white/10 pt-3.5 space-y-2.5">
                <div className="flex items-start gap-2 text-[11px] text-white/80 font-medium">
                  <ShieldCheck className="w-4 h-4 text-vouch-emerald shrink-0" />
                  <span>Verification badge on posts</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-vouch-emerald shrink-0 mt-0.5" />
                  <span>All 4 Pro Labs: Live Game, Player Edge, Team Matchup, Pro Graphs</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-vouch-emerald shrink-0 mt-0.5" />
                  <span>Real-time signal graphs & confidence meters</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-vouch-emerald shrink-0 mt-0.5" />
                  <span>1.5x feed reach algorithm boost</span>
                </div>
              </div>
            </div>

            {/* Sub/Claim Button */}
            <div className="pt-6">
              <button
                onClick={() => handleSubscribePlan('GOLD')}
                disabled={checkoutLoading === 'GOLD'}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTier === 'GOLD'
                    ? 'bg-vouch-emerald/10 text-vouch-emerald cursor-default'
                    : 'bg-vouch-emerald hover:-translate-y-0.5 text-black shadow disabled:opacity-60'
                }`}
              >
                {checkoutLoading === 'GOLD' && <Loader className="h-3.5 w-3.5 animate-spin" />}
                {activeTier === 'GOLD' ? 'Active Pro Member' : checkoutLoading === 'GOLD' ? 'Redirecting to Stripe...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>

          {/* Tier 3: Capper */}
          <div className={`glass-panel glass-border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-200 ${
            activeTier === 'SELLER_PRO' ? 'border-vouch-cyan/50' : ''
          }`} id="plan-tier-seller">

            <div className="absolute -top-3 right-4 flex items-center gap-1.5">
              <span className="terminal-text bg-vouch-cyan/15 text-vouch-cyan px-2.5 py-0.5 rounded-full">
                Monetize
              </span>
              <span className="terminal-text bg-amber-400/15 text-amber-400 px-2.5 py-0.5 rounded-full">
                Beta
              </span>
            </div>

            <div className="space-y-4">
              {/* Badge & Price */}
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Capper
                  <Coins className="w-4 h-4 text-vouch-cyan" />
                </h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-vouch-cyan font-sans">$34.99</span>
                  <span className="text-white/40 text-xs">/ Month</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed pt-1">
                  Everything in Pro, plus deep research, sell your picks, and your own subscriber chat & clubs. Locked-in beta price — won't increase later.
                </p>
              </div>

              {/* Benefits list */}
              <div className="border-t border-white/10 pt-3.5 space-y-2.5">
                <div className="flex items-start gap-2 text-[11px] text-vouch-cyan font-bold">
                  <Coins className="w-4 h-4 text-vouch-cyan shrink-0" />
                  <span>Everything in Pro + deep research suite</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-vouch-cyan shrink-0 mt-0.5" />
                  <span>Sell your picks: paid storefront, 0% commission</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-vouch-cyan shrink-0 mt-0.5" />
                  <span>Subscriber Chat & Clubs — run your own paid community</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-vouch-cyan shrink-0 mt-0.5" />
                  <span>Gated research sheets & cryptographic verification keys</span>
                </div>
              </div>
            </div>

            {/* Sub/Claim Button */}
            <div className="pt-6">
              <button
                onClick={() => handleSubscribePlan('SELLER_PRO')}
                disabled={checkoutLoading === 'SELLER_PRO'}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTier === 'SELLER_PRO'
                    ? 'bg-vouch-cyan/10 text-vouch-cyan cursor-default'
                    : 'bg-vouch-cyan hover:-translate-y-0.5 text-black shadow-md disabled:opacity-60'
                }`}
              >
                {checkoutLoading === 'SELLER_PRO' && <Loader className="h-3.5 w-3.5 animate-spin" />}
                {activeTier === 'SELLER_PRO' ? 'Active Storefront' : checkoutLoading === 'SELLER_PRO' ? 'Redirecting to Stripe...' : 'Become a Capper'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Stripe billing error / info banner */}
      {billingError && (
        <div className="glass-panel glass-border rounded-xl p-3.5 flex items-start gap-2 text-[11px] text-amber-300 leading-relaxed border-amber-400/25">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>{billingError}</div>
        </div>
      )}

      {/* Manage Billing — visible when subscribed */}
      {(activeTier === 'GOLD' || activeTier === 'SELLER_PRO') && (
        <div className="glass-panel glass-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">Manage Your Subscription</p>
            <p className="text-xs text-white/40 mt-0.5">Update payment, view invoices, or cancel anytime via the Stripe billing portal.</p>
          </div>
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="flex items-center gap-2 rounded-xl bg-vouch-cyan/10 px-4 py-2.5 text-xs font-black text-vouch-cyan hover:bg-vouch-cyan/20 transition-colors disabled:opacity-50"
          >
            {portalLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
            <span>Billing Portal</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Disclaimers warning safety first */}
      <div className="glass-panel glass-border rounded-xl p-3.5 flex items-start gap-2 text-[11px] text-white/40 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
        <div>
          <span className="terminal-text text-white/50 block mb-0.5">Secure billing notice</span>
          Subscriptions are processed securely via Stripe (test mode). Upgrading redirects to Stripe Checkout. Your subscription tier syncs back to VouchEdge after payment completes. Verified profile badges and Pro Lab access activate automatically.
        </div>
      </div>

    </div>
  );
}
