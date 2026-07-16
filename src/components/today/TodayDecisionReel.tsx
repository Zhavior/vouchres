import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { getPlayerInitials } from '../../lib/mlbHeadshot';
import { Z8_ACTIVE, Z8_LABEL } from '../../theme/z8Tokens';
import type { TodayReelSlide, TodayReelVisual } from './todayDecisionReelModel';

const AUTO_ADVANCE_MS = 8_000;
const SWIPE_THRESHOLD = 48;

const ACCENTS = {
  cyan: {
    text: 'text-vouch-cyan',
    border: 'border-vouch-cyan/35',
    bg: 'bg-vouch-cyan/10',
    glow: 'rgba(0,240,255,0.22)',
    solid: 'bg-vouch-cyan',
  },
  emerald: {
    text: 'text-vouch-emerald',
    border: 'border-vouch-emerald/35',
    bg: 'bg-vouch-emerald/10',
    glow: 'rgba(0,255,148,0.2)',
    solid: 'bg-vouch-emerald',
  },
  amber: {
    text: 'text-amber-300',
    border: 'border-amber-300/30',
    bg: 'bg-amber-300/10',
    glow: 'rgba(251,191,36,0.2)',
    solid: 'bg-amber-300',
  },
} as const;

interface Props {
  slides: TodayReelSlide[];
  onSectionChange: (section: string) => void;
}

export default function TodayDecisionReel({ slides, onSectionChange }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (activeIndex < slides.length) return;
    setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (paused || reducedMotion || slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, slides.length]);

  const activeSlide = slides[activeIndex] ?? slides[0];
  if (!activeSlide) return null;

  const accent = ACCENTS[activeSlide.tone];
  const goTo = (nextIndex: number) => {
    setActiveIndex((nextIndex + slides.length) % slides.length);
    setPaused(true);
  };

  const onTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return;
    const delta = clientX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD) goTo(activeIndex + 1);
    if (delta > SWIPE_THRESHOLD) goTo(activeIndex - 1);
    touchStartX.current = null;
  };

  return (
    <div
      className="relative h-[760px] overflow-hidden sm:h-[720px] lg:h-[520px]"
      aria-roledescription="carousel"
      aria-label="Today decision reel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        event.stopPropagation();
        onTouchEnd(event.changedTouches[0]?.clientX ?? 0);
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage: `radial-gradient(circle at 78% 42%, ${accent.glow}, transparent 30%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: 'auto, 34px 34px, 34px 34px',
        }}
      />
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/[0.04] sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -right-4 top-0 h-56 w-56 rounded-full border border-white/[0.04] sm:h-72 sm:w-72" />

      <div
        key={activeSlide.id}
        className="relative grid h-full grid-rows-[260px_500px] animate-[fadeIn_350ms_ease-out] motion-reduce:animate-none sm:grid-rows-[300px_420px] lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)] lg:grid-rows-1"
        role="group"
        aria-roledescription="slide"
        aria-label={`${activeIndex + 1} of ${slides.length}`}
      >
        <div className="relative z-10 order-2 flex h-full min-h-0 flex-col justify-between overflow-hidden p-4 sm:p-6 lg:order-1 lg:p-9">
          <div>
            <p className={`flex items-center gap-2 ${Z8_LABEL} ${accent.text}`}>
              <Sparkles className="h-3.5 w-3.5" />
              {activeSlide.kicker}
            </p>
            <h1 className="mt-3 line-clamp-2 max-w-3xl font-mono text-3xl font-black uppercase leading-[1.03] tracking-[-0.045em] text-white sm:mt-4 sm:text-4xl lg:mt-5 lg:text-5xl">
              {activeSlide.title}
            </h1>
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-6 text-white/55 sm:line-clamp-2 sm:text-base">
              {activeSlide.description}
            </p>

            <div className="mt-4 grid max-w-2xl grid-cols-2 gap-2 sm:mt-5">
              <EvidenceLine icon={CheckCircle2} label="Why it matters" text={activeSlide.evidence} tone={accent.text} />
              <EvidenceLine icon={AlertTriangle} label="What could change" text={activeSlide.risk} tone="text-amber-300" />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <button
              type="button"
              onClick={() => onSectionChange(activeSlide.ctaSection)}
              className={`z8-control inline-flex items-center justify-center gap-2 border px-5 py-3 ${Z8_ACTIVE} ${Z8_LABEL}`}
            >
              {activeSlide.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </button>

            {slides.length > 1 ? (
              <div className="flex items-center gap-2" aria-label="Decision reel controls">
                <button
                  type="button"
                  onClick={() => goTo(activeIndex - 1)}
                  className="z8-control flex h-10 w-10 items-center justify-center border border-white/10 bg-black/25 text-white/55 hover:border-white/25 hover:text-white sm:h-11 sm:w-11"
                  aria-label="Previous decision"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => goTo(index)}
                      className="z8-control group flex h-10 w-8 items-center justify-center sm:h-11 sm:w-11"
                      aria-label={`Show decision ${index + 1}: ${slide.kicker}`}
                      aria-current={index === activeIndex ? 'true' : undefined}
                    >
                      <span className={`h-1.5 rounded-full transition-[width,background-color] ${
                        index === activeIndex ? `w-7 ${accent.solid}` : 'w-2 bg-white/20 group-hover:bg-white/40'
                      }`} />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex + 1)}
                  className="z8-control flex h-10 w-10 items-center justify-center border border-white/10 bg-black/25 text-white/55 hover:border-white/25 hover:text-white sm:h-11 sm:w-11"
                  aria-label="Next decision"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <VisualStage visual={activeSlide.visual} tone={activeSlide.tone} />
      </div>
    </div>
  );
}

function EvidenceLine({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
  tone: string;
}) {
  return (
    <div className="border border-white/[0.07] bg-black/20 p-3">
      <p className={`flex items-center gap-1.5 ${Z8_LABEL} ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-white/45">{text}</p>
    </div>
  );
}

