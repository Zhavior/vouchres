import React, { useState } from "react";
import { motion, AnimatePresence } from "../../lib/motion";
import {
  ArrowRight, ArrowLeft, X, Check, Sparkles, Lock,
  ShieldCheck, TrendingUp, Cpu, Users, Palette,
} from "lucide-react";

/**
 * OnboardingSlideshow — 6-slide feature walkthrough + theme choice + signup.
 *
 * Slides:
 *   1. Welcome
 *   2. Post before the game
 *   3. Get graded after final
 *   4. Use AI research tools
 *   5. Follow cappers + AI personalities
 *   6. Choose your beta theme
 *
 * After slide 6: user picks a theme → clicks "Start Beta" → calls onComplete.
 */

interface BetaTheme {
  id: string;
  name: string;
  colors: string[];
  desc: string;
}

interface Props {
  onComplete: (themeId: string) => void;
  onSkip: () => void;
}

const BETA_THEMES: BetaTheme[] = [
  {
    id: "beta-cyber-blue",
    name: "Beta Cyber Blue",
    colors: ["#050B18", "#00B7FF", "#22D3EE", "#2563EB"],
    desc: "VouchEdge core look — dark navy with electric cyan glow.",
  },
  {
    id: "beta-gold-proof",
    name: "Beta Gold Proof",
    colors: ["#040200", "#D4AF37", "#FACC15", "#FDE68A"],
    desc: "Black and gold — premium capper club, verified proof energy.",
  },
  {
    id: "beta-arcade-neon",
    name: "Beta Arcade Neon",
    colors: ["#090314", "#f472b6", "#22d3ee", "#a3e635"],
    desc: "4-bit arcade — dark purple with cyan/pink/green accents.",
  },
];

const SLIDES = [
  {
    icon: Sparkles,
    color: "#22d3ee",
    title: "Welcome to VouchEdge",
    text: "Build your sports pick reputation with proof, not hype.",
  },
  {
    icon: Lock,
    color: "#34d399",
    title: "Post before the game",
    text: "Picks show posted time and lock before start. No edits after lock.",
  },
  {
    icon: Check,
    color: "#fbbf24",
    title: "Get graded after final",
    text: "Wins, losses, pushes, and voids update your public proof record automatically.",
  },
  {
    icon: Cpu,
    color: "#a78bfa",
    title: "Use AI research tools",
    text: "Explore live matchups, HR boards, player research, and parlay support — probability-based, no guarantees.",
  },
  {
    icon: Users,
    color: "#f472b6",
    title: "Follow cappers and AI personalities",
    text: "Compare styles, risk levels, records, and research notes from 5 unique AI cappers.",
  },
  {
    icon: Palette,
    color: "#22d3ee",
    title: "Choose your beta theme",
    text: "Pick a free beta theme to customize your VouchEdge identity.",
  },
];

export default function OnboardingSlideshow({ onComplete, onSkip }: Props) {
  const [slide, setSlide] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<string>("beta-cyber-blue");
  const isLast = slide === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      onComplete(selectedTheme);
    } else {
      setSlide((s) => Math.min(s + 1, SLIDES.length - 1));
    }
  };

  const back = () => setSlide((s) => Math.max(s - 1, 0));

  const current = SLIDES[slide];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(2,4,10,0.92)", backdropFilter: "blur(20px)" }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: "rgba(8,12,20,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Skip button */}
        <button onClick={onSkip} className="absolute top-4 right-4 text-slate-600 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === slide ? 24 : 8,
                background: i === slide ? current.color : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="p-8 min-h-[340px] flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border"
                style={{ background: `${current.color}12`, borderColor: `${current.color}30` }}
              >
                <Icon className="w-7 h-7" style={{ color: current.color }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{current.text}</p>

              {/* Theme picker on last slide */}
              {isLast && (
                <div className="grid grid-cols-3 gap-2.5 mt-6 w-full">
                  {BETA_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`relative rounded-xl p-3 border transition-all ${
                        selectedTheme === t.id ? "ring-2" : ""
                      }`}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderColor: selectedTheme === t.id ? t.colors[1] : "rgba(255,255,255,0.06)",
                        ["--tw-ring-color" as any]: t.colors[1],
                      }}
                    >
                      <div className="flex gap-1 mb-2">
                        {t.colors.slice(1).map((c, i) => (
                          <div key={i} className="flex-1 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}80` }} />
                        ))}
                      </div>
                      <div className="text-[9px] font-bold text-white truncate">{t.name.replace("Beta ", "")}</div>
                      {selectedTheme === t.id && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: t.colors[1] }}>
                          <Check className="w-2.5 h-2.5 text-slate-950" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between p-5 border-t border-white/5">
          <button
            onClick={back}
            disabled={slide === 0}
            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <span className="text-[10px] text-slate-600 font-mono">{slide + 1} / {SLIDES.length}</span>

          {isLast ? (
            <button
              onClick={next}
              className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg text-slate-950 flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}
            >
              Start Beta <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={next}
              className="text-xs font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export { BETA_THEMES };
