import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X, Zap } from 'lucide-react';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import { useMlbNewsArticle, type MlbNewsItem } from '../../hooks/useMlbNewsWire';
import { CATEGORY_STYLES, relativeTime, resolveMentions } from './newsWireFormat';

interface NewsDetailDrawerProps {
  /** The open story, or null when the reader is closed. */
  item: MlbNewsItem | null;
  /** Slate rows keyed by normalized player name — see buildSlateIndex. */
  slateIndex: Map<string, HrWatchRow>;
  onClose: () => void;
  onOpenPlayer: (row: HrWatchRow) => void;
}

/**
 * The in-app wire reader.
 *
 * Everything a user came for is here: the lead art, the full editorial body,
 * and a way into the telemetry for any slate player the story names. There is
 * deliberately no link out — the body is fetched and parsed server-side (see
 * `getMlbNewsArticle`), so leaving for espn.com would only cost the reader
 * their place on the board. ESPN is credited as the source in the footer.
 *
 * Layout is a flex column with one internal scroller, not a scrolling block:
 * that keeps the hero, the close control and the bottom dock pinned while the
 * body moves under them, so the exit is reachable from anywhere in a long
 * recap without hunting for it.
 */
export function NewsDetailDrawer({ item, slateIndex, onClose, onOpenPlayer }: NewsDetailDrawerProps) {
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

  // A story swap has to clear the previous hero's failure, or one broken image
  // would suppress the art for every story opened after it.
  useEffect(() => setHeroFailed(false), [item?.id]);

  // Recomputed when the body lands: a recap ESPN left untagged still names its
  // players in prose, so the CTAs fill in with the full story.
  const mentionedRows = useMemo(
    () => (item ? resolveMentions(item, slateIndex, paragraphs) : []),
    [item, slateIndex, paragraphs],
  );

  // Below every hook — the portal target is the only reason to bail early.
  if (typeof document === 'undefined') return null;

  const style = CATEGORY_STYLES[item?.category ?? 'NEWS'];
  const hero = heroFailed ? null : image;

  return createPortal(
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="wire-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[66] bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            key="wire-reader"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label={item.headline}
            className="fixed inset-x-0 bottom-0 z-[68] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border-t border-emerald-900/80 bg-[var(--aurora-max-obsidian)] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
          >
            {/* ── Hero ─────────────────────────────────────────────────────
                Fixed aspect box whether or not there is art, so the headline
                below never jumps when a late image decodes. The gradient runs
                to the panel's own obsidian, which is what lets the pill and
                headline sit over the photo without a scrim. */}
            <div className="relative shrink-0">
              {hero ? (
                <div className="relative h-44 w-full overflow-hidden bg-black/60">
                  <img
                    src={hero.url}
                    alt={hero.alt}
                    loading="eager"
                    decoding="async"
                    onError={() => setHeroFailed(true)}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[var(--aurora-max-obsidian)]"
                    aria-hidden="true"
                  />
                </div>
              ) : (
                // No art: still reserve the row the grabber and close control
                // occupy, so the two hero states share one geometry.
                <div className="h-14" aria-hidden="true" />
              )}

              <span
                className="absolute left-1/2 top-3 h-1.5 w-11 -translate-x-1/2 rounded-full bg-white/25"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close story"
                className="absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/80 backdrop-blur-sm transition active:bg-black/80 active:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* ── Body ─────────────────────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex items-center gap-2">
                <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-black tracking-wider ${style.pill}`}>
                  {style.label}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-white/35">{relativeTime(item.publishedAt)}</span>
              </div>

              <h2 className="mt-3 text-balance text-xl font-bold leading-snug text-emerald-50">{item.headline}</h2>

              {/* The summary is already a real paragraph, so the full body
                  replaces it in place when it lands — no skeleton, no reflow
                  above the fold, just the story getting longer. */}
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
                ) : (
                  <p className="text-slate-400">This story arrived as a headline only.</p>
                )}
              </div>

              {isLoadingBody && (
                <p className="mt-3 font-mono text-[11px] text-white/25" aria-live="polite">
                  Loading full story…
                </p>
              )}

              {mentionedRows.length > 0 && (
                <div className="mt-5 space-y-2">
                  {mentionedRows.map((row) => (
                    <button
                      key={String(row.playerId ?? row.playerName)}
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPlayer(row);
                      }}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--aurora-max-emerald)]/45 bg-[var(--aurora-max-emerald)]/15 px-3 text-[13px] font-bold text-[var(--aurora-max-emerald)] transition active:bg-[var(--aurora-max-emerald)]/30"
                    >
                      <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">View {row.playerName} telemetry</span>
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Dock ─────────────────────────────────────────────────────
                Credit only, never a link: the reader is the destination. */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <span className="font-mono text-[11px] text-white/30">Source: ESPN MLB Wire</span>
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-9 items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 font-mono text-[11px] font-bold text-white/60 transition active:bg-white/10 active:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Close
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
