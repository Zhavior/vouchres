import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tv, Flame, Activity, Search, Sliders, ScanLine, ArrowRight, ShieldCheck, Gavel } from 'lucide-react';

interface Props { onSectionChange: (section: string) => void; }

const FEATURES = [
  { icon: Tv, color: '#38bdf8', section: 'live_games', title: 'Live Matchups', desc: 'Real MLB games with model win probabilities, run environment, and the actual hitters to watch — click any game for the full AI breakdown.' },
  { icon: Flame, color: '#fb923c', section: 'hr_board', title: 'Daily HR Edge Board', desc: 'Every hitter ranked by HR opportunity vs today’s probable pitchers — grades, edge %, implied odds, and a per-pick AI judge.' },
  { icon: Activity, color: '#34d399', section: 'intel', title: 'MLB Intelligence', desc: 'Vulnerable pitchers, HR targets, sneaky spots, and run environments — the daily research brief, generated from live data.' },
  { icon: Search, color: '#a78bfa', section: 'research', title: 'Player Research', desc: 'All 1,250+ active players with real headshots, splits, and AI matchup reports. Search anyone, build your read.' },
  { icon: Sliders, color: '#22d3ee', section: 'build', title: 'Parlay Lab', desc: 'Build slips from the full roster, then run VouchCheck for honest edge, correlation, and risk — no hype.' },
  { icon: ScanLine, color: '#f472b6', section: 'vouchscan', title: 'VouchScan', desc: 'Upload a slip and confirm your legs, then get a research-grade VouchCheck. Your picks, verified — never invented.' },
];

export default function WelcomePortal({ onSectionChange }: Props) {
  const stars = useMemo(() => Array.from({ length: 140 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 100,
    size: Math.random() * 2 + 1, td: 2 + Math.random() * 4, tdl: Math.random() * 5,
  })), []);

  return (
    <div className="relative min-h-screen overflow-hidden ve-nebula" style={{ background: 'radial-gradient(ellipse at top, #0a1020 0%, #050810 55%, #02040a 100%)' }}>
      {/* Starfield */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {stars.map((s) => (
          <span key={s.id} className="ve-star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, ['--td' as any]: `${s.td}s`, ['--tdl' as any]: `${s.tdl}s` }} />
        ))}
      </div>
      {/* Glow orbs */}
      <div className="fixed top-1/3 -left-40 w-[480px] h-[480px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
      <div className="fixed top-10 right-0 w-[420px] h-[420px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-slate-950">VE</div>
            <span className="font-black tracking-tight text-lg">Vouch<span className="text-cyan-400">Edge</span></span>
          </div>
          <button onClick={() => onSectionChange('today')} className="text-sm font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all">Enter App</button>
        </header>

        {/* Hero */}
        <section className="grid md:grid-cols-2 gap-8 items-center pt-10 md:pt-16 pb-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-cyan-300/90 border border-cyan-500/25 rounded-full px-3 py-1 mb-5">
              <ShieldCheck className="w-3.5 h-3.5" /> The Verified Standard for AI Sports Research
            </span>
            <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight">
              <span className="ve-grad-text">VouchEdge</span>
            </h1>
            <p className="mt-3 text-xl sm:text-2xl font-bold text-slate-200">AI-powered MLB intelligence.<br /><span className="text-slate-400">Real data. Verified picks.</span></p>
            <p className="mt-5 text-slate-400 max-w-md leading-relaxed">
              Live matchups, daily HR edges, vulnerable pitchers, player research, and honest AI judges — built on real MLB data, not hype.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onSectionChange('today')} className="flex items-center gap-2 text-sm font-black px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_8px_30px_rgba(56,189,248,0.25)]">
                Enter VouchEdge <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => onSectionChange('live_games')} className="text-sm font-bold px-5 py-3 rounded-xl border border-white/15 text-slate-200 hover:bg-white/5 transition-all">Explore Live Games</button>
            </div>
          </motion.div>

          {/* Astronaut */}
          <div className="relative flex justify-center items-center min-h-[300px] md:min-h-[460px]">
            <motion.img
              src="/astronaut.png" alt="VouchEdge astronaut" draggable={false}
              className="ve-astro-glow w-[78%] max-w-[420px] object-contain select-none"
              animate={{ y: [-14, 14, -14] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </section>

        {/* Features */}
        <section className="pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black tracking-tight ve-grad-text inline-block">Everything inside the portal</h2>
            <p className="text-slate-400 text-sm mt-2">Tap any feature to jump straight in.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <button key={f.section} onClick={() => onSectionChange(f.section)} className="ve-glass rounded-2xl p-5 text-left group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 border" style={{ background: f.color + '18', borderColor: f.color + '33' }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-base font-black text-white mb-1 flex items-center gap-1.5">{f.title}<ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-slate-300 transition-all" /></h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed">{f.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Trust strip */}
          <div className="ve-glass rounded-2xl p-5 mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            <span className="flex items-center gap-2 text-sm text-slate-300"><Gavel className="w-4 h-4 text-cyan-400" /> 4-judge AI review on every pick</span>
            <span className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Trust Code & verified records</span>
            <span className="flex items-center gap-2 text-sm text-slate-300"><Activity className="w-4 h-4 text-sky-400" /> Live MLB data, no mock</span>
          </div>

          <div className="text-center mt-10">
            <button onClick={() => onSectionChange('today')} className="inline-flex items-center gap-2 text-sm font-black px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all">
              Enter VouchEdge <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-600 mt-4">Probability-based research for entertainment — not betting advice.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
