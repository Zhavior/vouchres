import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Zap } from 'lucide-react';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import { useMlbNewsWire, type MlbNewsCategory, type MlbNewsItem } from '../../hooks/useMlbNewsWire';

interface TodayMobileNewsWireProps {
  /** The loaded slate, used to resolve a story's players into openable rows. */
  slateRows: readonly HrWatchRow[];
  onOpenPlayer: (row: HrWatchRow) => void;
}

const ROTATE_MS = 6_000;

const CATEGORY_STYLES: Record<MlbNewsCategory, { label: string; pill: string; dot: string }> = {
  INJURY: { label: 'INJURY', pill: 'border-rose-400/35 bg-rose-500/12 text-rose-300', dot: 'bg-rose-400' },
  LINEUP: {
    label: 'LINEUP',
    pill: 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/12 text-[var(--aurora-max-emerald)]',
    dot: 'bg-[var(--aurora-max-emerald)]',
  },
  ROSTER: { label: 'ROSTER', pill: 'border-sky-400/35 bg-sky-500/12 text-sky-300', dot: 'bg-sky-400' },
  ALERT: { label: 'ALERT', pill: 'border-amber-400/35 bg-amber-500/12 text-amber-300', dot: 'bg-amber-400' },
  NEWS: { label: 'NEWS', pill: 'border-white/12 bg-white/[0.05] text-white/60', dot: 'bg-white/40' },
};

/** "6m ago". Absolute timestamps are noise on a ticker that rotates every 6s. */
function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';

  const seconds = Math.round((Date.now() - ms) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/*
 * ESPN athlete ids are not MLBAM ids, so a mention is resolved by name against
 * the slate that is already loaded on this page. An unmatched mention simply
 * has no telemetry button — the story still reads.
 */
function resolveMention(item: MlbNewsItem, index: Map<string, HrWatchRow>): HrWatchRow | null {
  for (const mention of item.playerMentions) {
    const row = index.get(normalizeName(mention.name));
    if (row) return row;
  }
  return null;
}

export function TodayMobileNewsWire({ slateRows, onOpenPlayer }: TodayMobileNewsWireProps) {
  const { items } = useMlbNewsWire();
  const [cursor, setCursor] = useState(0);
  const [paused, setPaused] = useState(false);
  const [openItem, setOpenItem] = useState<MlbNewsItem | null>(null);
  const [documentHidden, setDocumentHidden] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'hidden',
  );

  const slateIndex = useMemo(() => {
    const index = new Map<string, HrWatchRow>();
    for (const row of slateRows) {
      const key = normalizeName(row.playerName ?? '');
      if (key && !index.has(key)) index.set(key, row);
    }
    return index;
  }, [slateRows]);

  /*
   * Rotation stops while the sheet is open, a finger is down, or the tab is
   * hidden. The last one is not an optimisation: rotating in a background tab
   * swaps the headline through a crossfade whose frames never run, so the tab
   * is returned to with an invisible headline until the next paint.
   */
  useEffect(() => {
    const sync = () => setDocumentHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  useEffect(() => {
    if (items.length <= 1 || paused || openItem || documentHidden) return;
    const id = window.setInterval(() => setCursor((c) => (c + 1) % items.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length, paused, openItem, documentHidden]);

  useEffect(() => {
    if (cursor >= items.length) setCursor(0);
  }, [cursor, items.length]);

  useEffect(() => {
    if (!openItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItem]);

  const current = items[cursor] ?? null;
  const currentStyle = CATEGORY_STYLES[current?.category ?? 'NEWS'];
  const sheetStyle = CATEGORY_STYLES[openItem?.category ?? 'NEWS'];
  const sheetRow = openItem ? resolveMention(openItem, slateIndex) : null;

  return (
    <section className="px-4 md:hidden" aria-label="MLB intel and injury wire">
      {/* The strip keeps its height before the feed lands, so the sections
          below it never jump when the first headline arrives. */}
      <button
        type="button"
        disabled={!current}
        onClick={() => current && setOpenItem(current)}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-label={current ? `Open wire story: ${current.headline}` : 'Intel wire loading'}
        className="flex h-11 w-full items-center gap-2.5 overflow-hidden rounded-xl border border-emerald-950/80 bg-[var(--aurora-max-panel-strong)] px-3 text-left transition active:bg-white/[0.04] disabled:cursor-default"
      >
        <span className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/12 px-1.5 py-0.5 font-mono text-[9px] font-black tracking-[0.12em] text-[var(--aurora-max-emerald)]">
          <Zap className="h-2.5 w-2.5" aria-hidden="true" />
          WIRE
        </span>

        <div aria-live="polite" className="min-w-0 flex-1">
          {current ? (
            /*
             * Keyed so each rotation restarts the entrance animation, and
             * unanimated while the tab is hidden — a browser freezes a hidden
             * tab's animations on their first frame, which for a fade-in means
             * an invisible headline sitting there until the tab is looked at.
             */
            <span
              key={current.id}
              className={`flex min-w-0 items-center gap-2 ${documentHidden ? '' : 'tn-wire-item'}`}
            >
              <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-black tracking-wider ${currentStyle.pill}`}>
                {currentStyle.label}
              </span>
              <span className="truncate text-[12px] font-medium text-white/80">{current.headline}</span>
            </span>
          ) : (
            <span className="font-mono text-[11px] text-white/30">Scanning the wire…</span>
          )}
        </div>

        {current && (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/35">{relativeTime(current.publishedAt)}</span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {openItem && (
            <>
              <motion.div
                key="wire-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpenItem(null)}
                className="fixed inset-0 z-[66] bg-black/70 backdrop-blur-sm md:hidden"
                aria-hidden="true"
              />

              <motion.div
                key="wire-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                role="dialog"
                aria-modal="true"
                aria-label="Wire story"
                className="fixed inset-x-0 bottom-0 z-[68] max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-emerald-900/80 bg-[var(--aurora-max-obsidian)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-24px_80px_rgba(0,0,0,0.55)] md:hidden"
              >
                <div className="mb-4 flex justify-center" aria-hidden="true">
                  <span className="h-1.5 w-11 rounded-full bg-white/20" />
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-black tracking-wider ${sheetStyle.pill}`}>
                    {sheetStyle.label}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-white/35">{relativeTime(openItem.publishedAt)}</span>
                </div>

                <h2 className="mt-3 text-balance text-[19px] font-bold leading-snug text-white">{openItem.headline}</h2>

                {openItem.description && (
                  <p className="mt-3 text-[14px] leading-6 text-white/55">{openItem.description}</p>
                )}

                {sheetRow && (
                  <button
                    type="button"
                    onClick={() => {
                      const row = sheetRow;
                      setOpenItem(null);
                      onOpenPlayer(row);
                    }}
                    className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--aurora-max-emerald)]/45 bg-[var(--aurora-max-emerald)]/15 text-[13px] font-bold text-[var(--aurora-max-emerald)] transition active:bg-[var(--aurora-max-emerald)]/30"
                  >
                    <Zap className="h-4 w-4" aria-hidden="true" />
                    View {sheetRow.playerName} telemetry
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  {openItem.url ? (
                    <a
                      href={openItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-mono text-[11px] text-white/40 active:text-white/70"
                    >
                      Source: ESPN
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="font-mono text-[11px] text-white/30">Source: ESPN</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenItem(null)}
                    className="font-mono text-[11px] font-bold text-white/45 active:text-white"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}
