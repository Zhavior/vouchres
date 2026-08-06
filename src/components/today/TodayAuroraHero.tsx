import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Radio, ShieldAlert, Sparkles } from 'lucide-react';
import { getPlayerInitials } from '../../lib/mlbHeadshot';
import type { TodayDecision } from './todayDecisionModel';
import type { TodayReelSlide, TodayReelVisual } from './todayDecisionReelModel';
import { SIGNAL_TIER_STYLES, signalTierFor } from './todaySignalTier';

export type TodayHeroState = 'loading' | 'live' | 'pregame' | 'postgame' | 'no-slate' | 'degraded';

interface Props {
  decision: TodayDecision;
  displayName?: string;
  featuredSlide?: TodayReelSlide | null;
  freshnessLabel: string;
  personalizationLabel?: string;
  state: TodayHeroState;
  onSectionChange: (section: string) => void;
}

const STATE_META: Record<TodayHeroState, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  loading: { label: 'Checking today’s sources', icon: Clock3 },
  live: { label: 'Games in progress', icon: Radio },
  pregame: { label: 'Pregame research', icon: Sparkles },
  postgame: { label: 'Slate complete', icon: CheckCircle2 },
  'no-slate': { label: 'No MLB slate', icon: Clock3 },
  degraded: { label: 'Data needs verification', icon: ShieldAlert },
};

