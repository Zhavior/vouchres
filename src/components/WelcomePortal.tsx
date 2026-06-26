import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Lock, CheckCircle2, Sparkles,
  Tv, Flame, Activity, Search, Sliders, ScanLine,
  Cpu, Palette, Trophy, Zap, Eye, EyeOff, X,
  TrendingUp, BarChart3, Users, ShoppingBag,
} from "lucide-react";
import ParticleBackground from "./vouchedge/ParticleBackground";
import FeatureCard3D from "./vouchedge/FeatureCard3D";
import OnboardingSlideshow, { BETA_THEMES } from "./vouchedge/OnboardingSlideshow";
import AuthModal from "./auth/AuthModal";

/**
 * WelcomePortal — Premium front page
 *
 * Sections:
 *   1. Hero — "Proof over hype" + 3D floating card preview + CTAs
 *   2. 3D Feature card grid (8 cards with tilt on hover)
 *   3. How it works (4 steps)
 *   4. Product preview cards (demo-labeled)
 *   5. Beta themes (3 free themes with preview + choose)
 *   6. Disclaimer footer
 *
 * Auth: opens AuthModal or OnboardingSlideshow → then AuthModal
 */

interface Props {
  onSectionChange: (section: string) => void;
}

export default function WelcomePortal({ onSectionChange }: Props) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("beta-cyber-blue");

  const handleEnterApp = () => onSectionChange("today");
  const handleExplore = () => onSectionChange("live_games");
  const handleDemoCard = () => onSectionChange("board");

  const handleStartBeta = () => setShowOnboarding(true);

  const handleOnboardingComplete = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem("vouchedge_beta_theme_choice", themeId);
    setShowOnboarding(false);
    setShowAuth(true);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setShowAuth(true);
  };

  const features = [
    { icon: ScanLine, color: "#22d3ee", title: "Vouch Cards", desc: "Turn every pick into a proof card with posted time, lock time, risk tier, and result status.", onClick: handleDemoCard },
    { icon: ShieldCheck, color: "#34d399", title: "Trust Score Profiles", desc: "Build credibility through verified records, not empty hype.", onClick: () => onSectionChange("profile") },
    { icon: Sliders, color: "#a78bfa", title: "Parlay Lab", desc: "Create singles, doubles, triples, and parlays with risk labels and weakest-leg notes.", onClick: () => onSectionChange("build") },
    { icon: Tv, color: "#38bdf8", title: "Live MLB Intelligence", desc: "View live matchups, HR board, pitcher vulnerability, and game environment signals.", onClick: handleExplore },
    { icon: Cpu, color: "#fbbf24", title: "AI Picks Hub", desc: "Use AI-assisted research for HR targets, undervalued players, and watchlists.", onClick: () => onSectionChange("ai_engine") },
    { icon: CheckCircle2, color: "#10b981", title: "Verified Result Ledger", desc: "Every graded pick updates the user's public proof history.", onClick: () => onSectionChange("results") },
    { icon: Users, color: "#f472b6", title: "AI Capper League", desc: "Follow different AI capper personalities with unique styles, notes, and proof records.", onClick: () => onSectionChange("ai_engine") },
    { icon: Palette, color: "#22d3ee", title: "Theme Identity", desc: "Customize your profile with themes, borders, and proof identity.", onClick: () => onSectionChange("themestore") },
  ];

  const steps = [
    { num: "01", icon: Zap, title: "Post or tail a pick", desc: "Publish your own pick or tail another capper's. AI cappers post daily from real MLB data.", color: "#22d3ee" },
    { num: "02", icon: Lock, title: "Pick locks before game start", desc: "Every pick is timestamped and locked before first pitch. No edits after lock.", color: "#34d399" },
    { num: "03", icon: CheckCircle2, title: "Result grades after final", desc: "When the game goes final, the grader runs automatically. Win, loss, push — tracked honestly.", color: "#fbbf24" },
    { num: "04", icon: ShieldCheck, title: "Trust score updates", desc: "Your profile trust score reflects your real graded record. No fake credibility.", color: "#a78bfa" },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#040810", color: "#e2e8f0" }}>
      <ParticleBackground />

      <div className="relative z-10">
        {/* ====== NAV BAR ====== */}
        <header className="sticky top-0 z-50" style={{ background: "rgba(8,12,20,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-slate-950 text-xs" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)", boxShadow: "0 0 20px rgba(34,211,238,0.3)" }}>
                VE
              </div>
              <span className="font-bold text-white text-sm">Vouch<span className="text-cyan-400">Edge</span></span>
              <span className="ml-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.2)" }}>Beta</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleStartBeta} className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 transition-colors hidden sm:inline-flex">Sign in</button>
              <button onClick={handleStartBeta} className="text-xs font-bold text-slate-950 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
                Start Beta <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </header>

        {/* ====== 1. HERO ====== */}
        <section className="relative pt-16 md:pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}>
                  <ShieldCheck className="w-3.5 h-3.5" /> Proof over hype · Beta build
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.02]">
                Proof over hype{" "}
                <span style={{ background: "linear-gradient(135deg, #ffffff, #67e8f9, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  for sports picks.
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
                Post picks before game time, lock them before start, grade them after final, and build a public record people can actually trust.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={handleStartBeta} className="text-sm font-bold text-slate-950 px-6 py-3.5 rounded-xl flex items-center gap-2" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)", boxShadow: "0 8px 30px -8px rgba(34,211,238,0.5)" }}>
                  Start Beta <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={handleExplore} className="text-sm font-bold text-white px-6 py-3.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Eye className="w-4 h-4 text-cyan-400" /> Explore Features
                </button>
                <button onClick={handleDemoCard} className="text-sm text-slate-400 hover:text-white px-3 py-3.5 transition-colors">
                  View Demo Proof Card →
                </button>
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }} className="mt-5 text-[10px] text-slate-600">
                Sports research and social proof platform. Probability-based. No guarantees.
              </motion.p>
            </div>

            {/* 3D floating preview card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 max-w-sm"
            >
              <FloatingVouchCard />
            </motion.div>
          </div>
        </section>

        {/* ====== 2. 3D FEATURE CARDS ====== */}
        <section className="relative py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Features</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Everything inside the portal</h2>
              <p className="text-sm text-slate-500 mt-2">Click any card to jump into the app.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {features.map((f, i) => (
                <FeatureCard3D key={f.title} icon={f.icon} iconColor={f.color} title={f.title} desc={f.desc} onClick={f.onClick} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ====== 3. HOW IT WORKS ====== */}
        <section className="relative py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">How it works</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Post. Lock. Grade. Build proof.</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.num}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${s.color}12`, borderColor: `${s.color}30` }}>
                        <Icon className="w-5 h-5" style={{ color: s.color }} />
                      </div>
                      <span className="text-2xl font-bold font-mono text-slate-700">{s.num}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{s.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====== 4. PRODUCT PREVIEWS ====== */}
        <section className="relative py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Product previews</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Real product surfaces. Not marketing blocks.</h2>
              <p className="text-sm text-slate-500 mt-2">Sample previews for layout testing — not real capper records.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DemoVouchCard />
              <DemoParlayCard />
              <DemoResultCard />
            </div>
          </div>
        </section>

        {/* ====== 5. BETA THEMES ====== */}
        <section className="relative py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Beta themes</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Choose your proof identity</h2>
              <p className="text-sm text-slate-500 mt-2">3 free beta themes. Pick one during onboarding.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {BETA_THEMES.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(15,23,42,0.4)", border: `1px solid ${t.colors[1]}25` }}
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `${t.colors[1]}12`, color: t.colors[1], border: `1px solid ${t.colors[1]}30` }}>
                    Free Beta Theme
                  </span>
                  <div className="flex gap-1.5 my-4">
                    {t.colors.map((c, j) => (
                      <div key={j} className="flex-1 h-8 rounded-lg" style={{ background: c, boxShadow: `0 0 8px ${c}40` }} />
                    ))}
                  </div>
                  <h3 className="text-sm font-bold text-white">{t.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.desc}</p>
                  <button
                    onClick={() => { setSelectedTheme(t.id); handleStartBeta(); }}
                    className="mt-4 w-full text-xs font-bold uppercase tracking-wider py-2 rounded-lg text-slate-950"
                    style={{ background: `linear-gradient(135deg, ${t.colors[1]}, ${t.colors[3] || t.colors[2]})` }}
                  >
                    Choose Theme
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== 6. DISCLAIMER ====== */}
        <footer className="relative py-12" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <ShieldCheck className="w-8 h-8 text-cyan-400/40 mx-auto mb-3" />
            <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl mx-auto">
              VouchEdge is for sports research, social proof, and entertainment. AI insights are probability-based. No guarantees. Always follow your local laws and play responsibly. 21+ only. Mock data shown on this page is for layout testing only — not real capper performance.
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-700">
              <span>© {new Date().getFullYear()} VouchEdge</span>
              <span>·</span>
              <span>Proof over hype</span>
              <span>·</span>
              <span className="font-mono">beta · research · 21+</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ====== MODALS ====== */}
      {showOnboarding && (
        <OnboardingSlideshow onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
      )}
      {showAuth && (
        <AuthModal open={true} onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}

/* ============ Floating Vouch Card (hero visual) ============ */
function FloatingVouchCard() {
  return (
    <motion.div
      animate={{ y: [-8, 8, -8] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "rgba(15,23,42,0.6)",
        border: "1px solid rgba(34,211,238,0.2)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5), 0 0 40px -10px rgba(34,211,238,0.15)",
      }}
    >
      <div className="absolute top-3 right-3 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
        Sample
      </div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-950 text-sm" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>VE</div>
        <div>
          <div className="text-xs font-bold text-white">Sample Capper</div>
          <div className="text-[10px] text-slate-500 font-mono">@sample_capper · Demo</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[9px] text-emerald-400 font-mono">LOCKED</span>
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        {[
          { leg: "A. Judge OVR 1.5+", odds: "+145" },
          { leg: "S. Ohtani 1+ HR", odds: "+310" },
        ].map((l, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-xs text-slate-300">{l.leg}</span>
            <span className="text-xs font-mono font-bold text-cyan-300">{l.odds}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}>
        <span className="text-[10px] font-bold font-mono text-slate-400">VOUCHCHECK</span>
        <span className="text-xs font-mono font-bold text-cyan-300">4/4 judges · Approved</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-600">
        <span>Posted 2h before first pitch</span><span>·</span><span>Awaiting final</span>
      </div>
    </motion.div>
  );
}

/* ============ Demo Vouch Card ============ */
function DemoVouchCard() {
  return (
    <div className="relative rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <DemoLabel text="Sample vouch card" />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-950 text-xs" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>VE</div>
        <div><div className="text-xs font-bold text-white">Sample Capper</div><div className="text-[10px] text-slate-500 font-mono">@sample · Demo</div></div>
        <Lock className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
          <span className="text-xs text-slate-300">Judge OVR 1.5+</span><span className="text-xs font-mono text-cyan-300">+145</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
          <span className="text-xs text-slate-300">Ohtani 1+ HR</span><span className="text-xs font-mono text-cyan-300">+310</span>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-600">Posted 2h before · Awaiting final</div>
    </div>
  );
}

/* ============ Demo Parlay Card ============ */
function DemoParlayCard() {
  return (
    <div className="relative rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <DemoLabel text="Sample parlay" />
      <div className="flex items-center justify-between mb-3">
        <div><div className="text-[10px] text-slate-500 font-mono uppercase">3-leg parlay</div><div className="text-xs font-bold text-white">Slip #VE-DEMO-001</div></div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>DRAFT</span>
      </div>
      <div className="space-y-1.5">
        {["Judge OVR 1.5+ · +145", "Ohtani 1+ HR · +310", "Witt 2+ TB · +125"].map((l, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-xs text-slate-300">{l.split(" · ")[0]}</span><span className="text-xs font-mono text-slate-400">{l.split(" · ")[1]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        <div className="text-center p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="text-[8px] text-slate-600 font-mono uppercase">Combined</div><div className="text-xs font-bold font-mono text-white">+1842</div>
        </div>
        <div className="text-center p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="text-[8px] text-slate-600 font-mono uppercase">Judge</div><div className="text-xs font-bold font-mono text-emerald-400">64</div>
        </div>
        <div className="text-center p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="text-[8px] text-slate-600 font-mono uppercase">Risk</div><div className="text-xs font-bold text-amber-400">Lotto</div>
        </div>
      </div>
    </div>
  );
}

/* ============ Demo Result Card ============ */
function DemoResultCard() {
  return (
    <div className="relative rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <DemoLabel text="Sample result" />
      <div className="flex items-center justify-between mb-3">
        <div><div className="text-[10px] text-slate-500 font-mono uppercase">Graded result</div><div className="text-xs font-bold text-white">Slip #VE-DEMO-042</div></div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
          <CheckCircle2 className="w-3 h-3" /> WON
        </span>
      </div>
      <div className="space-y-1.5">
        {[
          { leg: "Judge OVR 1.5+", result: "2 TB · WON" },
          { leg: "Ohtani 1+ HR", result: "1 HR · WON" },
          { leg: "Witt 2+ TB", result: "3 TB · WON" },
        ].map((l, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /><span className="text-xs text-slate-300">{l.leg}</span></div>
            <span className="text-[10px] font-mono text-emerald-400">{l.result}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between p-2 mt-2 rounded-lg" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
        <span className="text-[10px] font-bold font-mono text-slate-400">PAYOUT</span>
        <span className="text-sm font-mono font-bold text-emerald-400">+19.42u</span>
      </div>
    </div>
  );
}

/* ============ Demo label badge ============ */
function DemoLabel({ text }: { text: string }) {
  return (
    <span className="absolute top-3 right-3 z-10 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
      {text}
    </span>
  );
}
