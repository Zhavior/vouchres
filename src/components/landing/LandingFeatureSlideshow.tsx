import { useEffect, useState, type ComponentType } from 'react';
import { Z8_INTERACTIVE, Z8_LABEL, Z8_PANEL, Z8_PANEL_PREMIUM } from './LandingTokens';
import { ChevronLeft, ChevronRight } from './LandingIcons';

type LandingIconComponent = ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>;

export type LandingFeature = {
  icon: LandingIconComponent;
  eyebrow: string;
  title: string;
  copy: string;
  route: string;
};

const SLIDE_MS = 7000;

export default function LandingFeatureSlideshow({ features }: { features: readonly LandingFeature[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = features.length;

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;

  const feature = features[index];

  return (
    <section aria-labelledby="platform-heading" className="space-y-6">
      <div className="text-center">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>Platform</p>
        <h2 id="platform-heading" className="mt-2 text-2xl font-black text-white sm:text-3xl">
          Built for the full research loop
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/45">
          Verified HR boards, live slate context, judge research, and player intelligence — honest about what is confirmed vs projected.
        </p>
      </div>

      <div
        className={`ve-landing-feature-slideshow relative overflow-hidden rounded-2xl ${Z8_PANEL_PREMIUM}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="ve-landing-feature-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {features.map((item) => {
            const SlideIcon = item.icon;
            return (
              <article key={item.eyebrow} className={`ve-landing-feature-slide min-w-full ${Z8_PANEL} p-6 sm:p-8`}>
                <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan shadow-[0_0_24px_rgba(0,240,255,0.08)]">
                    <SlideIcon size={22} strokeWidth={2.25} />
                  </div>
                  <p className={`${Z8_LABEL} text-vouch-cyan/80`}>{item.eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50 sm:text-base">{item.copy}</p>
                  <span className="mt-5 inline-flex rounded-full border border-vouch-emerald/25 bg-vouch-emerald/8 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-vouch-emerald/85">
                    Premium terminal module
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {count > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-3 py-2.5">
            <button
              type="button"
              aria-label="Previous feature"
              onClick={() => setIndex((current) => (current - 1 + count) % count)}
              className={`${Z8_INTERACTIVE} flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan`}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2">
              {features.map((item, dotIndex) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  aria-label={`Show ${item.eyebrow}`}
                  aria-current={dotIndex === index}
                  onClick={() => setIndex(dotIndex)}
                  className={`h-1.5 rounded-full transition-all ${
                    dotIndex === index
                      ? 'w-5 bg-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.45)]'
                      : 'w-1.5 bg-white/20 hover:bg-vouch-cyan/40'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next feature"
              onClick={() => setIndex((current) => (current + 1) % count)}
              className={`${Z8_INTERACTIVE} flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="border-t border-white/10 px-5 py-3 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">
            Now viewing: <span className="text-vouch-cyan/80">{feature.eyebrow}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {features.map((item, featureIndex) => {
          const MiniIcon = item.icon;
          const active = featureIndex === index;
          return (
            <button
              key={item.eyebrow}
              type="button"
              aria-current={active}
              onClick={() => setIndex(featureIndex)}
              className={`${Z8_INTERACTIVE} rounded-xl border p-3 text-left transition ${
                active
                  ? 'border-vouch-cyan/40 bg-vouch-cyan/10 shadow-[0_0_20px_rgba(0,240,255,0.08)]'
                  : 'border-white/10 bg-black/25 hover:border-vouch-cyan/25'
              }`}
            >
              <MiniIcon size={16} className={active ? 'text-vouch-cyan' : 'text-white/40'} />
              <p className={`mt-2 font-mono text-[9px] font-bold uppercase tracking-widest ${active ? 'text-vouch-cyan' : 'text-white/40'}`}>
                {item.eyebrow}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