function VisualStage({ visual, tone }: { visual: TodayReelVisual; tone: keyof typeof ACCENTS }) {
  if (visual.type === 'matchup') {
    return (
      <div className="relative order-1 flex h-[260px] min-h-0 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-black/20 p-5 sm:h-[300px] lg:order-2 lg:h-full lg:border-b-0 lg:border-l">
        <div className="absolute inset-x-6 top-6 flex items-center justify-between">
          <span className={`${Z8_LABEL} text-white/30`}>Featured matchup</span>
          <span className={`inline-flex items-center gap-1.5 ${Z8_LABEL} ${ACCENTS[tone].text}`}>
            <CircleDot className="h-3 w-3" />
            {visual.status}
          </span>
        </div>
        <div className="relative flex items-center gap-5 sm:gap-8">
          <TeamMark logo={visual.awayLogo} name={visual.awayName} />
          <div className="text-center">
            <span className="block font-mono text-[10px] font-black uppercase tracking-[0.24em] text-white/25">versus</span>
            <span className="mt-1 block font-mono text-3xl font-black text-white/65">@</span>
          </div>
          <TeamMark logo={visual.homeLogo} name={visual.homeName} />
        </div>
      </div>
    );
  }

  if (visual.type === 'portrait') {
    return (
      <div className="relative order-1 flex h-[260px] min-h-0 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-black/20 sm:h-[300px] lg:order-2 lg:h-full lg:border-b-0 lg:border-l">
        {visual.teamLogo ? (
          <img src={visual.teamLogo} alt="" className="pointer-events-none absolute right-5 top-8 h-44 w-44 object-contain opacity-[0.08] sm:h-56 sm:w-56" />
        ) : null}
        <div className="absolute left-5 top-5 z-20 border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-sm">
          <span className={`${Z8_LABEL} text-white/35`}>{visual.scoreLabel}</span>
          <strong className={`ml-3 font-mono text-xl ${ACCENTS[tone].text}`}>{visual.score}</strong>
        </div>
        <Portrait src={visual.headshotUrl} name={visual.name} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between gap-4">
          <div>
            <span className={`${Z8_LABEL} text-white/30`}>Featured research</span>
            <p className="mt-1 font-mono text-lg font-black uppercase text-white">{visual.name}</p>
          </div>
          <Gauge className={`h-6 w-6 ${ACCENTS[tone].text}`} />
        </div>
      </div>
    );
  }

  return (
      <div className="relative order-1 flex h-[260px] min-h-0 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-black/20 p-5 sm:h-[300px] lg:order-2 lg:h-full lg:border-b-0 lg:border-l">
      <div className="absolute inset-x-6 top-6 flex items-center justify-between">
        <span className={`${Z8_LABEL} text-white/30`}>{visual.label}</span>
        <Gauge className={`h-5 w-5 ${ACCENTS[tone].text}`} />
      </div>
      <div className="relative flex items-center justify-center">
        <div className={`flex h-40 w-40 items-center justify-center rounded-full border sm:h-48 sm:w-48 ${ACCENTS[tone].border} ${ACCENTS[tone].bg} shadow-[0_0_80px_-30px_currentColor]`}>
          <div className="text-center">
            <strong className={`block font-mono text-6xl font-black ${ACCENTS[tone].text}`}>{visual.value || '—'}</strong>
            <span className={`${Z8_LABEL} text-white/35`}>out of 100</span>
          </div>
        </div>
        {visual.awayLogo ? <img src={visual.awayLogo} alt="" className="absolute -left-12 top-3 h-16 w-16 object-contain opacity-70" /> : null}
        {visual.homeLogo ? <img src={visual.homeLogo} alt="" className="absolute -right-12 bottom-3 h-16 w-16 object-contain opacity-70" /> : null}
      </div>
    </div>
  );
}

function TeamMark({ logo, name }: { logo: string | null; name: string }) {
  return (
    <div className="text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] p-4 shadow-[0_20px_70px_-30px_rgba(0,240,255,0.5)] sm:h-32 sm:w-32 sm:p-5">
        {logo ? <img src={logo} alt="" className="h-full w-full object-contain" /> : <span className="font-mono text-2xl font-black text-white/60">{name.slice(0, 3)}</span>}
      </div>
      <p className="mt-3 font-mono text-sm font-black text-white">{name}</p>
    </div>
  );
}

function Portrait({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className="mb-16 flex h-48 w-48 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-5xl font-black text-white/25">
        {getPlayerInitials(name)}
      </div>
    );
  }

  return (
    <div
      className="relative z-10 h-[240px] w-full max-w-[340px] overflow-hidden border-x border-t border-white/10 bg-black/25 drop-shadow-[0_22px_50px_rgba(0,0,0,0.65)] sm:h-[280px] lg:h-[300px] lg:max-w-[360px]"
    >
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain object-center"
      />
    </div>
  );
}
