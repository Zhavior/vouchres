import React, { memo, useRef, useCallback } from 'react';
import { Layers, Zap, Flame, Activity } from 'lucide-react';
import { safeNumber } from '../../../utils/safeNumber';
import { STRINGS_EN } from '../stringsEn';

export type TierType = 'all' | 'very_high' | 'high' | 'moderate';

interface TierFilterTabsProps {
  counts: {
    all: number;
    very_high: number;
    high: number;
    moderate: number;
  };
  selectedTier: TierType;
  onSelectTier: (tier: TierType) => void;
}

interface TierTabConfig {
  id: TierType;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  activeBg: string;
  activeBorder: string;
  activeGlow: string;
  activeBadge: string;
  iconColor: string;
  activeIconColor: string;
}

const TABS: TierTabConfig[] = [
  {
    id: 'all',
    label: STRINGS_EN.tierTabs.all.label,
    sublabel: 'SLATE',
    icon: Layers,
    tone: 'text-white/70 hover:text-white',
    activeBg: 'bg-white/[0.08] backdrop-blur-xl',
    activeBorder: 'border-white/40',
    activeGlow: 'shadow-[0_0_20px_rgba(255,255,255,0.12)]',
    activeBadge: 'bg-white/20 text-white border-white/30',
    iconColor: 'text-white/60',
    activeIconColor: 'text-white',
  },
  {
    id: 'very_high',
    label: STRINGS_EN.tierTabs.very_high.label,
    sublabel: '85+ HRPI',
    icon: Zap,
    tone: 'text-emerald-400/80 hover:text-emerald-300',
    activeBg: 'bg-emerald-500/15 backdrop-blur-xl',
    activeBorder: 'border-emerald-400/50',
    activeGlow: 'shadow-[0_0_24px_rgba(16,185,129,0.3)]',
    activeBadge: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40',
    iconColor: 'text-emerald-400/70',
    activeIconColor: 'text-emerald-300',
  },
  {
    id: 'high',
    label: STRINGS_EN.tierTabs.high.label,
    sublabel: '70–84 HRPI',
    icon: Flame,
    tone: 'text-amber-400/80 hover:text-amber-300',
    activeBg: 'bg-amber-500/15 backdrop-blur-xl',
    activeBorder: 'border-amber-400/50',
    activeGlow: 'shadow-[0_0_24px_rgba(245,158,11,0.3)]',
    activeBadge: 'bg-amber-500/30 text-amber-200 border-amber-400/40',
    iconColor: 'text-amber-400/70',
    activeIconColor: 'text-amber-300',
  },
  {
    id: 'moderate',
    label: STRINGS_EN.tierTabs.moderate.label,
    sublabel: '<70 HRPI',
    icon: Activity,
    tone: 'text-cyan-400/80 hover:text-cyan-300',
    activeBg: 'bg-cyan-500/15 backdrop-blur-xl',
    activeBorder: 'border-cyan-400/50',
    activeGlow: 'shadow-[0_0_24px_rgba(6,182,212,0.3)]',
    activeBadge: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/40',
    iconColor: 'text-cyan-400/70',
    activeIconColor: 'text-cyan-300',
  },
];

export const TierFilterTabs = memo(function TierFilterTabs({
  counts,
  selectedTier,
  onSelectTier,
}: TierFilterTabsProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentId: TierType) => {
      const currentIndex = TABS.findIndex((t) => t.id === currentId);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = TABS.length - 1;
      }

      if (nextIndex !== -1) {
        const nextTab = TABS[nextIndex];
        onSelectTier(nextTab.id);
        buttonRefs.current[nextTab.id]?.focus();
      }
    },
    [onSelectTier]
  );

  return (
    <div
      className="relative flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.28)] overflow-x-auto scrollbar-none max-w-full"
      role="tablist"
      aria-label={STRINGS_EN.tierTabs.groupAriaLabel}
    >
      {TABS.map((tab) => {
        const active = selectedTier === tab.id;
        const count = safeNumber(counts[tab.id], 0);
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttonRefs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            onClick={() => onSelectTier(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            aria-selected={active}
            aria-pressed={active}
            tabIndex={active ? 0 : -1}
            className={`group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl border text-xs font-bold font-mono transition-all duration-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-vouch-cyan ${
              active
                ? `${tab.activeBg} ${tab.activeBorder} text-white ${tab.activeGlow}`
                : 'bg-white/[0.01] hover:bg-white/[0.05] border-white/5 hover:border-white/15 text-white/60 hover:text-white'
            }`}
          >
            {/* Luminous indicator dot for active tab */}
            {active && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            )}

            <IconComponent
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                active ? tab.activeIconColor : tab.iconColor
              }`}
            />

            <div className="flex items-baseline gap-1.5">
              <span className={active ? 'text-white tracking-wide' : tab.tone}>
                {tab.label}
              </span>
              <span className="hidden md:inline text-[9px] font-normal tracking-tight text-white/40 group-hover:text-white/60 transition-colors">
                {tab.sublabel}
              </span>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border tabular-nums transition-all ${
                active
                  ? tab.activeBadge
                  : 'bg-white/5 border-white/10 text-white/50 group-hover:text-white/80 group-hover:bg-white/10'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
});
