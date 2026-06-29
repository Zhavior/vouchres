import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronRight, Lock, Sparkles, Waves, X } from 'lucide-react';
import { EDGE_PORTAL_FEATURES, EDGE_PORTAL_GROUP_LABELS } from './edgePortalRegistry';
import { EDGE_AI_TOOLS } from './edgePortalAiRegistry';
import type { EdgePortalFeature } from './edgePortalTypes';
import './edgePortalTheme.css';

type EdgePortalProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isPro?: boolean;
  slateLabel?: string;
};

function groupFeatures(features: EdgePortalFeature[]) {
  return features.reduce<Record<string, EdgePortalFeature[]>>((acc, feature) => {
    if (feature.enabled === false) return acc;
    acc[feature.group] ||= [];
    acc[feature.group].push(feature);
    return acc;
  }, {});
}

function AiSeat({ isPro }: { isPro: boolean }) {
  const tools = EDGE_AI_TOOLS.filter((tool) => tool.enabled);
  const lockedCount = tools.filter((tool) => tool.requiresPro && !isPro).length;

  return (
    <section className="edge-portal-card rounded-[1.75rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/10 via-slate-900/70 to-slate-950 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <Bot className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">AI Seat</h3>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-black uppercase text-slate-400">
              Offline-safe
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Plug in OpenAI, Gemini, Claude, Z.ai, or your own model later. The portal still works if AI is offline.
          </p>

          <div className="mt-3 grid gap-2">
            {tools.slice(0, 3).map((tool) => (
              <div key={tool.id} className="rounded-2xl border border-slate-800 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-100">{tool.title}</span>
                  {tool.requiresPro && !isPro && <Lock className="h-3.5 w-3.5 text-amber-200" />}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{tool.description}</p>
              </div>
            ))}
          </div>

          {lockedCount > 0 && (
            <div className="mt-3 text-[11px] font-bold text-amber-200">
              {lockedCount} Pro AI tool{lockedCount === 1 ? '' : 's'} ready for future unlock.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PortalContent({
  closeRef,
  closePortal,
  openFeature,
  grouped,
  activeFeature,
  isPro,
  slateLabel,
  titleId,
}: {
  closeRef: React.RefObject<HTMLButtonElement | null>;
  closePortal: () => void;
  openFeature: (feature: EdgePortalFeature) => void;
  grouped: Record<string, EdgePortalFeature[]>;
  activeFeature?: EdgePortalFeature;
  isPro: boolean;
  slateLabel: string;
  titleId: string;
}) {
  const groupOrder: EdgePortalFeature['group'][] = ['today', 'build', 'proof', 'pro', 'system'];

  return (
    <div className="flex h-full max-h-[88dvh] flex-col">
      <div className="border-b border-cyan-300/10 bg-gradient-to-br from-cyan-300/10 via-slate-950 to-slate-950 p-5">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-cyan-200/30" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              {slateLabel}
            </div>

            <h2 id={titleId} className="text-2xl font-black tracking-tight text-white">
              VouchEdge Command Portal
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Find picks, build smarter slips, track proof, and use the AI Seat when connected.
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={closePortal}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            aria-label="Close Edge Portal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {activeFeature && (
          <div className="mt-4 rounded-3xl border border-cyan-300/15 bg-black/20 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">You are here</div>
            <div className="mt-1 text-sm font-black text-white">{activeFeature.title}</div>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <AiSeat isPro={isPro} />

        {groupOrder.map((group) => {
          const items = grouped[group] || [];
          if (!items.length) return null;

          return (
            <section key={group} className="edge-portal-card">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                  {EDGE_PORTAL_GROUP_LABELS[group]}
                </h3>
                <span className="text-[11px] font-bold text-slate-600">{items.length}</span>
              </div>

              <div className="grid gap-2">
                {items.map((feature) => {
                  const Icon = feature.icon;
                  const locked = Boolean(feature.requiresPro && !isPro);

                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => openFeature(feature)}
                      className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-[var(--edge-portal-card)] p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
                          {Icon ? <Icon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {feature.eyebrow && (
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">
                                  {feature.eyebrow}
                                </div>
                              )}
                              <div className="truncate text-sm font-black text-white">{feature.title}</div>
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
                                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-200" />
                              )}
                            </div>
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{feature.subtitle}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function EdgePortal({
  activeSection,
  onSectionChange,
  isPro = false,
  slateLabel = 'Live MLB Slate',
}: EdgePortalProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const features = useMemo(
    () => [...EDGE_PORTAL_FEATURES].filter((feature) => feature.enabled !== false).sort((a, b) => a.priority - b.priority),
    []
  );

  const grouped = useMemo(() => groupFeatures(features), [features]);
  const activeFeature = features.find((feature) => feature.section === activeSection);

  function closePortal() {
    setOpen(false);
    window.setTimeout(() => buttonRef.current?.focus(), 60);
  }

  function openFeature(feature: EdgePortalFeature) {
    if (!feature.section) return;

    if (feature.requiresPro && !isPro) {
      onSectionChange('research');
      closePortal();
      return;
    }

    onSectionChange(feature.section);
    closePortal();
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 40);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closePortal();
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="edge-portal-shine fixed bottom-24 right-4 z-[70] overflow-hidden rounded-full border border-cyan-300/25 bg-slate-950/85 px-4 py-3 text-sm font-black text-cyan-50 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-300/10 md:bottom-6 md:right-6"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="relative flex items-center gap-2">
          <Waves className="h-4 w-4 text-cyan-200" />
          Open Edge
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            className="edge-portal-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={closePortal}
            aria-label="Close Edge Portal"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edge-portal-title"
            className="edge-portal-bottom fixed inset-x-3 bottom-3 z-[100] max-h-[86vh] overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[var(--edge-portal-bg)] text-[var(--edge-portal-text)] shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl md:left-1/2 md:right-auto md:w-[760px] md:-translate-x-1/2"
          >
            <PortalContent
              closeRef={closeRef}
              closePortal={closePortal}
              openFeature={openFeature}
              grouped={grouped}
              activeFeature={activeFeature}
              isPro={isPro}
              slateLabel={slateLabel}
              titleId="edge-portal-title"
            />
          </section>

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="edge-portal-title-desktop"
            className="hidden"
          >
            <PortalContent
              closeRef={closeRef}
              closePortal={closePortal}
              openFeature={openFeature}
              grouped={grouped}
              activeFeature={activeFeature}
              isPro={isPro}
              slateLabel={slateLabel}
              titleId="edge-portal-title-desktop"
            />
          </aside>
        </div>
      )}
    </>
  );
}
