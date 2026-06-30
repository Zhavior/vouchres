import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Trophy,
  TrendingUp,
  UserCheck,
  Coins,
  Lock,
  Mail,
  Check,
  Send,
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
  // Beta Sign Up States
  const [betaEmail, setBetaEmail] = useState('');
  const [preferredSport, setPreferredSport] = useState('MLB');
  const [isSubmittingBeta, setIsSubmittingBeta] = useState(false);
  const [isBetaRegistered, setIsBetaRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [betaRegID, setBetaRegID] = useState('');

  // Stripe checkout / portal state
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Loaded from previous beta logs
  useEffect(() => {
    const storedBeta = localStorage.getItem('vouchedge_beta_email');
    const storedBetaID = localStorage.getItem('vouchedge_beta_id');
    if (storedBeta && storedBetaID) {
      setIsBetaRegistered(true);
      setRegisteredEmail(storedBeta);
      setBetaRegID(storedBetaID);
    }
  }, []);

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

  const handleBetaSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!betaEmail.trim()) return;

    setIsSubmittingBeta(true);

    setTimeout(() => {
      const regID = `VE-BETA-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('vouchedge_beta_email', betaEmail);
      localStorage.setItem('vouchedge_beta_id', regID);
      setRegisteredEmail(betaEmail);
      setBetaRegID(regID);
      setIsSubmittingBeta(false);
      setIsBetaRegistered(true);
    }, 1200);
  };

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
    <div className="p-4 md:p-6 space-y-8 max-w-[800px] mx-auto min-h-screen bg-transparent" id="premium-hub-panel">
      
      {/* Title Segment */}
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
          VouchEdge Creator Subscription Deals
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Unleash the supreme sports portfolio tools, buy/sell research channels, and secure official verified verification checkmarks.
        </p>
      </div>

      {/* Closed Beta Sign up form segment */}
      <div className="bg-[#121824] rounded-2xl border border-slate-850 overflow-hidden relative" id="beta-signup-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-950/60 border border-sky-800/35 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-sky-450" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] bg-sky-950/50 border border-sky-900/60 text-sky-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Now Live
              </span>
              <h3 className="text-sm font-bold text-slate-100 mt-1">Join VouchEdge V2 Closed Beta</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Register your email address to lock in priority allocation for immediate V2 updates, early sports analytics feeds, and advanced charting modules.
              </p>
            </div>
          </div>

          {!isBetaRegistered ? (
            <form onSubmit={handleBetaSignUp} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1.5" id="beta-registration-form">
              <div className="sm:col-span-6 space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Email Address</label>
                <input 
                  type="email" 
                  value={betaEmail}
                  onChange={(e) => setBetaEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-sky-500/80 text-slate-100 p-2.5 rounded-xl outline-none transition-colors"
                  required
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Preferred Sport</label>
                <select
                  value={preferredSport}
                  onChange={(e) => setPreferredSport(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-sky-500/80 text-slate-100 p-2.5 rounded-xl outline-none transition-colors cursor-pointer font-semibold"
                >
                  <option value="MLB">MLB (Baseball)</option>
                  <option value="NBA">NBA (Basketball)</option>
                  <option value="NFL">NFL (Football)</option>
                  <option value="UFC">UFC (Mixed Martial Arts)</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={isSubmittingBeta}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-100 rounded-xl hover:from-sky-400 hover:to-indigo-500 transition-all font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none self-stretch"
                >
                  {isSubmittingBeta ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Locking in...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Sign up for Beta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3.5 bg-emerald-950/15 rounded-xl border border-emerald-950/40 text-xs flex items-start gap-2.5 animate-fade-in" id="beta-success-notif">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-slate-200">Excellent! You are registered for the closed VEdge Beta stream.</p>
                <p className="text-slate-400 leading-normal">
                  Our system scheduled a priority verification ticket for <span className="text-emerald-400 font-mono font-bold">{registeredEmail}</span>.
                </p>
                <div className="pt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">YOUR RESERVED QUEUE ID:</span>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-black select-all">
                    {betaRegID}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription cards segment */}
      <div className="space-y-4">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-250 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            Premium X-Style Deals Grid
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Two paywall layers: <span className="text-sky-400 font-bold">Gold ($12.99)</span> unlocks all Pro analytics labs, then <span className="text-indigo-400 font-bold">Seller PRO ($49.99)</span> adds deep research, pick selling, and subscriber chat & clubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="upgrade-tiers-grid">
          
          {/* Tier 1: Basic */}
          <div className={`rounded-2xl border bg-[#121824] p-5 flex flex-col justify-between relative transition-all duration-200 ${
            activeTier === 'BASIC'
              ? 'ring-2 ring-slate-700 border-slate-600 shadow-xl'
              : 'border-slate-850 hover:border-slate-750'
          }`} id="plan-tier-basic">
            
            <div className="space-y-4">
              {/* Badge & Price */}
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  VEdge Basic
                </h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-100 font-sans">$0</span>
                  <span className="text-slate-500 text-[10px] font-mono">/ Forever Free</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Enjoy custom local ledger auditing tools & read standard creator posts.
                </p>
              </div>

              {/* Benefits list */}
              <div className="border-t border-slate-850 pt-3.5 space-y-2.5">
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <Check className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>Build up to 20 slips inside Parlay Lab</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <Check className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>Interactive local board bookmarks</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <Check className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
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
                    ? 'bg-slate-800 text-slate-400 cursor-default'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-100'
                }`}
              >
                {activeTier === 'BASIC' ? 'Active Plan' : 'Select Plan'}
              </button>
            </div>
          </div>

          {/* Tier 2: Gold (Verified Checkmark) */}
          <div className={`rounded-2xl border bg-[#121824] p-5 flex flex-col justify-between relative transition-all duration-200 ${
            activeTier === 'GOLD'
              ? 'ring-2 ring-sky-500/80 border-sky-500/60 shadow-xl'
              : 'border-sky-950 hover:border-sky-900/60'
          }`} id="plan-tier-gold">
            <div className="absolute -top-3 left-4 bg-sky-500 text-slate-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow">
              Most Popular
            </div>

            <div className="space-y-4">
              {/* Badge & Price */}
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  VEdge Gold
                  <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-sky-400 font-sans">$12.99</span>
                  <span className="text-slate-400 text-xs font-mono">/ Month</span>
                </div>
                <p className="text-[11px] text-slate-350 leading-relaxed pt-1">
                  Layer 1 — Unlock all Pro analytics labs, verification & advanced graphs.
                </p>
              </div>

              {/* Benefits list */}
              <div className="border-t border-slate-850 pt-3.5 space-y-2.5">
                <div className="flex items-start gap-2 text-[11px] text-slate-200 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Emerald Verification Badge on Posts</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>All 4 Pro Labs: Live Game, Player Edge, Team Matchup, Pro Graphs</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>Real-time signal graphs & confidence meters</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
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
                    ? 'bg-sky-950/40 border border-sky-800/40 text-sky-400 cursor-default'
                    : 'bg-sky-500 hover:bg-sky-450 text-white shadow disabled:opacity-60'
                }`}
              >
                {checkoutLoading === 'GOLD' && <Loader className="h-3.5 w-3.5 animate-spin" />}
                {activeTier === 'GOLD' ? 'Active Gold Member' : checkoutLoading === 'GOLD' ? 'Redirecting to Stripe...' : 'Upgrade to Gold'}
              </button>
            </div>
          </div>

          {/* Tier 3: Research Seller PRO */}
          <div className={`rounded-2xl border p-5 flex flex-col justify-between relative transition-all duration-200 bg-gradient-to-b from-[#121824] to-[#12102e] ${
            activeTier === 'SELLER_PRO'
              ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-xl'
              : 'border-indigo-950 hover:border-indigo-900/60 animate-glowing-glow'
          }`} id="plan-tier-seller">
            
            <div className="absolute -top-3 right-4 bg-indigo-600 text-slate-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow">
              Monetize
            </div>

            <div className="space-y-4">
              {/* Badge & Price */}
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  Research Seller PRO
                  <Coins className="w-4 h-4 text-indigo-400 animate-bounce" />
                </h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-indigo-400 font-sans">$49.99</span>
                  <span className="text-slate-400 text-xs font-mono">/ Month</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  Layer 2 — Everything in Gold, plus deep research, sell your picks, and your own subscriber chat & clubs.
                </p>
              </div>

              {/* Benefits list */}
              <div className="border-t border-indigo-950/70 pt-3.5 space-y-2.5">
                <div className="flex items-start gap-2 text-[11px] text-indigo-300 font-bold">
                  <Coins className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Everything in Gold + deep research suite</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-200">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Sell your picks: paid storefront, 0% commission</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-200">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Subscriber Chat & Clubs — run your own paid community</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-200">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
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
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md disabled:opacity-60'
                }`}
              >
                {checkoutLoading === 'SELLER_PRO' && <Loader className="h-3.5 w-3.5 animate-spin" />}
                {activeTier === 'SELLER_PRO' ? 'Active Storefront' : checkoutLoading === 'SELLER_PRO' ? 'Redirecting to Stripe...' : 'Go Pro & Sell Picks'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Stripe billing error / info banner */}
      {billingError && (
        <div className="p-3.5 bg-amber-900/25 rounded-xl border border-amber-700/40 flex items-start gap-2 text-[11px] text-amber-200 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>{billingError}</div>
        </div>
      )}

      {/* Manage Billing — visible when subscribed */}
      {(activeTier === 'GOLD' || activeTier === 'SELLER_PRO') && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-200">Manage Your Subscription</p>
            <p className="text-xs text-slate-500 mt-0.5">Update payment, view invoices, or cancel anytime via the Stripe billing portal.</p>
          </div>
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-xs font-black text-cyan-200 hover:bg-cyan-400/20 transition-colors disabled:opacity-50"
          >
            {portalLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
            <span>Billing Portal</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Disclaimers warning safety first */}
      <div className="p-3.5 bg-slate-900/65 rounded-xl border border-slate-850 flex items-start gap-2 text-[11px] text-slate-450 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-350 block mb-0.5 font-bold uppercase">SECURE BILLING NOTICE:</span>
          Subscriptions are processed securely via Stripe (test mode). Upgrading redirects to Stripe Checkout. Your subscription tier syncs back to VouchEdge after payment completes. Verified profile badges and Pro Lab access activate automatically.
        </div>
      </div>

    </div>
  );
}
