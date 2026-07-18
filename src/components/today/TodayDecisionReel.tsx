import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Plus,
} from 'lucide-react';
import type { Parlay } from '../../types';
import { getPlayerInitials } from '../../lib/mlbHeadshot';
import { Z8_LABEL } from '../../theme/z8Tokens';
import type { TodayReelSlide, TodayReelVisual } from './todayDecisionReelModel';

export type BriefingFilter = 'all' | 'signals' | 'alerts' | 'activity';

interface Props {
  slides: TodayReelSlide[];
  pendingSlip?: Parlay | null;
  filter?: BriefingFilter;
  onSectionChange: (section: string) => void;
  onAddFeaturedPlayer?: () => void;
}

const ACCENTS = {
  cyan: {
    text: 'text-vouch-cyan',
    border: 'border-vouch-cyan/45',
    glow: 'from-vouch-cyan/20',
    button: 'border-vouch-cyan/35 bg-vouch-cyan/10 text-vouch-cyan hover:bg-vouch-cyan/15',
  },
  emerald: {
    text: 'text-vouch-emerald',
    border: 'border-vouch-emerald/45',
    glow: 'from-vouch-emerald/20',
    button: 'border-vouch-emerald/35 bg-vouch-emerald/10 text-vouch-emerald hover:bg-vouch-emerald/15',
  },
  amber: {
    text: 'text-amber-300',
    border: 'border-amber-300/35',
    glow: 'from-amber-300/15',
    button: 'border-amber-300/30 bg-amber-300/10 text-amber-200 hover:bg-amber-300/15',
  },
} as const;

function slideMatchesFilter(slide: TodayReelSlide, filter: BriefingFilter) {
  if (filter === 'all') return true;
  if (filter === 'signals') return slide.id === 'hr-player' || slide.id === 'run-environment' || slide.id === 'pitcher';
  if (filter === 'alerts') return slide.id === 'decision';
  return false;
}