export default function TodayAuroraHero({
  decision,
  displayName,
  featuredSlide,
  freshnessLabel,
  personalizationLabel,
  state,
  onSectionChange,
}: Props) {
  const meta = STATE_META[state];
  const StateIcon = meta.icon;
  const firstName = displayName?.trim().split(/\s+/)[0];

  return (
    <section id="today-aurora-hero" data-performance-page="today" data-state={state} className="today-aurora-hero overflow-hidden rounded-[28px] border border-white/12">
      <div className="today-aurora-hero__grid relative grid min-h-[520px] items-stretch md:min-h-[430px] md:grid-cols-[minmax(0,1.05fr)_minmax(300px,.95fr)]">
        <div className="relative z-10 flex flex-col justify-center px-5 pb-6 pt-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-vouch-cyan/25 bg-vouch-cyan/[0.08] px-3 font-mono text-[10px] font-black uppercase tracking-[0.15em] text-vouch-cyan">
              <StateIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {meta.label}
            </span>
            <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-black/25 px-3 font-mono text-[10px] font-bold text-white/70">
              {freshnessLabel}
            </span>
          </div>

          <p className="mt-6 text-sm font-bold text-white/55">
            {greetingForNow()}{firstName ? `, ${firstName}` : ''}
          </p>
          <h1 className="mt-2 max-w-2xl text-[clamp(2rem,6.5vw,4rem)] font-black leading-[0.98] tracking-[-0.045em] text-white">
            {decision.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/58 sm:text-base sm:leading-7">
            {decision.description}
          </p>
          {personalizationLabel ? (
            <p className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold text-vouch-cyan/80">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {personalizationLabel}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              data-testid="today-primary-action"
              onClick={() => onSectionChange(decision.ctaSection)}
              className="today-aurora-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-[#02100d] sm:w-auto"
            >
              {decision.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="inline-flex items-center justify-center gap-2 text-center text-[11px] font-medium text-white/70 sm:justify-start sm:text-left">
              <span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald" />
              Probability-based research. Outcomes are not guaranteed.
            </span>
          </div>
        </div>

        <div className="today-aurora-hero__visual relative min-h-[230px] overflow-hidden border-t border-white/[0.08] md:min-h-0 md:border-l md:border-t-0">
          <HeroVisual visual={featuredSlide?.visual ?? null} state={state} />
        </div>
      </div>
    </section>
  );
}

function HeroVisual({ visual, state }: { visual: TodayReelVisual | null; state: TodayHeroState }) {
  if (!visual) return <HeroPlaceholder state={state} />;

  if (visual.type === 'portrait') {
    const tier = signalTierFor(visual.score);
    const tierStyle = SIGNAL_TIER_STYLES[tier.id];
    return (
      <div className="absolute inset-0 flex items-end justify-center">
        {visual.teamLogo ? <img src={visual.teamLogo} alt="" className="absolute right-4 top-4 h-40 w-40 object-contain opacity-[0.09] sm:h-52 sm:w-52" loading="lazy" decoding="async" /> : null}
        <HeroPortrait src={visual.headshotUrl} name={visual.name} />
        <div
          style={{ boxShadow: tierStyle.halo }}
          className={`absolute bottom-5 right-5 flex h-24 w-24 flex-col items-center justify-center rounded-full border bg-[#041419]/90 sm:bottom-8 sm:right-8 sm:h-28 sm:w-28 ${tierStyle.border}`}
        >
          <strong className={`font-mono text-4xl font-black leading-none sm:text-5xl ${tierStyle.text}`}>{visual.score}</strong>
          <span className={`mt-1 font-mono text-[9px] font-black uppercase tracking-[0.1em] ${tierStyle.caption}`}>{tier.label}</span>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-white/60">{visual.scoreLabel}</span>
        </div>
        <p className="absolute bottom-5 left-5 max-w-[180px] text-xl font-black leading-tight text-white sm:bottom-8 sm:left-8 sm:text-2xl">{visual.name}</p>
      </div>
    );
  }

  if (visual.type === 'matchup') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-md items-center justify-center gap-5 sm:gap-8">
          <HeroTeam logo={visual.awayLogo} name={visual.awayName} />
          <span className="font-mono text-lg font-black text-white/55">@</span>
          <HeroTeam logo={visual.homeLogo} name={visual.homeName} />
        </div>
        <span className="mt-5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-white/70">{visual.status}</span>
      </div>
    );
  }

  const tier = signalTierFor(visual.value);
  const tierStyle = SIGNAL_TIER_STYLES[tier.id];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {visual.awayLogo ? <img src={visual.awayLogo} alt="" className="absolute left-5 h-24 w-24 object-contain opacity-25 sm:left-8 sm:h-32 sm:w-32" loading="lazy" decoding="async" /> : null}
      <div
        style={{ boxShadow: tierStyle.halo }}
        className={`relative flex h-36 w-36 flex-col items-center justify-center rounded-full border bg-[#03141d]/80 ${tierStyle.border}`}
      >
        <strong className={`font-mono text-5xl font-black ${tierStyle.text}`}>{visual.value || '—'}</strong>
        {tier.id === 'unknown' ? null : (
          <span className={`mt-0.5 font-mono text-[9px] font-black uppercase tracking-[0.1em] ${tierStyle.caption}`}>{tier.label}</span>
        )}
        <span className="mt-1 max-w-28 text-center font-mono text-[9px] font-black uppercase tracking-wider text-white/65">{visual.label}</span>
      </div>
      {visual.homeLogo ? <img src={visual.homeLogo} alt="" className="absolute right-5 h-24 w-24 object-contain opacity-25 sm:right-8 sm:h-32 sm:w-32" loading="lazy" decoding="async" /> : null}
    </div>
  );
}

function HeroTeam({ logo, name }: { logo: string | null; name: string }) {
  return (
    <div className="min-w-0 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_50px_-28px_rgba(0,240,255,.8)] sm:h-32 sm:w-32 sm:p-5">
        {logo ? <img src={logo} alt={`${name} logo`} className="h-full w-full object-contain" loading="eager" decoding="async" /> : <span className="font-mono text-xl font-black text-white/55">{name.slice(0, 3)}</span>}
      </div>
      <p className="mt-3 truncate font-mono text-sm font-black text-white/78">{name}</p>
    </div>
  );
}

function HeroPortrait({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return <div className="mb-12 flex h-36 w-36 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-4xl font-black text-white/55">{getPlayerInitials(name)}</div>;
  }

  return <img src={src} alt={name} onError={() => setFailed(true)} className="h-[92%] w-[88%] object-contain object-bottom drop-shadow-[0_24px_45px_rgba(0,0,0,.5)]" loading="eager" decoding="async" fetchPriority="high" />;
}

function HeroPlaceholder({ state }: { state: TodayHeroState }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className={`today-aurora-orbit ${state === 'loading' ? 'today-aurora-orbit--loading' : ''}`}>
        <span />
      </div>
    </div>
  );
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
