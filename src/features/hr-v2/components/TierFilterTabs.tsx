import React, { memo, useRef, useCallback } from 'react';
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

const TABS: Array<{ id: TierType; label: string; icon: string; tone: string }> = [
  {
    id: 'all',
    label: STRINGS_EN.tierTabs.all.label,
    icon: STRINGS_EN.tierTabs.all.icon,
    tone: 'text-white',
  },
  {
    id: 'very_high',
    label: STRINGS_EN.tierTabs.very_high.label,
    icon: STRINGS_EN.tierTabs.very_high.icon,
    tone: 'text-vouch-emerald',
  },
  {
    id: 'high',
    label: STRINGS_EN.tierTabs.high.label,
    icon: STRINGS_EN.tierTabs.high.icon,
    tone: 'text-vouch-amber',
  },
  {
    id: 'moderate',
    label: STRINGS_EN.tierTabs.moderate.label,
    icon: STRINGS_EN.tierTabs.moderate.icon,
    tone: 'text-slate-400',
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
      className="flex items-center gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label={STRINGS_EN.tierTabs.groupAriaLabel}
    >
      {TABS.map((tab) => {
        const active = selectedTier === tab.id;
        const count = safeNumber(counts[tab.id], 0);

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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all duration-200 shadow-sm whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-vouch-cyan ${
              active
                ? 'bg-[#131b2e] border-vouch-cyan text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20'
            }`}
          >
            <span>{tab.icon}</span>
            <span className={active ? 'text-white' : tab.tone}>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                active
                  ? 'bg-vouch-cyan/25 text-vouch-cyan'
                  : 'bg-white/10 text-white/70'
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