export default function TodayDecisionReel({
  slides,
  pendingSlip = null,
  filter = 'all',
  onSectionChange,
  onAddFeaturedPlayer,
}: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const filteredSlides = slides.filter((slide) => slideMatchesFilter(slide, filter));
  const showSlip = Boolean(pendingSlip) && (filter === 'all' || filter === 'activity');
  const itemCount = filteredSlides.length + (showSlip ? 1 : 0);

  const scroll = (direction: -1 | 1) => {
    railRef.current?.scrollBy({ left: direction * 328, behavior: 'smooth' });
  };

  if (itemCount === 0) {
    return (
      <div className="flex min-h-44 items-center justify-center border border-white/[0.08] bg-white/[0.02] px-6 text-center">
        <div>
          <p className="text-sm font-bold text-white/70">Nothing in this briefing category yet.</p>
          <p className="mt-1 text-xs text-white/42">VouchEdge will show it when verified slate data is available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" aria-label="Today's briefing">
      <div
        ref={railRef}
        className="ve-hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
      >
        {filteredSlides.map((slide, index) => (
          <BriefingCard
            key={slide.id}
            slide={slide}
            priority={index === 0}
            onSectionChange={onSectionChange}
            onAddFeaturedPlayer={onAddFeaturedPlayer}
          />
        ))}
        {showSlip && pendingSlip ? (
          <SlipBriefingCard slip={pendingSlip} onSectionChange={onSectionChange} />
        ) : null}
      </div>

      {itemCount > 1 ? (
        <div className="mt-2 flex items-center justify-end gap-2 sm:absolute sm:-top-14 sm:right-0 sm:mt-0">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="z8-control flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.025] text-white/55 hover:border-white/25 hover:text-white"
            aria-label="Previous briefing cards"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="z8-control flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.025] text-white/55 hover:border-white/25 hover:text-white"
            aria-label="Next briefing cards"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BriefingCard({
  slide,
  priority,
  onSectionChange,
  onAddFeaturedPlayer,
}: {
  slide: TodayReelSlide;
  priority: boolean;
  onSectionChange: (section: string) => void;
  onAddFeaturedPlayer?: () => void;
}) {
  if (slide.visual.type === 'portrait') {
    return <PlayerSignalCard slide={slide} visual={slide.visual} onSectionChange={onSectionChange} onAddToSlip={onAddFeaturedPlayer} />;
  }

  const accent = ACCENTS[slide.tone];

  return (
    <article
      style={{ height: 468, width: 'min(304px, calc(100vw - 40px))' }}
      className={`group relative flex max-w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-ve-obsidian shadow-[0_18px_60px_-42px_rgba(0,240,255,0.65)] ${
        priority ? accent.border : 'border-white/[0.09]'
      }`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b ${accent.glow} to-transparent opacity-70`} />
      <div style={{ height: 180 }} className="relative shrink-0 overflow-hidden border-b border-white/[0.07]">
        <p className={`absolute left-4 top-4 z-20 ${Z8_LABEL} ${accent.text}`}>{slide.kicker}</p>
        <CompactVisual visual={slide.visual} tone={slide.tone} />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-[-0.025em] text-white">{slide.title}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-white/55">{slide.description}</p>

        <div className="mt-4 space-y-3 border-t border-white/[0.07] pt-3">
          <Evidence icon={CheckCircle2} label="Why it matters" text={slide.evidence} tone="text-vouch-emerald" />
          <Evidence icon={AlertTriangle} label="Main risk" text={slide.risk} tone="text-amber-300" />
        </div>

        <button
          type="button"
          onClick={() => onSectionChange(slide.ctaSection)}
          className={`z8-control mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-black ${accent.button}`}
        >
          {slide.ctaLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
}

function PlayerSignalCard({
  slide,
  visual,
  onSectionChange,
  onAddToSlip,
}: {
  slide: TodayReelSlide;
  visual: Extract<TodayReelVisual, { type: 'portrait' }>;
  onSectionChange: (section: string) => void;
  onAddToSlip?: () => void;
}) {
  const isOfficial = /official|confirmed/i.test(slide.kicker);

  return (
    <article
      style={{ height: 468, width: 'min(304px, calc(100vw - 40px))' }}
      className="group relative flex max-w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-vouch-emerald/60 bg-ve-obsidian shadow-[0_20px_65px_-38px_rgba(0,255,148,0.75)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,148,0.13),transparent_34%)]" />

      <div style={{ height: 176 }} className="relative shrink-0 overflow-hidden border-b border-white/[0.08] bg-gradient-to-br from-[#071d29] via-[#07131d] to-[#050a10]">
        <div className="absolute inset-x-4 top-3 z-20 flex items-center justify-between gap-3">
          <p className={`${Z8_LABEL} text-vouch-emerald`}>Top HR signal</p>
          <span className={`rounded-full border px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.08em] ${
            isOfficial
              ? 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald'
              : 'border-amber-300/30 bg-amber-300/10 text-amber-200'
          }`}>
            {isOfficial ? 'Confirmed' : 'Projected'}
          </span>
        </div>

        {visual.teamLogo ? (
          <img src={visual.teamLogo} alt="" className="absolute -left-5 bottom-0 h-32 w-32 object-contain opacity-[0.08]" />
        ) : null}

        <div style={{ height: 140, width: 168 }} className="absolute bottom-0 left-3 flex items-end justify-center overflow-hidden">
          <Portrait src={visual.headshotUrl} name={visual.name} />
        </div>

        <div style={{ height: 92, width: 92 }} className="absolute bottom-5 right-4 z-10 flex flex-col items-center justify-center rounded-full border border-vouch-emerald/40 bg-ve-graphite/95 shadow-[0_0_36px_-12px_rgba(0,255,148,0.9)]">
          <strong className="font-mono text-4xl font-black leading-none text-vouch-emerald">{visual.score}</strong>
          <span className="mt-1 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-vouch-emerald/70">Signal /100</span>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col p-4">
        <h3 className="shrink-0 truncate text-xl font-black leading-tight tracking-[-0.025em] text-white">{slide.title}</h3>
        <p className="mt-1 shrink-0 truncate text-[11px] font-medium text-white/55">{slide.description}</p>

        <div className="mt-2.5 flex items-center gap-2">
          <span className={`rounded-md border px-2 py-1 text-[9px] font-bold ${
            isOfficial
              ? 'border-vouch-emerald/25 bg-vouch-emerald/[0.08] text-vouch-emerald'
              : 'border-amber-300/25 bg-amber-300/[0.08] text-amber-200'
          }`}>
            {isOfficial ? 'Official lineup' : 'Lineup unconfirmed'}
          </span>
          <span className="text-[9px] font-medium text-white/35">Score updated with current board</span>
        </div>

        <div className="mt-3 grid gap-2 border-y border-white/[0.08] py-3">
          <Evidence icon={CheckCircle2} label="Why it matters" text={slide.evidence} tone="text-vouch-emerald" />
          <Evidence icon={AlertTriangle} label="Main risk" text={slide.risk} tone="text-amber-300" />
        </div>

        <div style={{ gridTemplateColumns: '0.9fr 1.1fr' }} className="mt-auto grid shrink-0 gap-2 pt-3">
          <button
            type="button"
            onClick={() => onSectionChange(slide.ctaSection)}
            className="z8-control inline-flex min-h-10 items-center justify-center rounded-lg border border-white/18 bg-white/[0.025] px-2 text-[11px] font-black text-white/80 hover:border-vouch-cyan/40 hover:text-vouch-cyan"
          >
            Research
          </button>
          <button
            type="button"
            onClick={() => onAddToSlip?.()}
            disabled={!onAddToSlip}
            className="z8-control inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-vouch-emerald/40 bg-vouch-emerald/12 px-2 text-[11px] font-black text-vouch-emerald hover:bg-vouch-emerald/18"
          >
            <Plus className="h-4 w-4" /> {onAddToSlip ? 'Add to Slip' : 'Unavailable'}
          </button>
        </div>
      </div>
    </article>
  );
}

function SlipBriefingCard({ slip, onSectionChange }: { slip: Parlay; onSectionChange: (section: string) => void }) {
  const visibleLegs = slip.legs.slice(0, 2);
  return (
    <article style={{ height: 468, width: 'min(304px, calc(100vw - 40px))' }} className="relative flex max-w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-vouch-cyan/25 bg-ve-obsidian">
      <div style={{ height: 180 }} className="relative flex shrink-0 items-center justify-center overflow-hidden border-b border-white/[0.07] bg-gradient-to-br from-vouch-cyan/15 via-[#08182a] to-transparent">
        <p className={`absolute left-4 top-4 ${Z8_LABEL} text-vouch-cyan`}>My slip update</p>
        <ClipboardCheck className="h-20 w-20 text-vouch-cyan/80 drop-shadow-[0_0_28px_rgba(0,240,255,0.24)]" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <h3 className="text-xl font-black text-white">{slip.legs.length}-leg slip in progress</h3>
        <p className="mt-1 text-xs text-white/50">Saved at {formatTime(slip.createdAt)} · {slip.totalOdds || 'Odds unavailable'}</p>
        <div className="mt-4 space-y-2 border-y border-white/[0.07] py-3">
          {visibleLegs.map((leg) => (
            <div key={leg.id} className="flex items-start justify-between gap-3 text-xs">
              <span className="line-clamp-2 text-white/70">{leg.selection}</span>
              <span className="shrink-0 font-mono font-bold text-vouch-emerald">{formatOdds(leg.odds)}</span>
            </div>
          ))}
          {slip.legs.length > visibleLegs.length ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">+{slip.legs.length - visibleLegs.length} more leg</p>
          ) : null}
        </div>
        <p className="mt-3 text-xs leading-5 text-white/45">Track status, review concentration, and see verified results after grading.</p>
        <button
          type="button"
          onClick={() => onSectionChange('live_parlays')}
          className="z8-control mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-vouch-cyan/35 bg-vouch-cyan/10 px-4 py-2 text-xs font-black text-vouch-cyan hover:bg-vouch-cyan/15"
        >
          View my slips
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function CompactVisual({ visual, tone }: { visual: TodayReelVisual; tone: keyof typeof ACCENTS }) {
  if (visual.type === 'portrait') {
    return (
      <div className="absolute inset-0 flex items-end justify-center">
        {visual.teamLogo ? <img src={visual.teamLogo} alt="" className="absolute right-3 top-8 h-28 w-28 object-contain opacity-[0.08]" /> : null}
        <Portrait src={visual.headshotUrl} name={visual.name} />
        <div className="absolute bottom-3 right-3 z-10 flex h-20 w-20 flex-col items-center justify-center rounded-full border border-vouch-emerald/35 bg-ve-graphite/90 shadow-[0_0_30px_-12px_rgba(0,255,148,0.75)]">
          <strong className="font-mono text-3xl font-black text-vouch-emerald">{visual.score}</strong>
          <span className="text-[8px] font-black uppercase tracking-wider text-vouch-emerald/75">/100</span>
        </div>
      </div>
    );
  }

  if (visual.type === 'matchup') {
    return (
      <div className="absolute inset-x-0 bottom-0 top-9 flex items-center justify-center gap-4">
        <TeamMark logo={visual.awayLogo} name={visual.awayName} />
        <span className="font-mono text-xl font-black text-white/35">@</span>
        <TeamMark logo={visual.homeLogo} name={visual.homeName} />
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 top-9 flex items-center justify-center">
      {visual.awayLogo ? <img src={visual.awayLogo} alt="" className="absolute left-7 h-16 w-16 object-contain opacity-35" /> : null}
      <div className="relative z-10 flex h-28 w-28 flex-col items-center justify-center rounded-full border border-white/10 bg-black/45 shadow-[0_0_40px_-18px_rgba(0,240,255,0.8)]">
        <Gauge className={`mb-1 h-4 w-4 ${ACCENTS[tone].text}`} />
        <strong className={`font-mono text-4xl font-black ${ACCENTS[tone].text}`}>{visual.value || '—'}</strong>
        <span className="text-[8px] font-black uppercase tracking-wider text-white/40">{visual.label}</span>
      </div>
      {visual.homeLogo ? <img src={visual.homeLogo} alt="" className="absolute right-7 h-16 w-16 object-contain opacity-35" /> : null}
    </div>
  );
}

function Evidence({ icon: Icon, label, text, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; text: string; tone: string }) {
  return (
    <div>
      <p className={`flex items-center gap-1.5 ${Z8_LABEL} ${tone}`}><Icon className="h-3 w-3" />{label}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/50">{text}</p>
    </div>
  );
}

function TeamMark({ logo, name }: { logo: string | null; name: string }) {
  return (
    <div className="text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] p-2.5">
        {logo ? <img src={logo} alt="" className="h-full w-full object-contain" /> : <span className="font-mono text-sm font-black text-white/60">{name.slice(0, 3)}</span>}
      </div>
      <p className="mt-2 font-mono text-xs font-black text-white/75">{name}</p>
    </div>
  );
}

function Portrait({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-3xl font-black text-white/30">{getPlayerInitials(name)}</div>;
  }

  return <img src={src} alt={name} onError={() => setFailed(true)} style={{ height: 150, width: 190 }} className="object-contain object-bottom" />;
}

function formatTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'time unavailable' : parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatOdds(odds: number | null) {
  if (odds === null || !Number.isFinite(odds)) return 'TBD';
  return odds > 0 ? `+${odds}` : String(odds);
}
