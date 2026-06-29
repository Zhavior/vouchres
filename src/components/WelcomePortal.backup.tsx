import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Lock,
  ShieldCheck,
  Sparkles,
  Waves,
} from 'lucide-react';
import { EDGE_PORTAL_FEATURES, EDGE_PORTAL_GROUP_LABELS } from './edgePortal/edgePortalRegistry';
import { EDGE_AI_TOOLS } from './edgePortal/edgePortalAiRegistry';
import type { EdgePortalFeature } from './edgePortal/edgePortalTypes';
import './edgePortal/edgePortalTheme.css';

type Props = {
  onSectionChange: (section: string) => void;
};

function groupFeatures(features: EdgePortalFeature[]) {
  return features.reduce<Record<string, EdgePortalFeature[]>>((acc, feature) => {
    if (feature.enabled === false) return acc;
    acc[feature.group] ||= [];
    acc[feature.group].push(feature);
    return acc;
  }, {});
}

function handleSection(onSectionChange: Props['onSectionChange'], section: string) {
  onSectionChange(section || 'feed');
}

function FeaturePortalCard({
  feature,
  index,
  onSectionChange,
}: {
  feature: EdgePortalFeature;
  index: number;
  onSectionChange: Props['onSectionChange'];
}) {
  const Icon = feature.icon;
  const locked = Boolean(feature.requiresPro);

  return (
    <motion.button
      type="button"
      onClick={() => handleSection(onSectionChange, feature.section)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.035, 0.22), ease: [0.22, 1, 0.36, 1] }}
      className="edge-portal-card group relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-[var(--edge-portal-card)] p-4 text-left shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-cyan-300/[0.06]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 shadow-lg shadow-cyan-950/20">
          {Icon ? <Icon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {feature.eyebrow && (
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/80">
                  {feature.eyebrow}
                </div>
              )}
              <div className="mt-0.5 truncate text-sm font-black text-white">{feature.title}</div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {feature.badge && (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[9px] font-black uppercase text-amber-100">
                  {feature.badge}
                </span>
              )}
              {locked ? (
                <Lock className="h-4 w-4 text-amber-200" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" />
              )}
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{feature.subtitle}</p>
        </div>
      </div>
    </motion.button>
  );
}

function AiSeatPreview() {
  const tools = EDGE_AI_TOOLS.filter((tool) => tool.enabled).slice(0, 4);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/10 via-slate-900/80 to-slate-950 p-5 shadow-2xl shadow-cyan-950/20"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <Bot className="h-7 w-7" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-white">AI Seat Ready</h3>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
              Offline-safe
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            The portal is built so OpenAI, Gemini, Claude, Z.ai, or your own model can plug in later without breaking the app.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {tools.map((tool) => (
              <div key={tool.id} className="rounded-2xl border border-slate-800 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-slate-100">{tool.title}</div>
                  {tool.requiresPro && <Lock className="h-3.5 w-3.5 text-amber-200" />}
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default function WelcomePortal({ onSectionChange }: Props) {
  const features = [...EDGE_PORTAL_FEATURES]
    .filter((feature) => feature.enabled !== false)
    .sort((a, b) => a.priority - b.priority);

  const grouped = groupFeatures(features);
  const groupOrder: EdgePortalFeature['group'][] = ['today', 'build', 'proof', 'pro', 'system'];

  const handleEnter = () => onSectionChange('feed');
  const handleDailyBoard = () => onSectionChange('daily_players');

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_80%_8%,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,#020617_0%,#050816_45%,#020617_100%)]" />
        <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(rgba(148,163,184,0.38)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-cyan-950/20 to-transparent" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-slate-950/50 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button onClick={handleEnter} className="group flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-lg shadow-cyan-950/30">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_30%)]" />
              <span className="relative text-sm font-black">VE</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-white">Vouch<span className="text-cyan-300">Edge</span></div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Command Portal</div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={handleEnter} className="hidden rounded-xl px-3 py-2 text-xs font-bold text-slate-300 transition hover:text-white sm:inline-flex">
              Sign in
            </button>
            <button
              onClick={handleEnter}
              className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-600 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5"
            >
              Enter VouchEdge
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Proof over hype · Beta command system
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Your sports edge should feel like a{' '}
            <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              command portal.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg"
          >
            Start with the full VouchEdge welcome portal. Once you enter the app, it transforms into the compact Open Edge command drawer you can access anytime.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.23, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <button
              onClick={handleEnter}
              className="edge-portal-shine relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-600 px-6 py-3.5 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-950/30 transition hover:-translate-y-0.5"
            >
              <span className="relative flex items-center gap-2">
                Enter VouchEdge <ArrowRight className="h-4 w-4" />
              </span>
            </button>

            <button
              onClick={handleDailyBoard}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-3.5 text-sm font-black text-cyan-50 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-cyan-200/35"
            >
              Open Today’s Board
            </button>
          </motion.div>

          <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              Posted before start
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
              Graded after final
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" />
              AI-seat ready
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-10 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.25rem] border border-cyan-300/15 bg-slate-950/80 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">
                <Waves className="h-3.5 w-3.5" />
                Tidal Glass Motion
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-100">
                Live
              </span>
            </div>

            <div className="grid gap-3">
              {features.slice(0, 5).map((feature, index) => (
                <FeaturePortalCard
                  key={feature.id}
                  feature={feature}
                  index={index}
                  onSectionChange={onSectionChange}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <AiSeatPreview />
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">
            Everything inside one portal
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            One registry powers the welcome page and the compact Open Edge drawer.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Add a future feature once, and it can appear in the full welcome portal and the always-available command drawer.
          </p>
        </div>

        <div className="space-y-8">
          {groupOrder.map((group) => {
            const items = grouped[group] || [];
            if (!items.length) return null;

            return (
              <section key={group}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                    {EDGE_PORTAL_GROUP_LABELS[group]}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-600">{items.length} tools</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((feature, index) => (
                    <FeaturePortalCard
                      key={feature.id}
                      feature={feature}
                      index={index}
                      onSectionChange={onSectionChange}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 border-t border-white/[0.06] bg-slate-950/70 px-4 py-12 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Enter once. Open Edge anytime.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            The full portal becomes a smaller command layer inside the app, with the same feature registry, AI seat, and premium motion language.
          </p>

          <button
            onClick={handleEnter}
            className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-600 px-7 py-3.5 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-950/30 transition hover:-translate-y-0.5"
          >
            Enter VouchEdge
          </button>
        </div>
      </section>
    </main>
  );
}
