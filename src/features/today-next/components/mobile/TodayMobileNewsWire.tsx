import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Zap } from 'lucide-react';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import { useMlbNewsWire, type MlbNewsItem } from '../../hooks/useMlbNewsWire';
import { NewsDetailDrawer } from './NewsDetailDrawer';
import {
  buildSlateIndex,
  CATEGORY_STYLES,
  classifyTacticalNews,
  getCyberFallbackImage,
  relativeTime,
  resolveMentions,
} from './newsWireFormat';

interface TodayMobileNewsWireProps {
  slateRows: readonly HrWatchRow[];
  onOpenPlayer: (row: HrWatchRow) => void;
}

export function TodayMobileNewsWire({ slateRows, onOpenPlayer }: TodayMobileNewsWireProps) {
  const { items } = useMlbNewsWire();
  const [openItem, setOpenItem] = useState<MlbNewsItem | null>(null);

  const slateIndex = useMemo(() => buildSlateIndex(slateRows), [slateRows]);

  if (items.length === 0) return null;

  return (
    <section className="px-4 md:hidden font-mono" aria-label="MLB tactical intel wire">
      <div className="flex items-center justify-between pb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <Zap className="h-3 w-3 text-[#00FF87]" />
          TACTICAL INTEL WIRE ({items.length})
        </span>
        <span className="text-[9px] text-zinc-500 uppercase">SWIPE STORIES →</span>
      </div>

      {/* Horizontal snap-carousel of tactical news cards */}
      <div className="tn-scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {items.map((item) => {
          const category = classifyTacticalNews(item);
          const style = CATEGORY_STYLES[category];
          const mentions = resolveMentions(item, slateIndex, item.paragraphs);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenItem(item)}
              className="w-[75vw] max-w-[280px] shrink-0 snap-center border border-white/[0.08] bg-[#111113] p-3 text-left flex flex-col justify-between space-y-2.5 transition-colors hover:border-white/[0.18] active:bg-[#18181B] min-h-[140px] cursor-pointer rounded-xl shadow-md"
            >
              {/* Top Row: Category Tag & Timestamp */}
              <div className="flex items-center justify-between w-full">
                <span className={`px-1.5 py-0.5 text-[8px] font-mono font-medium uppercase border tracking-wider rounded ${style.pill}`}>
                  {style.label}
                </span>
                <span className="text-[8px] text-zinc-400 font-mono">{relativeTime(item.publishedAt)}</span>
              </div>

              {/* Headline */}
              <h4 className="text-[#F4F4F5] font-medium text-xs leading-snug line-clamp-2 font-sans">{item.headline}</h4>

              {/* Bottom Tag: Slate Mentions & Read CTA */}
              <div className="flex items-center justify-between w-full pt-1.5 border-t border-white/[0.06] text-[9px]">
                {mentions.length > 0 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Flame className="h-2.5 w-2.5" /> {mentions.length} SLATE BAT{mentions.length > 1 ? 'S' : ''}
                  </span>
                ) : (
                  <span className="text-zinc-500 font-mono tracking-wider uppercase text-[8px]">TACTICAL INTEL</span>
                )}
                <span className="text-sky-400 font-medium uppercase font-mono tracking-wider">READ →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* In-app slide-over / sheet modal drawer */}
      <NewsDetailDrawer
        item={openItem}
        slateIndex={slateIndex}
        onClose={() => setOpenItem(null)}
        onOpenPlayer={onOpenPlayer}
      />
    </section>
  );
}
