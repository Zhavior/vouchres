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
  Coins,
  ShoppingBag,
} from "lucide-react";
import { THEME_REGISTRY, type VisualTheme } from "../../theme/themeRegistry";
import { useTheme } from "../theme/ThemeProvider";
import { ThemeParticleRouter } from "./ParticleFields";
import { getFounderPointsLabel } from "../../lib/founderAccess";

// ─── helpers ────────────────────────────────────────────────────────────────
function extractHex(cls: string): string {
  const m = cls.match(/#[0-9A-Fa-f]{6}/);
  return m ? m[0] : "#5865F2";
}
function themeAccent(t: VisualTheme): string {
  return extractHex(t.accentText);
}
function themeBg(t: VisualTheme): string {
  // pageBg is a Tailwind class like bg-[#050B18] — pull the hex for inline styling
  const m = (t.pageBg || t.background || "").match(/#[0-9A-Fa-f]{6}/);
  return m ? m[0] : "#0b0f19";
}
// Friendly, affordable price model (you start with 1,000 credits). Tiered by
// rarity so a couple of premium themes are always within reach — deliberately
// cheaper than a Nitro-style subscription.
function themePrice(t: VisualTheme): number {
  if (!t.isPremium) return 0;
  switch (t.rarity) {
    case "rare":      return 100;
    case "epic":      return 200;
    case "legendary": return 350;
    case "seasonal":  return 150;
    case "verified":
    case "founder":   return 500;
    default:          return 80;
  }
}
function rarityMeta(r: string) {
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
function categoryIcon(cat: string) {
  const map: Record<string, React.ReactNode> = {
    Core: <Hash className="w-3.5 h-3.5" />, Premium: <Crown className="w-3.5 h-3.5" />,
    Sport: <Zap className="w-3.5 h-3.5" />, Flex: <Sparkles className="w-3.5 h-3.5" />,
    Retro: <Star className="w-3.5 h-3.5" />, Trust: <CheckCircle className="w-3.5 h-3.5" />,
    Minimal: <Diamond className="w-3.5 h-3.5" />, Seasonal: <Flame className="w-3.5 h-3.5" />,
  };
  return map[cat] ?? <Hash className="w-3.5 h-3.5" />;
}

const FEATURE_CARDS = [
  { icon: Diamond,   title: "3D Perspective Floor", desc: "Diamond themes use a CSS perspective floor tilted at 75° with a scrolling grid.", color: "#38bdf8" },
  { icon: Crown,     title: "Metallic Gold Texture", desc: "Gold themes use a 7-stop layered gradient with overlay stripes for real sheen.", color: "#D4AF37" },
  { icon: Snowflake, title: "Snow Particle System",  desc: "Ice themes use 40 snowflakes with wind drift and parallax depth.", color: "#7DD3FC" },
  { icon: Flame,     title: "Ember Rise + Heat",     desc: "HR Hunter uses rising embers in 3 colors with glow shadows.", color: "#EF4444" },
  { icon: Star,      title: "3D Starfield",          desc: "Galactic themes use 50 stars with translateZ depth.", color: "#FFE81F" },
  { icon: Zap,       title: "Aurora Flow",           desc: "Founder Mode uses dual-layer blurred gradients drifting opposite ways.", color: "#A78BFA" },
  { icon: Rocket,    title: "Pixel Rain + 3D Cubes", desc: "4-Bit Arcade uses matrix scanlines plus rotating 3D cubes.", color: "#22d3ee" },
  { icon: Palette,   title: "Mesh Gradient Flow",    desc: "Default themes use a 4-stop mesh gradient shifting over 14s.", color: "#a78bfa" },
];

// ─── Discord colour constants ─────────────────────────────────────────────────
const DC = {
  bgPrimary: "#313338", bgSecondary: "#2b2d31", bgTertiary: "#1e1f22", bgFloat: "#111214",
  blurple: "#5865F2", blurpleHov: "#4752C4", textNormal: "#dbdee1", textMuted: "#949ba4",
  channelDef: "#949ba4", channelAct: "#dbdee1", separator: "#3f4147", green: "#3ba55c",
};

export function EpicThemeShowcase() {
  const { currentAppTheme, setAppTheme, unlockedThemes, unlockTheme, userCredits, setUserCredits } = useTheme();

  const themes = useMemo(
    () => THEME_REGISTRY.filter((t) => !t.id.includes("ring") && !t.id.includes("frame")),
    []
  );
  const categories = useMemo(() => [...new Set(themes.map((t) => t.category))], [themes]);

  const [activeId, setActiveId] = useState(currentAppTheme.id);
  const [showParticles, setShowParticles] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const filtered = activeCategory ? themes.filter((t) => t.category === activeCategory) : themes;
  const active = themes.find((t) => t.id === activeId) ?? themes[0];
  const accent = themeAccent(active);
  const rarity = rarityMeta(active.rarity);

  const isOwned = (t: VisualTheme) => themePrice(t) === 0 || unlockedThemes.includes(t.id);
  const isEquipped = (t: VisualTheme) => currentAppTheme.id === t.id;

  const flash = (text: string, ok: boolean) => {
    setToast({ text, ok });
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleApply = (t: VisualTheme) => {
    setAppTheme(t.id);
    flash(`${t.name} equipped — the whole app just changed.`, true);
  };

  const handleBuy = (t: VisualTheme) => {
    const price = themePrice(t);
    if (userCredits < price) {
      flash(`Need ${price - userCredits} more credits for ${t.name}.`, false);
      return;
    }
    setUserCredits(userCredits - price);
    unlockTheme(t.id);
    setAppTheme(t.id);
    flash(`Unlocked & equipped ${t.name} for ${price} credits.`, true);
  };

  // 3-D tilt
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

  const isDiamond = active.id.includes("diamond");
  const isGold = active.id.includes("gold") || active.id.includes("black-gold");

  const ownedCount = themes.filter(isOwned).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: DC.bgPrimary, color: DC.textNormal }}>
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 h-12 border-b select-none"
        style={{ background: DC.bgSecondary, borderColor: DC.bgTertiary }}>
        <div className="flex items-center gap-2 text-sm font-semibold min-w-0" style={{ color: DC.textMuted }}>
          <ShoppingBag className="w-4 h-4 flex-shrink-0" style={{ color: DC.blurple }} />
          <span style={{ color: DC.textNormal }}>Theme Shop</span>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate" style={{ color: accent }}>{active.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: "#D4AF3720", color: "#F2C94C", border: "1px solid #D4AF3740" }}>
            <Coins className="w-3.5 h-3.5" /> {userCredits.toLocaleString()}
          </span>
          <button onClick={() => setShowParticles((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{ background: showParticles ? DC.blurple + "20" : "transparent", color: showParticles ? DC.blurple : DC.textMuted }}>
            {showParticles ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Particles</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-y-auto"
          style={{ background: DC.bgSecondary, borderRight: `1px solid ${DC.separator}` }}>
          <div className="px-4 h-12 flex items-center border-b font-bold text-sm"
            style={{ borderColor: DC.bgTertiary, color: DC.textNormal }}>
            Collections
          </div>
          <div className="py-2 px-2 flex flex-col gap-0.5">
            <button onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium w-full text-left"
              style={{ background: !activeCategory ? DC.blurple + "30" : "transparent", color: !activeCategory ? DC.channelAct : DC.channelDef }}>
              <Hash className="w-3.5 h-3.5 flex-shrink-0" /> all-themes
              <span className="ml-auto text-[10px]" style={{ color: DC.textMuted }}>{themes.length}</span>
            </button>
            {categories.map((cat) => {
              const catThemes = themes.filter((t) => t.category === cat);
              return (
                <div key={cat}>
                  <button onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider w-full text-left mt-2 mb-0.5"
                    style={{ color: cat === activeCategory ? accent : DC.textMuted }}>
                    {categoryIcon(cat)} {cat}
                    <span className="ml-auto">{catThemes.length}</span>
                  </button>
                  {catThemes.map((t) => {
                    const a = isActiveChip(t.id, activeId);
                    return (
                      <button key={t.id} onClick={() => { setActiveId(t.id); }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-xs w-full text-left"
                        style={{ background: a ? DC.blurple + "30" : "transparent", color: a ? DC.channelAct : DC.channelDef }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: extractHex(t.accentText) }} />
                        <span className="truncate">{t.name}</span>
                        {isEquipped(t) ? <Check className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: DC.green }} />
                          : !isOwned(t) ? <Lock className="w-2.5 h-2.5 ml-auto flex-shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile category strip */}
          <div className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto border-b" style={{ borderColor: DC.separator }}>
            <button onClick={() => setActiveCategory(null)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: !activeCategory ? DC.blurple : DC.bgSecondary, color: !activeCategory ? "#fff" : DC.textMuted }}>All</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: activeCategory === cat ? DC.blurple : DC.bgSecondary, color: activeCategory === cat ? "#fff" : DC.textMuted }}>{cat}</button>
            ))}
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            <div>
              <h1 className="text-xl font-bold" style={{ color: DC.textNormal }}>Theme Shop</h1>
              <p className="text-sm mt-1" style={{ color: DC.textMuted }}>
                {filtered.length} themes · {ownedCount} owned · click a card to preview, then equip or buy.
              </p>
            </div>

            {/* ── Shop grid (every card shows price + rarity + state) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((t) => {
                const ta = themeAccent(t);
                const tr = rarityMeta(t.rarity);
                const owned = isOwned(t);
                const equipped = isEquipped(t);
                const selected = t.id === activeId;
                return (
                  <div key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className="relative rounded-xl border overflow-hidden cursor-pointer transition-all"
                    style={{
                      background: DC.bgSecondary,
                      borderColor: selected ? ta : DC.separator,
                      boxShadow: selected ? `0 0 0 1px ${ta}, 0 8px 24px -12px ${ta}80` : "none",
                    }}>
                    {/* Swatch preview */}
                    <div className="h-20 relative overflow-hidden" style={{ background: themeBg(t) }}>
                      <div className="absolute inset-0" style={{
                        background: `radial-gradient(120% 100% at 20% 0%, ${ta}33, transparent 60%), radial-gradient(100% 100% at 100% 100%, ${ta}22, transparent 55%)`,
                      }} />
                      <div className="absolute bottom-2 left-3 flex gap-1.5">
                        <span className="w-5 h-5 rounded-md border border-white/20" style={{ background: ta }} />
                        <span className="w-5 h-5 rounded-md border border-white/10" style={{ background: ta + "66" }} />
                        <span className="w-5 h-5 rounded-md border border-white/10" style={{ background: ta + "33" }} />
                      </div>
                      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ background: tr.color + "26", color: tr.color, border: `1px solid ${tr.color}55` }}>{tr.label}</span>
                      {equipped && (
                        <span className="absolute top-2 left-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1"
                          style={{ background: DC.green + "26", color: DC.green, border: `1px solid ${DC.green}66` }}>
                          <Check className="w-2.5 h-2.5" /> Equipped
                        </span>
                      )}
                    </div>
                    {/* Body */}
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate" style={{ color: DC.textNormal }}>{t.name}</span>
                        {owned ? (
                          <span className="text-[10px] font-bold uppercase flex-shrink-0" style={{ color: DC.green }}>Owned</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-black flex-shrink-0" style={{ color: "#F2C94C" }}>
                            <Coins className="w-3 h-3" /> {themePrice(t)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-1 line-clamp-2 leading-snug" style={{ color: DC.textMuted }}>{t.description}</p>
                      {/* Action */}
                      <button
                        onClick={(e) => { e.stopPropagation(); equipped ? undefined : owned ? handleApply(t) : handleBuy(t); }}
                        disabled={equipped}
                        className="mt-3 w-full py-2 rounded-lg text-xs font-bold transition-colors disabled:cursor-default"
                        style={{
                          background: equipped ? DC.bgTertiary : owned ? ta + "22" : DC.blurple,
                          color: equipped ? DC.textMuted : owned ? ta : "#fff",
                          border: `1px solid ${equipped ? DC.separator : owned ? ta + "44" : "transparent"}`,
                        }}>
                        {equipped ? "✓ Equipped" : owned ? "Equip theme" : `Buy · ${themePrice(t)} credits`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── 3-D live preview of the selected theme ── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: DC.textMuted }}>Live preview · {active.name}</h2>
              <AnimatePresence mode="wait">
                <motion.div key={activeId}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="relative rounded-2xl overflow-hidden ve-3d-scene border"
                  style={{ borderColor: accent + "50", boxShadow: `0 0 60px -10px ${accent}40`, background: themeBg(active), minHeight: 320 }}>
                  {isDiamond && <div className="ve-3d-floor" />}
                  {showParticles && <div className="absolute inset-0 z-0"><ThemeParticleRouter themeId={active.id} /></div>}
                  {showParticles && (active.rarity === "legendary" || active.rarity === "founder") && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      <Sparkles className="absolute top-8 left-8 w-4 h-4 ve-sparkle-burst" style={{ color: accent }} />
                      <Sparkles className="absolute top-16 right-12 w-3 h-3 ve-sparkle-burst" style={{ color: accent, animationDelay: "1s" }} />
                      <Sparkles className="absolute bottom-16 left-1/3 w-5 h-5 ve-sparkle-burst" style={{ color: accent, animationDelay: "2s" }} />
                    </div>
                  )}
                  <div ref={sceneRef} onMouseMove={handleMouseMove} onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
                    className="relative z-20 p-6 sm:p-10 ve-3d-layer" style={{ perspective: 1200, transformStyle: "preserve-3d" }}>
                    <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
                      <div className={`relative rounded-xl p-5 ve-3d-card-lift ${isGold ? "ve-metallic-gold" : ""}`}
                        style={{ background: isGold ? undefined : `${accent}12`, border: `1px solid ${accent}35`, backdropFilter: "blur(16px)", maxWidth: 560, margin: "0 auto" }}>
                        <div className="flex items-center justify-between mb-4" style={{ transform: "translateZ(40px)" }}>
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.2em] font-mono mb-0.5" style={{ color: DC.textMuted }}>VOUCHEDGE · PREVIEW</div>
                            <div className="text-lg font-bold ve-text-glow-pulse" style={{ color: accent }}>{active.badge}</div>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border"
                            style={{ background: rarity.color + "20", borderColor: rarity.color + "50", color: rarity.color }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: rarity.color }} /> {rarity.label}
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div style={{ transform: "translateZ(60px)" }}>
                            <div className="rounded-xl p-4 border" style={{ background: isGold ? "rgba(107,79,13,0.15)" : DC.bgSecondary + "cc", borderColor: isGold ? "rgba(107,79,13,0.3)" : accent + "30" }}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm border-2"
                                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}80)`, borderColor: accent, boxShadow: `0 0 16px ${accent}50` }}>DK</div>
                                <div>
                                  <div className="text-sm font-bold" style={{ color: isGold ? "#6B4F0D" : DC.textNormal }}>Sample Capper</div>
                                  <div className="text-[10px]" style={{ color: DC.textMuted }}>@sample_capper</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {[{ l: "Record", v: "0-0" }, { l: "Units", v: "0.0u" }, { l: "Streak", v: "—" }].map((s) => (
                                  <div key={s.l} className="text-center py-1.5 rounded-lg border" style={{ background: isGold ? "rgba(107,79,13,0.1)" : accent + "0a", borderColor: isGold ? "rgba(107,79,13,0.2)" : accent + "25" }}>
                                    <div className="text-[7px] uppercase tracking-widest font-mono" style={{ color: DC.textMuted }}>{s.l}</div>
                                    <div className="text-xs font-black font-mono" style={{ color: isGold ? "#6B4F0D" : accent }}>{s.v}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ transform: "translateZ(80px)" }}>
                            <div className="rounded-xl p-4 border" style={{ background: isGold ? "rgba(107,79,13,0.12)" : DC.bgSecondary + "cc", borderColor: isGold ? "rgba(107,79,13,0.3)" : accent + "30" }}>
                              <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: DC.textMuted }}>SLIP #VE-DEMO-001</span>
                                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border" style={{ background: accent + "20", borderColor: accent + "40", color: accent }}>VOUCHCHECK ✓</span>
                              </div>
                              <div className="space-y-1.5">
                                {[{ leg: "A. Judge OVR 1.5+", odds: "+145" }, { leg: "S. Ohtani 1+ HR", odds: "+310" }, { leg: "B. Witt Jr. 2+ TB", odds: "+125" }].map((leg, i) => (
                                  <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs border" style={{ background: accent + "0a", borderColor: accent + "20" }}>
                                    <div className="flex items-center gap-1.5"><Check className="w-3 h-3" style={{ color: accent }} /><span style={{ color: DC.textNormal }}>{leg.leg}</span></div>
                                    <span className="font-mono font-bold text-[10px]" style={{ color: accent }}>{leg.odds}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2.5 flex items-center justify-between rounded-lg px-2.5 py-2 border" style={{ background: accent + "15", borderColor: accent + "35" }}>
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: DC.textMuted }}>SLIP EDGE</span>
                                <span className="text-base font-black font-mono ve-text-glow-pulse" style={{ color: accent }}>+12.5%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-mono uppercase tracking-widest" style={{ color: DC.textMuted, transform: "translateZ(20px)" }}>
                          <Sparkles className="w-2.5 h-2.5" style={{ color: accent }} /> Move mouse over card for 3D tilt
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Action bar under preview */}
              <div className="mt-3 rounded-xl border p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                style={{ background: DC.bgSecondary, borderColor: DC.separator, borderLeft: `4px solid ${accent}` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: DC.textNormal }}>{active.name}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: rarity.color + "20", color: rarity.color }}>{rarity.label}</span>
                    {!isOwned(active) && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: "#D4AF3720", color: "#F2C94C" }}>
                        <Coins className="w-3 h-3" /> {themePrice(active)} credits
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-1 font-mono" style={{ color: DC.textMuted }}>{active.unlockCondition}</p>
                </div>
                <button onClick={() => isEquipped(active) ? undefined : isOwned(active) ? handleApply(active) : handleBuy(active)}
                  disabled={isEquipped(active)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-bold transition-colors disabled:cursor-default"
                  style={{
                    background: isEquipped(active) ? DC.bgTertiary : isOwned(active) ? DC.green : DC.blurple,
                    color: isEquipped(active) ? DC.textMuted : "#fff",
                  }}>
                  {isEquipped(active) ? <><Check className="w-4 h-4" /> Equipped</>
                    : isOwned(active) ? <><Check className="w-4 h-4" /> Equip theme</>
                    : <><Lock className="w-4 h-4" /> Buy · {themePrice(active)} credits</>}
                </button>
              </div>
            </div>

            {/* Feature cards */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: DC.textMuted }}>What makes them epic</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {FEATURE_CARDS.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="rounded-xl p-4 border" style={{ background: DC.bgSecondary, borderColor: DC.separator }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 border" style={{ background: f.color + "18", borderColor: f.color + "30" }}>
                        <Icon className="w-4 h-4" style={{ color: f.color }} />
                      </div>
                      <h3 className="text-xs font-bold mb-1" style={{ color: DC.textNormal }}>{f.title}</h3>
                      <p className="text-[10px] leading-relaxed" style={{ color: DC.textMuted }}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xl flex items-center gap-2"
            style={{ background: toast.ok ? DC.green : "#da373c", color: "#fff" }}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />} {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function isActiveChip(id: string, activeId: string) { return id === activeId; }
