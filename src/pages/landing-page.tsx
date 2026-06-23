import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Shield, TrendingUp, Users, Zap, Lock, CheckCircle2, ArrowRight,
} from "lucide-react";
import { PlayerPickCard } from "@/components/player-pick-card";
import { TrustBadge } from "@/components/trust-badge";
import type { ModelScore, Market } from "@/types";

// Phase 1: demo preview only — clearly labeled, never persisted, never graded
const DEMO_PREVIEW: ModelScore = {
  id: 0,
  player_id: 0,
  game_id: 0,
  market: "hr" as Market,
  probability: 0.42,
  confidence: 0.78,
  edge: 0.08,
  risk_tier: "medium",
  reasoning: "Pull-side power spike vs FB-heavy RHP. Career .275 ISO in this park.",
  model_version: "v0.1.0",
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-gradient relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-electric-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/vouchedge-icon.svg" alt="VouchEdge" className="w-8 h-8" />
          <span className="font-extrabold tracking-tight">
            Vouch<span className="text-electric-400">Edge</span>
            <span className="text-slate-500 ml-1 text-xs font-mono">MLB</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-electric-300 transition-colors">Features</a>
          <a href="#trust" className="hover:text-electric-300 transition-colors">Trust</a>
          <a href="#pricing" className="hover:text-electric-300 transition-colors">Pricing</a>
          <a href="#legal" className="hover:text-electric-300 transition-colors">Legal</a>
        </nav>
        <Link to="/signup" className="electric-button text-sm">
          Get Started
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-16 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-[11px] font-mono text-electric-300 mb-6">
                <Sparkles className="w-3 h-3" />
                MLBXYZ ANALYTICS · VOUCHEDGE TRUST
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
                AI-powered <span className="text-electric-400 text-glow">MLB edge</span>.
                <br />
                Verified picks. Trusted cappers.
              </h1>
              <p className="mt-6 text-slate-400 text-lg max-w-md">
                Stop guessing. Get Statcast-grade probabilities, lock picks before first pitch,
                and build a verified record nobody can fake.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/signup" className="electric-button">
                  Get Started <ArrowRight className="w-4 h-4 inline ml-1" />
                </Link>
                <Link to="/login" className="ghost-button">
                  Sign in
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Picks lock at game start
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Server-graded results
                </span>
              </div>
            </motion.div>
          </div>

          {/* Astronaut/cyber visual + preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Astronaut SVG (inline, cyber-stylized) */}
            <div className="absolute -top-8 -right-4 w-32 h-32 opacity-80 pointer-events-none">
              <AstronautSvg />
            </div>
            <PlayerPickCard
              score={DEMO_PREVIEW}
              playerName="Aaron Judge"
              playerTeam="NYY"
              opponent="vs BOS"
              pitcherMatchup="LHP Brayan Bello"
            />
            <div className="mt-2 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Demo preview · not a real pick
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-y border-electric-500/10 bg-navy-900/40">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Markets modeled", value: "5", sub: "HR · Hit · RBI · Run · TB" },
            { label: "Server-graded", value: "100%", sub: "No client-reported results" },
            { label: "Trust tiers", value: "5", sub: "Unverified → Platinum" },
            { label: "Agents", value: "11", sub: "Data · Model · Grading · Trust…" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-electric-400 font-mono">{s.value}</div>
              <div className="mt-1 text-xs font-semibold text-slate-200">{s.label}</div>
              <div className="text-[10px] text-slate-500">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-extrabold tracking-tight">
          Built on a backbone. Not a feed of guesses.
        </h2>
        <p className="mt-3 text-slate-400 max-w-2xl">
          Every feature connects to a single spine: MLB data → AI model → pick card → saved pick →
          locked pick → live grading → result → user record → trust score → social feed → marketplace.
        </p>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "AI Picks Hub", body: "HR / Hit / RBI / Run / Total Bases probabilities with edge, confidence, and risk tier on every card." },
            { icon: TrendingUp, title: "Parlay Lab", body: "Safe, balanced, risky, lottery. Save before game start. Auto-grade leg by leg." },
            { icon: Shield, title: "Verified Trust", body: "Picks lock server-side. Results are system-verified. Trust score uses 6 weighted components." },
            { icon: Users, title: "Vouch System", body: "A vouch is not a like. Weighted by voucher's trust score. Decays over time. Self-vouches blocked." },
            { icon: Lock, title: "Pick Integrity", body: "Edit history, delete restrictions, posted-before-game badges, audit logs on every change." },
            { icon: CheckCircle2, title: "Premium Cyber UI", body: "Deep navy, electric blue glow, glass cards, zig-zag light lines, mobile-first with bottom nav." },
          ].map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -4 }}
              className="glass-card p-5"
            >
              <f.icon className="w-6 h-6 text-electric-400 mb-3" />
              <h3 className="font-bold text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust explanation */}
      <section id="trust" className="relative z-10 max-w-7xl mx-auto px-4 py-20 border-t border-electric-500/10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              A trust score nobody can fake.
            </h2>
            <p className="mt-4 text-slate-400">
              Most sports apps let users self-report wins. VouchEdge doesn't. Every graded pick
              comes from the server, tied to a real MLB box score. Your record is real, your
              vouches are weighted, and your level actually means something.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Server-graded results with box-score provenance",
                "Sample-size-weighted win rate (100 picks to fully unlock)",
                "Vouches weighted by voucher's trust score + recency",
                "Posted-before-game badges for transparency",
                "Penalties for deleted/edited locked picks (defensive)",
                "Demo data physically separated from real leaderboards",
              ].map((point) => (
                <div key={point} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  {point}
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-3">
              Trust score breakdown
            </div>
            <div className="space-y-2">
              {[
                { label: "Verified Performance", weight: 350, color: "bg-electric-500" },
                { label: "Volume", weight: 150, color: "bg-electric-400" },
                { label: "Vouches (weighted)", weight: 100, color: "bg-success" },
                { label: "Streak", weight: 100, color: "bg-warning" },
                { label: "Transparency", weight: 100, color: "bg-electric-300" },
                { label: "Penalty (capped)", weight: -100, color: "bg-danger" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <div className="w-40 text-xs text-slate-300">{c.label}</div>
                  <div className="flex-1 h-2 rounded-full bg-navy-700 overflow-hidden">
                    <div
                      className={`h-full ${c.color}`}
                      style={{ width: `${(Math.abs(c.weight) / 350) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs font-mono text-slate-400">
                    {c.weight > 0 ? "+" : ""}{c.weight}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-navy-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">Max score</span>
              <span className="text-2xl font-bold font-mono text-electric-300">1000</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <TrustBadge level="unverified" />
              <TrustBadge level="bronze" />
              <TrustBadge level="silver" />
              <TrustBadge level="gold" />
              <TrustBadge level="platinum" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-4 py-20 border-t border-electric-500/10">
        <h2 className="text-3xl font-extrabold tracking-tight text-center">Pricing</h2>
        <p className="mt-3 text-slate-400 text-center max-w-xl mx-auto">
          Free to start. Pro to scale. Capper tier when your record earns it.
        </p>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            {
              name: "Free", price: "$0",
              features: ["5 saves/day", "Dashboard + today's games", "Top 10 picks", "Basic feed"],
              cta: "Start free", highlight: false,
            },
            {
              name: "Pro", price: "$19/mo",
              features: ["Unlimited saves", "Parlay Lab", "Player + Game Research", "HR Lab", "Alerts + advanced filters"],
              cta: "Go Pro", highlight: true,
            },
            {
              name: "Capper", price: "$49/mo + rev share",
              features: ["Everything in Pro", "Sell picks (after Gold trust)", "Stripe Connect payouts", "Payout dashboard"],
              cta: "Apply", highlight: false,
            },
          ].map((p) => (
            <div
              key={p.name}
              className={`glass-card p-6 relative ${p.highlight ? "border-electric-500/50 shadow-glow" : ""}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-electric-500 text-navy-950 text-[10px] font-bold tracking-wider">
                  MOST POPULAR
                </div>
              )}
              <div className="text-xs text-slate-400 font-mono uppercase">{p.name}</div>
              <div className="mt-2 text-3xl font-extrabold">{p.price}</div>
              <ul className="mt-5 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-electric-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full ${p.highlight ? "electric-button" : "ghost-button"}`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Legal / responsible gambling */}
      <section id="legal" className="relative z-10 max-w-7xl mx-auto px-4 py-16 border-t border-electric-500/10">
        <div className="glass-card p-6 border-warning/30 bg-warning/5">
          <h3 className="text-sm font-bold text-warning flex items-center gap-2">
            <Shield className="w-4 h-4" /> Responsible gambling
          </h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            VouchEdge MLB is a prediction and analytics platform. We do not accept wagers. Picks
            are entertainment and informational only — not financial advice, and never a guarantee
            of outcome. Must be 21+ and in a permitted region. If gambling is a problem, call
            1-800-GAMBLER. See our Terms of Service and Privacy Policy for full terms.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <Link to="/terms" className="text-electric-300 hover:underline">Terms of Service</Link>
            <Link to="/privacy" className="text-electric-300 hover:underline">Privacy Policy</Link>
            <Link to="/responsible-gambling" className="text-electric-300 hover:underline">Responsible Gambling</Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-electric-500/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          © 2026 VouchEdge MLB / MLBXYZ Fusion · Phase 1 scaffold · Not affiliated with MLB
        </div>
      </footer>
    </div>
  );
}

function AstronautSvg() {
  return (
    <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="visor" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0A0E1A" stopOpacity="1" />
        </radialGradient>
      </defs>
      {/* Helmet */}
      <circle cx="64" cy="48" r="28" fill="#1B2240" stroke="#00D4FF" strokeWidth="1.5" />
      <circle cx="64" cy="48" r="20" fill="url(#visor)" />
      <path d="M50 40 L60 50" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
      {/* Body */}
      <path d="M44 76 L44 100 Q44 110 54 110 L74 110 Q84 110 84 100 L84 76 Z" fill="#1B2240" stroke="#00D4FF" strokeWidth="1.5" />
      {/* Chest light */}
      <circle cx="64" cy="88" r="3" fill="#00D4FF">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Arms */}
      <path d="M44 80 L32 92" stroke="#00D4FF" strokeWidth="1.5" />
      <path d="M84 80 L96 92" stroke="#00D4FF" strokeWidth="1.5" />
      {/* Stars */}
      <circle cx="20" cy="30" r="1" fill="#00D4FF" />
      <circle cx="108" cy="40" r="1" fill="#00D4FF" />
      <circle cx="16" cy="80" r="0.8" fill="#00D4FF" />
      <circle cx="112" cy="80" r="0.8" fill="#00D4FF" />
    </svg>
  );
}
