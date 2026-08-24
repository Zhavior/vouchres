import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Flame, Plus, X, Zap } from 'lucide-react';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import { useMlbNewsArticle, type MlbNewsItem } from '../../hooks/useMlbNewsWire';
import {
  CATEGORY_STYLES,
  classifyTacticalNews,
  getCyberFallbackImage,
  relativeTime,
  resolveMentions,
} from './newsWireFormat';

interface NewsDetailDrawerProps {
  item: MlbNewsItem | null;
  slateIndex: Map<string, HrWatchRow>;
  onClose: () => void;
  onOpenPlayer: (row: HrWatchRow) => void;
  onAddPlayer?: (row: HrWatchRow) => void;
}

export function NewsDetailDrawer({
  item,
  slateIndex,
  onClose,
  onOpenPlayer,
  onAddPlayer,
}: NewsDetailDrawerProps) {
  const { paragraphs, image, isLoadingBody } = useMlbNewsArticle(item);
  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  useEffect(() => setHeroFailed(false), [item?.id]);

  const mentionedRows = useMemo(
    () => (item ? resolveMentions(item, slateIndex, paragraphs) : []),
    [item, slateIndex, paragraphs],
  );

  if (typeof document === 'undefined') return null;

  const category = item ? classifyTacticalNews(item) : 'LINEUP';
  const style = CATEGORY_STYLES[category];
  const heroUrl = heroFailed ? getCyberFallbackImage(category) : image?.url || item?.image?.url || getCyberFallbackImage(category);

  return createPortal(
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="wire-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[66] bg-black/80"
            aria-hidden="true"
          />

          <motion.div
            key="wire-reader"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            role="dialog"
            aria-modal="true"
            aria-label={item.headline}
            className="fixed inset-x-0 bottom-0 z-[68] flex max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl border-t border-white/[0.12] bg-[#0A0A0A] font-mono"
          >
            {/* Grabber Bar & Close */}
            <div className="relative h-44 w-full shrink-0 overflow-hidden bg-obsidian-950 border-b border-white/[0.08]">
              <img
                src={heroUrl}
                alt={item.headline}
                onError={() => setHeroFailed(true)}
                className="h-full w-full object-cover brightness-90"
              />
              <div className="absolute inset-0 from-[#0A0A0A] via-transparent to-transparent" />

              <span
                className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/30"
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={onClose}
                aria-label="Close story"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-none border border-white/[0.12] bg-black/80 text-white transition active:bg-white active:text-black cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Body content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`border px-2 py-0.5 text-[9px] font-mono font-medium uppercase tracking-wider rounded-none ${style.pill}`}>
                  {style.label}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-white/55">
                  {relativeTime(item.publishedAt)}
                </span>
              </div>

              <h2 className="text-balance text-lg sm:text-xl font-bold leading-snug text-[#ffffff] font-sans">
                {item.headline}
              </h2>

              <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-white/70 font-sans">
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
                ) : (
                  <p className="text-white/55">{item.description}</p>
                )}
              </div>

              {isLoadingBody && (
                <p className="font-mono text-[10px] text-white/40 animate-pulse" aria-live="polite">
                  Loading full tactical dispatch...
                </p>
              )}

              {/* Active Slate Mentions Bridge */}
              {mentionedRows.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-ve-emerald flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-ve-emerald" />
                    ACTIVE SLATE BATS IN THIS STORY ({mentionedRows.length})
                  </span>

                  {mentionedRows.map((row) => (
                    <div
                      key={String(row.playerId ?? row.playerName)}
                      className="flex items-center justify-between gap-2 border border-white/[0.08] bg-white/[0.02] p-3 rounded-none"
                    >
                      <div>
                        <strong className="text-xs font-bold text-[#ffffff] block font-sans">{row.playerName}</strong>
                        <span className="text-[9px] text-white/55 font-mono">
                          {row.team} vs {row.opponent}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenPlayer(row);
                          }}
                          className="min-h-[44px] px-4 py-1.5 rounded-none bg-ve-cyan text-black text-[10px] font-mono font-bold uppercase tracking-[0.18em] flex items-center gap-1.5 cursor-pointer hover:bg-white"
                        >
                          DOSSIER <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Dock */}
            <div className="flex shrink-0 items-center justify-between border-t border-white/[0.08] bg-[#0A0A0A] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-[10px] text-white/55 font-mono">
              <span>PROVENANCE: MLB TACTICAL WIRE</span>
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[44px] items-center gap-1 rounded-none border border-white/[0.08] bg-white/[0.04] px-4 py-2 font-mono text-[10px] font-medium text-white uppercase hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                CLOSE
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default NewsDetailDrawer;
