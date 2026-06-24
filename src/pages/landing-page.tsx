import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Shield, TrendingUp, Users, Zap, Lock, CheckCircle2, ArrowRight,
} from "lucide-react";
import { TrustPickCard } from "@/components/trust-pick-card";



const DEMO_PREVIEW = {
  player_id: 0,
  player_name: "Aaron Judge",
  team_abbr: "NYY",
  opponent_abbr: "BOS",
  game_id: 0,
  market: "hr",
  line: 0.5,
  probability: 0.42,
  confidence: 0.78,
  edge: 0.08,
  risk_tier: "medium",
  model_version: "v0.1.0",
  reasoning: "Pull-side power spike vs FB-heavy RHP. Career .275 ISO in this park.",
};

export function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #020617 15%, #050810 35%, #0A0E1A 60%, #0A0E1A 100%)" }}>
      {/* Starfield — fades from top (black/space) into the blue background */}
      <StarfieldFade />

      {/* Electric blue glow orb (existing, positioned lower) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-electric-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-navy-900 border border-electric-500/30 flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-5 h-5">
              <path d="M32 8 L52 18 V38 L32 56 L12 38 V18 Z" stroke="#00D4FF" strokeWidth="3" fill="rgba(0,212,255,0.08)"/>
              <circle cx="32" cy="30" r="7" fill="#00D4FF"/>
            </svg>
          </div>
          <span className="font-extrabold tracking-tight">
            <span className="text-slate-100" style={{ textShadow: "0 0 10px rgba(0,212,255,0.3)" }}>Vouch</span>
            <span className="text-electric-400" style={{ textShadow: "0 0 15px rgba(0,212,255,0.8), 0 0 30px rgba(0,212,255,0.4)" }}>Edge</span>
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
      <section className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-[11px] font-mono text-electric-300 mb-6">
                <Sparkles className="w-3 h-3" />
                MLB INTELLIGENCE · VERIFIED CAPPER RECORDS
              </span>

              {/* VouchEdge — glowing like the nav logo */}
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
                <span style={{ textShadow: "0 0 10px rgba(0,212,255,0.3)" }}>Vouch</span>
                <span className="text-electric-400" style={{ textShadow: "0 0 20px rgba(0,212,255,0.9), 0 0 40px rgba(0,212,255,0.5)" }}>Edge</span>
                <span className="block text-2xl md:text-3xl mt-2 text-slate-300">
                  MLB Intelligence. Verified.
                </span>
                <span className="block text-xl md:text-2xl text-slate-400 font-semibold mt-1">
                  Research-grade AI picks. Transparent records. Real capper accountability.
                </span>
              </h1>

              <p className="mt-6 text-slate-400 text-lg max-w-md">
                Stop guessing. VouchEdge brings Statcast-grade probability analysis, AI-powered matchup research, and verified capper records — all in one platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/signup" className="electric-button">
                  Start Free — No Card Needed <ArrowRight className="w-4 h-4 inline ml-1" />
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

          {/* Astronaut + preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Astronaut — floating up and down */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-12 -right-8 w-72 h-72 md:w-80 md:h-80 pointer-events-none z-20"
            >
              <AstronautSvg />
            </motion.div>

            {/* Black-to-blue fade behind astronaut */}
            <div
              className="absolute -top-16 -right-16 w-96 h-96 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(2,6,23,0.3) 40%, transparent 70%)",
              }}
            />

            <TrustPickCard
              pick={DEMO_PREVIEW}
            />
            <div className="mt-2 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Demo preview · not a real pick
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-y border-electric-500/10 bg-navy-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Markets modeled", value: "5", sub: "HR · Hit · RBI · Run · TB" },
            { label: "Server-graded", value: "100%", sub: "No client-reported results" },
            { label: "Trust tiers", value: "5", sub: "Unverified → Platinum" },
            { label: "Agents", value: "11", sub: "Data · Model · Grading · Trust…" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-electric-400 font-mono" style={{ textShadow: "0 0 12px rgba(0,212,255,0.4)" }}>{s.value}</div>
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
              className="glass-card glass-card-hover p-5"
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
              <span className="text-2xl font-bold font-mono text-electric-300" style={{ textShadow: "0 0 12px rgba(0,212,255,0.5)" }}>1000</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="ve-badge">Unverified</span>
              <span className="ve-badge" style={{ color: "var(--ve-warning)" }}>Bronze</span>
              <span className="ve-badge" style={{ color: "var(--ve-text-muted)" }}>Silver</span>
              <span className="ve-badge" style={{ color: "var(--ve-warning)" }}>Gold</span>
              <span className="ve-badge" style={{ color: "var(--ve-accent)" }}>Platinum</span>
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
          © 2026 VouchEdge MLB / MLBXYZ Fusion · Not affiliated with MLB
        </div>
      </footer>
    </div>
  );
}

