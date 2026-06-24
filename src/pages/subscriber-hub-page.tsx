/**
 * SubscriberHubPage — Premium subscription and plan upgrade page.
 * Uses billingApi for checkout/upgrade, useAuthStore for current plan.
 */
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, ShieldCheck, Trophy, TrendingUp, Check, Lock, Loader } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { billingApi } from "@/services/billing";

interface Plan {
  id: string;
  label: string;
  price: string;
  perks: string[];
  cta: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    label: "VEdge Basic",
    price: "$9.99/mo",
    perks: [
      "Full AI Picks access",
      "Vouch Board participation",
      "Trust Score tracking",
      "Social feed & community",
    ],
    cta: "Upgrade to Basic",
  },
  {
    id: "gold",
    label: "VEdge Gold",
    price: "$24.99/mo",
    perks: [
      "Everything in Basic",
      "Verified profile badge",
      "Priority AI picks",
      "Advanced parlay optimizer",
      "Player deep dives",
    ],
    cta: "Upgrade to Gold",
    highlight: true,
  },
  {
    id: "pro",
    label: "Seller PRO",
    price: "$49.99/mo",
    perks: [
      "Everything in Gold",
      "Sell picks to community",
      "Creator storefront",
      "Revenue tracking & payouts",
      "Dedicated account manager",
    ],
    cta: "Go PRO",
  },
];

export function SubscriberHubPage() {
  const me = useAuthStore((s) => s.me);
  const currentPlan = me?.plan ?? "FREE";

  const { data: billingStatus } = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => billingApi.status(),
    enabled: !!me,
  });

  const [loading, setLoading] = useState<string | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => billingApi.checkout({ plan: planId }),
    onSuccess: (data) => {
      // TODO: redirect to Stripe checkout URL when /v1/billing/checkout returns a URL
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout started! (TODO: wire up Stripe redirect)");
      }
      setLoading(null);
    },
    onError: () => {
      setLoading(null);
    },
  });

  const handleUpgrade = (planId: string) => {
    setLoading(planId);
    checkoutMutation.mutate(planId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="text-center space-y-2 animate-slide-up">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "var(--ve-badge-bg)", border: "1px solid var(--ve-badge-border)" }}>
            <Sparkles className="w-7 h-7" style={{ color: "var(--ve-accent)" }} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wider starwars-font-crawl">
          VOUCH<span className="starwars-font-solid">EDGE</span> PREMIUM
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Elevate your picks game. Earn trust, unlock tools, build your proof record.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)", border: "1px solid var(--ve-badge-border)" }}>
          Current plan: {currentPlan}
        </div>
      </div>

      {/* Billing status */}
      {billingStatus?.active && (
        <div className="ve-card p-4 flex items-center gap-3 border-l-4 border-emerald-500">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-sm font-bold text-emerald-400">Active Subscription</div>
            <div className="text-xs text-slate-400">{billingStatus.plan_label ?? currentPlan} · Renews {billingStatus.renews_at ?? "soon"}</div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`ve-card p-5 flex flex-col gap-4 relative ${plan.highlight ? "ring-2 ring-sky-500/50" : ""}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #4f46e5)" }}>
                  Most Popular
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                {plan.highlight ? (
                  <Trophy className="w-4 h-4 text-amber-400" />
                ) : plan.id === "pro" ? (
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                )}
                <h3 className="font-bold text-slate-100 text-sm">{plan.label}</h3>
              </div>
              <div className="text-xl font-black font-mono" style={{ color: "var(--ve-accent)" }}>{plan.price}</div>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {perk}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={loading === plan.id || currentPlan.toLowerCase() === plan.id}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
                currentPlan.toLowerCase() === plan.id
                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800 cursor-default"
                  : plan.highlight
                  ? "electric-button"
                  : "ve-button-ghost"
              }`}
            >
              {loading === plan.id ? (
                <><Loader className="w-3.5 h-3.5 animate-spin" /> Processing...</>
              ) : currentPlan.toLowerCase() === plan.id ? (
                <><Check className="w-3.5 h-3.5" /> Current Plan</>
              ) : (
                <>{plan.cta}</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Capper apply section */}
      <div className="ve-card p-5 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <Lock className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Apply to Become a Capper</h3>
            <p className="text-xs text-slate-400">Build your proof record and unlock monetization tools.</p>
          </div>
        </div>
        <button
          onClick={() => billingApi.applyCapper()}
          className="ve-button-ghost text-xs flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" /> Apply Now
        </button>
      </div>
    </div>
  );
}
