import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import {
  Sparkles,
  Check,
  ChevronRight,
  Hash,
  Palette,
  Snowflake,
  Flame,
  Crown,
  Zap,
  Diamond,
  Rocket,
  Star,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
} from "lucide-react";
import { THEME_REGISTRY, type VisualTheme } from "../../theme/themeRegistry";
import { ThemeParticleRouter, DiamondSpark } from "./ParticleFields";

// ─── helpers ────────────────────────────────────────────────────────────────
function extractHex(cls: string): string {
  const m = cls.match(/#[0-9A-Fa-f]{6}/);
  return m ? m[0] : "#5865F2";
}

function themeAccent(t: VisualTheme): string {
  return extractHex(t.accentText);
}

function rarityLabel(r: string) {
  const map: Record<string, { label: string; color: string }> = {
    common:    { label: "Common",    color: "#949ba4" },
    rare:      { label: "Rare",      color: "#5865F2" },
    epic:      { label: "Epic",      color: "#9b59b6" },
    legendary: { label: "Legendary", color: "#D4AF37" },
    verified:  { label: "Verified",  color: "#3ba55c" },
    founder:   { label: "Founder",   color: "#e91e63" },
    seasonal:  { label: "Seasonal",  color: "#F97316" },
  };
  return map[r] ?? { label: r, color: "#949ba4" };
}

// Discord-like category icon per category
function categoryIcon(cat: string) {
  const map: Record<string, React.ReactNode> = {
    Core:     <Hash className="w-3.5 h-3.5" />,
    Premium:  <Crown className="w-3.5 h-3.5" />,
    Sport:    <Zap className="w-3.5 h-3.5" />,
    Flex:     <Sparkles className="w-3.5 h-3.5" />,
    Retro:    <Star className="w-3.5 h-3.5" />,
    Trust:    <CheckCircle className="w-3.5 h-3.5" />,
    Minimal:  <Diamond className="w-3.5 h-3.5" />,
    Seasonal: <Flame className="w-3.5 h-3.5" />,
  };
  return map[cat] ?? <Hash className="w-3.5 h-3.5" />;
}

// map feature highlights per particle system
const FEATURE_CARDS = [
  { icon: Diamond,   title: "3D Perspective Floor",   desc: "Diamond themes use a CSS perspective floor tilted at 75° with a scrolling baseball-diamond grid.",  color: "#38bdf8" },
  { icon: Crown,     title: "Metallic Gold Texture",   desc: "Gold VIP themes use a 7-stop layered gradient with overlay stripes for real metallic sheen.",        color: "#D4AF37" },
  { icon: Snowflake, title: "Snow Particle System",    desc: "Ice themes use 40 snowflakes with wind drift and parallax depth — not just CSS dots.",               color: "#7DD3FC" },
  { icon: Flame,     title: "Ember Rise + Heat",       desc: "HR Hunter uses rising embers in 3 colors with glow shadows and a heat-distortion filter.",           color: "#EF4444" },
  { icon: Star,      title: "3D Starfield",            desc: "Galactic Trust uses 50 stars with translateZ depth — they actually move toward and away from you.",  color: "#FFE81F" },
  { icon: Zap,       title: "Aurora Flow",             desc: "Founder Mode uses dual-layer blurred radial gradients drifting in opposite directions.",             color: "#A78BFA" },
  { icon: Rocket,    title: "Pixel Rain + 3D Cubes",   desc: "4-Bit Arcade uses matrix-style scanlines plus 3D cubes rotating on X+Y axes.",                     color: "#22d3ee" },
  { icon: Palette,   title: "Mesh Gradient Flow",      desc: "Default themes use a 4-stop mesh gradient that shifts position over 14 s — liquid, not static.",   color: "#a78bfa" },
];

// ─── Discord colour constants ─────────────────────────────────────────────────
const DC = {
  bgPrimary:   "#313338",
  bgSecondary: "#2b2d31",
  bgTertiary:  "#1e1f22",
  bgFloat:     "#111214",
  blurple:     "#5865F2",
  blurpleHov:  "#4752C4",
  textNormal:  "#dbdee1",
  textMuted:   "#949ba4",
  channelDef:  "#949ba4",
  channelAct:  "#dbdee1",
  separator:   "#3f4147",
  green:       "#3ba55c",
};

// ─── main component ───────────────────────────────────────────────────────────
export function EpicThemeShowcase() {
  const themes = useMemo(
    () => THEME_REGISTRY.filter((t) => !t.id.includes("ring") && !t.id.includes("frame")),
    []
  );

  const categories = useMemo(
    () => [...new Set(themes.map((t) => t.category))],
    [themes]
  );

  const [activeId, setActiveId] = useState(themes[0]?.id ?? "");
  const [showParticles, setShowParticles] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory ? themes.filter((t) => t.category === activeCategory) : themes;
  const active = themes.find((t) => t.id === activeId) ?? themes[0];
  const accent = themeAccent(active);
  const rarity = rarityLabel(active.rarity);

  // 3-D tilt ----------------------------------------------------------------
  const sceneRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const isDiamond   = active.id.includes("diamond");
  const isGold      = active.id.includes("gold") || active.id.includes("black-gold");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: DC.bgPrimary, color: DC.textNormal, fontFamily: "system-ui, sans-serif" }}
    >
      {/* ── Discord-style top bar ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 h-12 border-b select-none"
        style={{ background: DC.bgSecondary, borderColor: DC.bgTertiary }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: DC.textMuted }}>
          <Palette className="w-4 h-4" style={{ color: DC.blurple }} />
          <span style={{ color: DC.textNormal }}>Theme Store</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span style={{ color: accent }}>{active.name}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowParticles((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: showParticles ? DC.blurple + "20" : "transparent",
              color: showParticles ? DC.blurple : DC.textMuted,
            }}
          >
            {showParticles ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Particles
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Discord sidebar (channel list) ─────────────────────────────── */}
        <nav
          className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-y-auto"
          style={{ background: DC.bgSecondary, borderRight: `1px solid ${DC.separator}` }}
        >
          {/* Server header */}
          <div
            className="px-4 h-12 flex items-center border-b font-bold text-sm"
            style={{ borderColor: DC.bgTertiary, color: DC.textNormal }}
          >
            Epic Themes
          </div>

          <div className="py-2 px-2 flex flex-col gap-0.5">
            {/* ALL button */}
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-colors w-full text-left"
              style={{
                background: !activeCategory ? DC.blurple + "30" : "transparent",
                color: !activeCategory ? DC.channelAct : DC.channelDef,
              }}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              all-themes
            </button>

            {/* Category groups */}
            {categories.map((cat) => {
              const catThemes = themes.filter((t) => t.category === cat);
              return (
                <div key={cat}>
                  <button
                    onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider w-full text-left mt-2 mb-0.5 transition-colors"
                    style={{ color: DC.textMuted }}
                  >
                    {categoryIcon(cat)}
                    {cat}
                  </button>
                  {catThemes.slice(0, 6).map((t) => {
                    const isActive = t.id === activeId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setActiveId(t.id); setActiveCategory(cat); }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-xs w-full text-left transition-colors"
                        style={{
                          background: isActive ? DC.blurple + "30" : "transparent",
                          color: isActive ? DC.channelAct : DC.channelDef,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: extractHex(t.accentText) }} />
                        {t.name}
                        {t.isPremium && <Lock className="w-2.5 h-2.5 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </nav>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile scroll strip */}
          <div
            className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto border-b"
            style={{ borderColor: DC.separator }}
          >
            <button
              onClick={() => setActiveCategory(null)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: !activeCategory ? DC.blurple : DC.bgSecondary,
                color: !activeCategory ? "#fff" : DC.textMuted,
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: activeCategory === cat ? DC.blurple : DC.bgSecondary,
                  color: activeCategory === cat ? "#fff" : DC.textMuted,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Hero heading */}
            <div>
              <h1 className="text-xl font-bold" style={{ color: DC.textNormal }}>
                Choose your look
              </h1>
              <p className="text-sm mt-1" style={{ color: DC.textMuted }}>
                {filtered.length} theme{filtered.length !== 1 ? "s" : ""} ·{" "}
                {activeCategory ? `${activeCategory} collection` : "all collections"} ·{" "}
                3D particles, real textures, GPU-accelerated
              </p>
            </div>

            {/* Theme chip grid (clickable selectors) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {filtered.map((t) => {
                const ta = themeAccent(t);
                const isActive = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className="relative rounded-lg p-2.5 border text-left transition-all overflow-hidden group"
                    style={{
                      background: isActive ? ta + "18" : DC.bgSecondary,
                      borderColor: isActive ? ta : DC.separator,
                      boxShadow: isActive ? `0 0 0 1px ${ta}` : "none",
                    }}
                  >
                    <div className="flex gap-1 mb-1.5">
                      <span className="block w-3 h-3 rounded-sm" style={{ background: ta }} />
                      <span className="block w-3 h-3 rounded-sm" style={{ background: ta + "60" }} />
                      <span className="block w-3 h-3 rounded-sm" style={{ background: ta + "30" }} />
                    </div>
                    <div className="text-[10px] font-bold truncate" style={{ color: isActive ? ta : DC.channelAct }}>
                      {t.name}
                    </div>
                    <div
                      className="text-[9px] uppercase tracking-wider truncate mt-0.5"
                      style={{ color: DC.textMuted }}
                    >
                      {t.rarity}
                    </div>
                    {isActive && (
                      <div
                        className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: ta }}
                      >
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── 3-D Preview scene ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl overflow-hidden ve-3d-scene border"
                style={{
                  borderColor: accent + "50",
                  boxShadow: `0 0 60px -10px ${accent}40`,
                  background: DC.bgFloat,
                  minHeight: 360,
                }}
              >
                {/* Diamond 3-D floor */}
                {isDiamond && <div className="ve-3d-floor" />}

                {/* Particles (parallax back) */}
                {showParticles && (
                  <div className="absolute inset-0 z-0">
                    <ThemeParticleRouter themeId={active.id} />
                  </div>
                )}

                {/* Foreground sparkles for legendary/founder */}
                {showParticles && (active.rarity === "legendary" || active.rarity === "founder") && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <Sparkles className="absolute top-8 left-8 w-4 h-4 ve-sparkle-burst" style={{ color: accent }} />
                    <Sparkles className="absolute top-16 right-12 w-3 h-3 ve-sparkle-burst" style={{ color: accent, animationDelay: "1s" }} />
                    <Sparkles className="absolute bottom-16 left-1/3 w-5 h-5 ve-sparkle-burst" style={{ color: accent, animationDelay: "2s" }} />
                  </div>
                )}

                {/* 3-D tilt layer */}
                <div
                  ref={sceneRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
                  className="relative z-20 p-6 sm:p-10 ve-3d-layer"
                  style={{ perspective: 1200, transformStyle: "preserve-3d" }}
                >
                  <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
                    {/* Discord-style preview card */}
                    <div
                      className={`relative rounded-xl p-5 ve-3d-card-lift ${isGold ? "ve-metallic-gold" : ""}`}
                      style={{
                        background: isGold ? undefined : `${accent}12`,
                        border: `1px solid ${accent}35`,
                        backdropFilter: "blur(16px)",
                        maxWidth: 640,
                        margin: "0 auto",
                      }}
                    >
                      {/* Discord Nitro header */}
                      <div
                        className="flex items-center justify-between mb-4"
                        style={{ transform: "translateZ(40px)" }}
                      >
                        <div>
                          <div
                            className="text-[10px] uppercase tracking-[0.2em] font-mono mb-0.5"
                            style={{ color: DC.textMuted }}
                          >
                            VOUCHEDGE · THEME PREVIEW
                          </div>
                          <div
                            className="text-lg font-bold ve-text-glow-pulse"
                            style={{ color: accent }}
                          >
                            {active.badge}
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border"
                          style={{
                            background: rarity.color + "20",
                            borderColor: rarity.color + "50",
                            color: rarity.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: rarity.color }}
                          />
                          {rarity.label}
                        </div>
                      </div>

                      {/* Profile card + slip */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Profile */}
                        <div style={{ transform: "translateZ(60px)" }}>
                          <div
                            className="rounded-xl p-4 border"
                            style={{
                              background: isGold ? "rgba(107,79,13,0.15)" : DC.bgSecondary + "cc",
                              borderColor: isGold ? "rgba(107,79,13,0.3)" : accent + "30",
                            }}
                          >
                            {/* Avatar */}
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm border-2"
                                style={{
                                  background: `linear-gradient(135deg, ${accent}, ${accent}80)`,
                                  borderColor: accent,
                                  boxShadow: `0 0 16px ${accent}50`,
                                }}
                              >
                                DK
                              </div>
                              <div>
                                <div
                                  className="text-sm font-bold"
                                  style={{ color: isGold ? "#6B4F0D" : DC.textNormal }}
                                >
                                  D. Karpov
                                </div>
                                <div
                                  className="text-[10px]"
                                  style={{ color: DC.textMuted }}
                                >
                                  @sharp_researcher
                                </div>
                              </div>
                            </div>
                            {/* Mini stats */}
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { label: "Record", value: "247-132" },
                                { label: "Units", value: "+342.7" },
                                { label: "Streak", value: "W5" },
                              ].map((s) => (
                                <div
                                  key={s.label}
                                  className="text-center py-1.5 rounded-lg border"
                                  style={{
                                    background: isGold ? "rgba(107,79,13,0.1)" : accent + "0a",
                                    borderColor: isGold ? "rgba(107,79,13,0.2)" : accent + "25",
                                  }}
                                >
                                  <div
                                    className="text-[7px] uppercase tracking-widest font-mono"
                                    style={{ color: DC.textMuted }}
                                  >
                                    {s.label}
                                  </div>
                                  <div
                                    className="text-xs font-black font-mono"
                                    style={{ color: isGold ? "#6B4F0D" : accent }}
                                  >
                                    {s.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Slip */}
                        <div style={{ transform: "translateZ(80px)" }}>
                          <div
                            className="rounded-xl p-4 border"
                            style={{
                              background: isGold ? "rgba(107,79,13,0.12)" : DC.bgSecondary + "cc",
                              borderColor: isGold ? "rgba(107,79,13,0.3)" : accent + "30",
                            }}
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <span
                                className="text-[9px] font-mono font-bold uppercase tracking-wider"
                                style={{ color: DC.textMuted }}
                              >
                                SLIP #VE-2941
                              </span>
                              <span
                                className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border"
                                style={{
                                  background: accent + "20",
                                  borderColor: accent + "40",
                                  color: accent,
                                }}
                              >
                                VOUCHCHECK ✓
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {[
                                { leg: "A. Judge OVR 1.5+", odds: "+145" },
                                { leg: "S. Ohtani 1+ HR",   odds: "+310" },
                                { leg: "B. Witt Jr. 2+ TB", odds: "+125" },
                              ].map((leg, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.07 }}
                                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs border"
                                  style={{
                                    background: accent + "0a",
                                    borderColor: accent + "20",
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Check className="w-3 h-3" style={{ color: accent }} />
                                    <span style={{ color: DC.textNormal }}>{leg.leg}</span>
                                  </div>
                                  <span className="font-mono font-bold text-[10px]" style={{ color: accent }}>
                                    {leg.odds}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                            <div
                              className="mt-2.5 flex items-center justify-between rounded-lg px-2.5 py-2 border"
                              style={{ background: accent + "15", borderColor: accent + "35" }}
                            >
                              <span
                                className="text-[9px] font-mono font-bold uppercase tracking-widest"
                                style={{ color: DC.textMuted }}
                              >
                                SLIP EDGE
                              </span>
                              <span
                                className="text-base font-black font-mono ve-text-glow-pulse"
                                style={{ color: accent }}
                              >
                                +12.5%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer hint */}
                      <div
                        className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-mono uppercase tracking-widest"
                        style={{ color: DC.textMuted, transform: "translateZ(20px)" }}
                      >
                        <Sparkles className="w-2.5 h-2.5" style={{ color: accent }} />
                        Move mouse over card for 3D tilt
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Theme metadata panel — Discord embed style */}
            <div
              className="rounded-xl border p-4 flex flex-col sm:flex-row gap-4 items-start"
              style={{ background: DC.bgSecondary, borderColor: DC.separator, borderLeft: `4px solid ${accent}` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold" style={{ color: DC.textNormal }}>{active.name}</span>
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ background: rarity.color + "20", color: rarity.color }}
                  >
                    {rarity.label}
                  </span>
                  {active.cost > 0 && (
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ background: DC.blurple + "20", color: DC.blurple }}
                    >
                      {active.cost} VC
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: DC.textMuted }}>{active.description}</p>
                <p
                  className="text-[10px] mt-1.5 font-mono"
                  style={{ color: DC.textMuted }}
                >
                  Unlock condition: {active.unlockCondition}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                  style={{
                    background: DC.blurple,
                    color: "#fff",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = DC.blurpleHov)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = DC.blurple)}
                >
                  {active.cost === 0 ? (
                    <><Check className="w-3.5 h-3.5" /> Apply Theme</>
                  ) : (
                    <><Lock className="w-3.5 h-3.5" /> Unlock · {active.cost} VC</>
                  )}
                </button>
              </div>
            </div>

            {/* Feature cards */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: DC.textMuted }}>
                Particle Systems
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {FEATURE_CARDS.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                      className="rounded-xl p-4 border"
                      style={{ background: DC.bgSecondary, borderColor: DC.separator }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 border"
                        style={{ background: f.color + "18", borderColor: f.color + "30" }}
                      >
                        <Icon className="w-4 h-4" style={{ color: f.color }} />
                      </div>
                      <h3 className="text-xs font-bold mb-1" style={{ color: DC.textNormal }}>
                        {f.title}
                      </h3>
                      <p className="text-[10px] leading-relaxed" style={{ color: DC.textMuted }}>
                        {f.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