/* ====================== STARFIELD BACKGROUND ====================== */
function StarfieldFade() {
  // Generate static stars with random positions (fixed on first render)
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.6 + 0.2,
    delay: Math.random() * 3,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Stars — only visible in the top portion (fade into blue) */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 55%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 55%)",
        }}
      >
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
            animate={{ opacity: [star.opacity, star.opacity * 0.3, star.opacity] }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Subtle grid pattern in the lower portion (existing cyber feel) */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 40%, black 70%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 40%, black 70%, black 100%)",
        }}
      >
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>
    </div>
  );
}

/* ====================== ASTRONAUT SVG (copied from Google AI version) ====================== */
function AstronautSvg() {
  return (
    <svg viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="visor-grad" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0A0E1A" stopOpacity="1" />
        </radialGradient>
        <filter id="neon-cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="neon-red-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Cosmic silhouette shadow */}
      <path
        d="M 370 120 C 360 80, 460 75, 460 120 C 460 140, 440 180, 445 195 L 480 205 L 540 210 L 620 210 L 685 190 L 695 242 L 635 255 L 530 238 L 430 242 L 350 248 L 230 338 L 175 348 L 140 312 L 235 275 L 285 175 Z"
        fill="none" stroke="#030712" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"
      />

      {/* Life support backpack */}
      <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 342 142 L 322 146 L 312 224 L 332 220 Z" stroke="#38bdf8" strokeWidth="2" />
        <line x1="334" y1="144" x2="324" y2="222" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="328" y1="145" x2="318" y2="223" stroke="#e2e8f0" strokeWidth="1" />
        <path d="M 318 205 Q 295 220, 290 240 T 320 262 Q 345 264 345 235" stroke="#38bdf8" strokeWidth="2.4" />
        <path d="M 318 205 Q 295 220, 290 240 T 320 262 Q 345 264 345 235" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
      </g>

      {/* Right arm with NASA mission patch */}
      <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M 358 180 C 330 168, 295 182, 276 198 L 250 214 C 238 218, 226 210, 232 198 L 246 186" />
        <path d="M 350 176 C 338 174, 332 180, 332 184" strokeWidth="0.8" />
        <path d="M 342 180 C 328 178, 322 184, 322 188" strokeWidth="0.8" />
        <path d="M 326 182 C 314 180, 310 186, 310 190" strokeWidth="0.8" />
        <path d="M 314 186 C 304 184, 300 190, 300 194" strokeWidth="0.8" />
        <path d="M 298 190 C 288 188, 284 194, 284 198" strokeWidth="0.8" />
        <path d="M 264 196 L 258 208" stroke="#38bdf8" strokeWidth="1.8" />
        {/* Mission patch */}
        <circle cx="316" cy="186" r="10.5" stroke="#38bdf8" strokeWidth="1.6" />
        <circle cx="316" cy="186" r="6" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="2 2" />
        <path d="M 310 190 Q 316 182 322 188" stroke="#f43f5e" strokeWidth="1" />
        <line x1="316" y1="181" x2="316" y2="191" stroke="#38bdf8" strokeWidth="0.8" />
        <line x1="311" y1="186" x2="321" y2="186" stroke="#38bdf8" strokeWidth="0.8" />
      </g>

      {/* Left arm with US Flag */}
      <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M 438 198 C 472 204, 510 208, 544 214" strokeWidth="1.8" />
        <path d="M 432 214 C 466 218, 502 222, 534 230" strokeWidth="1.8" />
        <path d="M 454 200 C 452 208, 456 214, 458 214" strokeWidth="0.8" />
        <path d="M 474 202 C 472 210, 476 216, 478 216" strokeWidth="0.8" />
        <path d="M 494 204 C 492 212, 496 218, 498 218" strokeWidth="0.8" />
        <path d="M 514 206 C 512 215, 516 220, 518 220" strokeWidth="0.8" />
        <rect x="478" y="184" width="18" height="11" rx="0.5" transform="rotate(6 478 184)" stroke="#38bdf8" strokeWidth="1.4" />
        <rect x="480" y="186" width="7" height="5.5" fill="#38bdf8" />
        <line x1="487" y1="187" x2="495" y2="188" stroke="#ffffff" strokeWidth="0.6" />
        <line x1="487" y1="189" x2="495" y2="190" stroke="#f43f5e" strokeWidth="0.6" />
        <line x1="487" y1="191" x2="495" y2="192" stroke="#ffffff" strokeWidth="0.6" />
        <line x1="480" y1="193" x2="495" y2="194.5" stroke="#f43f5e" strokeWidth="0.6" />
        <line x1="480" y1="194.5" x2="495" y2="196" stroke="#ffffff" strokeWidth="0.6" />
      </g>

      {/* Torso with chest panel */}
      <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 368 175 L 442 181 L 434 202 L 418 244" strokeWidth="1.8" />
        <path d="M 350 184 L 358 238 L 418 244" strokeWidth="1.8" />
        <path d="M 362 192 C 388 196, 412 198, 428 200" strokeWidth="1" />
        <path d="M 360 204 C 386 208, 410 210, 426 211" strokeWidth="1" />
        <path d="M 358 216 C 384 220, 408 221, 423 222" strokeWidth="1" />
        <path d="M 356 228 C 382 232, 404 232, 418 232" strokeWidth="1" />
        <line x1="364" y1="181" x2="368" y2="190" stroke="#888888" strokeWidth="0.5" />
        <line x1="370" y1="182" x2="374" y2="191" stroke="#888888" strokeWidth="0.5" />
        <line x1="376" y1="183" x2="380" y2="192" stroke="#888888" strokeWidth="0.5" />
        <line x1="428" y1="187" x2="424" y2="198" stroke="#888888" strokeWidth="0.5" />
        <line x1="434" y1="188" x2="430" y2="199" stroke="#888888" strokeWidth="0.5" />
        {/* Chest control console */}
        <rect x="368" y="196" width="46" height="28" rx="2" fill="#05070f" stroke="#38bdf8" strokeWidth="1.8" />
        <circle cx="377" cy="204" r="3" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="377" y1="201" x2="377" y2="204" stroke="#f43f5e" strokeWidth="0.8" />
        <circle cx="386" cy="202" r="1.5" fill="#f43f5e" filter="url(#neon-red-glow)" />
        <circle cx="386" cy="206" r="1.5" fill="#10b981" />
        {/* SMITH nameplate */}
        <rect x="393" y="200" width="18" height="8" rx="1" fill="#ffffff" stroke="none" />
        <text x="402" y="206.5" fontFamily="'JetBrains Mono', monospace" fontSize="6" fontWeight="900" textAnchor="middle" fill="#030712" stroke="none">SMITH</text>
        <rect x="374" y="212" width="28" height="6" fill="#111827" stroke="#64748b" strokeWidth="0.8" />
        <line x1="378" y1="215" x2="398" y2="215" stroke="#f43f5e" strokeWidth="1.1" />
        <circle cx="406" cy="215" r="1" fill="#38bdf8" />
      </g>

      {/* Helmet with antenna */}
      <g>
        <ellipse cx="408" cy="173" rx="22" ry="5.5" fill="#05070f" stroke="#38bdf8" strokeWidth="1.8" />
        <line x1="386" y1="172" x2="386" y2="175" stroke="#ffffff" strokeWidth="2.2" />
        <line x1="430" y1="172" x2="430" y2="175" stroke="#ffffff" strokeWidth="2.2" />
        <path d="M 390 171 Q 408 174 426 171" stroke="#e2e8f0" strokeWidth="0.8" />
        <circle cx="408" cy="142" r="32" fill="none" stroke="#ffffff" strokeWidth="2.2" filter="url(#neon-cyan-glow)" />
        {/* Antenna */}
        <rect x="428" y="117" width="5" height="4" rx="1" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" transform="rotate(35 428 117)" />
        <line x1="431" y1="115" x2="445" y2="72" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="445" cy="72" r="2.5" fill="#f43f5e" filter="url(#neon-red-glow)" />
        {/* Visor */}
        <path d="M 380 142 C 380 122, 436 122, 436 142 C 436 162, 380 162, 380 142 Z" fill="#030712" stroke="#38bdf8" strokeWidth="2.2" />
        <path d="M 382 142 C 382 124, 434 124, 434 142 C 434 160, 382 160, 382 142 Z" fill="rgba(10,15,30,0.95)" />
        {/* Stars in visor */}
        <circle cx="394" cy="132" r="0.8" fill="#ffffff" />
        <circle cx="423" cy="133" r="0.6" fill="#38bdf8" />
        <circle cx="388" cy="148" r="0.7" fill="#f43f5e" />
        <circle cx="425" cy="151" r="0.8" fill="#ffffff" />
        {/* Baseball reflection */}
        <g className="animate-pulse" style={{ animationDuration: "4s" }}>
          <circle cx="408" cy="142" r="11.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
          <path d="M 401.5 133.5 A 9 9 0 0 0 401.5 150.5" fill="none" stroke="#f43f5e" strokeWidth="0.9" />
          <line x1="400" y1="135" x2="401.5" y2="136.5" stroke="#f43f5e" strokeWidth="0.6" />
          <line x1="399" y1="139" x2="400.5" y2="140.5" stroke="#f43f5e" strokeWidth="0.6" />
          <line x1="398.5" y1="143" x2="400" y2="144.5" stroke="#f43f5e" strokeWidth="0.6" />
          <line x1="399" y1="147" x2="400.5" y2="148.5" stroke="#f43f5e" strokeWidth="0.6" />
          <path d="M 414.5 133.5 A 9 9 0 0 1 414.5 150.5" fill="none" stroke="#f43f5e" strokeWidth="0.9" />
          <line x1="416" y1="135" x2="414.5" y2="136.5" stroke="#f43f5e" strokeWidth="0.6" />
          <line x1="417" y1="139" x2="415.5" y2="140.5" stroke="#f43f5e" strokeWidth="0.6" />
          <line x1="417.5" y1="143" x2="416" y2="144.5" stroke="#f43f5e" strokeWidth="0.6" />
          <line x1="417" y1="147" x2="415.5" y2="148.5" stroke="#f43f5e" strokeWidth="0.6" />
        </g>
        <path d="M 386 134 A 20 20 0 0 1 405 125" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
        <circle cx="376" cy="142" r="2.5" fill="#38bdf8" />
        <circle cx="440" cy="142" r="2.5" fill="#38bdf8" />
      </g>

      {/* Legs */}
      <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Right leg */}
        <path d="M 350 238 C 314 260, 275 284, 252 302" strokeWidth="1.8" />
        <path d="M 276 270 Q 268 280, 278 288" strokeWidth="0.8" />
        <path d="M 266 278 Q 258 288, 268 296" strokeWidth="0.8" />
        <path d="M 256 286 Q 248 296, 258 304" strokeWidth="0.8" />
        <path d="M 252 302 L 210 310 C 196 314, 186 310, 188 298" strokeWidth="1.8" />
        <path d="M 234 298 Q 224 304, 234 308" strokeWidth="0.8" />
        <path d="M 188 298 L 180 286 L 160 289" stroke="#38bdf8" strokeWidth="1.8" />
        <path d="M 188 298 L 168 304 L 160 289 Z" stroke="#38bdf8" strokeWidth="1.8" />
        <line x1="162" y1="301" x2="168" y2="288" stroke="#38bdf8" strokeWidth="0.8" />
        <line x1="166" y1="303" x2="172" y2="290" stroke="#38bdf8" strokeWidth="0.8" />
        {/* Left leg */}
        <path d="M 364 244 C 322 284, 280 314, 240 334" strokeWidth="1.8" />
        <path d="M 292 290 Q 284 300, 294 308" strokeWidth="0.8" />
        <path d="M 280 298 Q 272 308, 282 316" strokeWidth="0.8" />
        <path d="M 268 306 Q 260 316, 270 324" strokeWidth="0.8" />
        <path d="M 240 334 L 198 346 C 184 350, 174 344, 177 332" strokeWidth="1.8" />
        <path d="M 177 332 L 168 318 L 148 321" stroke="#38bdf8" strokeWidth="1.8" />
        <path d="M 177 332 L 157 338 L 148 321 Z" stroke="#38bdf8" strokeWidth="1.8" />
        <line x1="150" y1="334" x2="156" y2="321" stroke="#38bdf8" strokeWidth="0.8" />
        <line x1="154" y1="336" x2="160" y2="323" stroke="#38bdf8" strokeWidth="0.8" />
      </g>

      {/* Reaching glove (left hand) */}
      <g>
        <ellipse cx="572" cy="236" rx="5" ry="12" fill="#05070f" stroke="#f43f5e" strokeWidth="1.8" filter="url(#neon-red-glow)" />
        <g stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#neon-cyan-glow)">
          <path d="M 572 224 C 586 210, 608 214, 616 226 C 620 236, 614 246, 602 250" strokeWidth="2.5" />
          <path d="M 574 222 Q 596 204, 603 206 C 608 208, 604 216, 588 225" />
          <line x1="586" y1="214" x2="594" y2="216.5" stroke="#38bdf8" strokeWidth="1.2" />
          <path d="M 598 220 Q 642 190, 652 194 C 658 197, 648 207, 614 225" />
          <line x1="616" y1="208" x2="624" y2="212" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="631" y1="200" x2="639" y2="204" stroke="#38bdf8" strokeWidth="1.2" />
          <path d="M 606 225 Q 662 195, 672 201 C 678 205, 666 215, 617 232" strokeWidth="2.4" />
          <line x1="624" y1="212" x2="634" y2="216" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="644" y1="204" x2="654" y2="208" stroke="#38bdf8" strokeWidth="1.2" />
          <path d="M 610 232 Q 656 212, 666 219 C 672 223, 658 232, 612 240" strokeWidth="2.2" />
          <line x1="628" y1="223" x2="637" y2="227" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="642" y1="217" x2="651" y2="221" stroke="#38bdf8" strokeWidth="1.2" />
          <path d="M 606 240 Q 644 233, 651 239 C 656 243, 644 250, 607 249" />
          <line x1="618" y1="238" x2="627" y2="240" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="630" y1="236" x2="639" y2="238" stroke="#38bdf8" strokeWidth="1.2" />
          <path d="M 584 231 L 592 229 L 598 236 L 590 238 Z" fill="#05070f" stroke="#38bdf8" strokeWidth="1.2" />
        </g>
      </g>
    </svg>
  );
}
