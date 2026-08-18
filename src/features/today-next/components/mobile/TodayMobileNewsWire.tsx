import { useEffect, useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import { useMlbNewsWire, type MlbNewsItem } from '../../hooks/useMlbNewsWire';
import { NewsDetailDrawer } from './NewsDetailDrawer';
import { buildSlateIndex, CATEGORY_STYLES, relativeTime } from './newsWireFormat';

interface TodayMobileNewsWireProps {
  /** The loaded slate, used to resolve a story's players into openable rows. */
  slateRows: readonly HrWatchRow[];
  onOpenPlayer: (row: HrWatchRow) => void;
}

const ROTATE_MS = 6_000;

export function TodayMobileNewsWire({ slateRows, onOpenPlayer }: TodayMobileNewsWireProps) {
  const { items } = useMlbNewsWire();
  const [cursor, setCursor] = useState(0);
  const [paused, setPaused] = useState(false);
  const [openItem, setOpenItem] = useState<MlbNewsItem | null>(null);
  const [documentHidden, setDocumentHidden] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'hidden',
  );

  const slateIndex = useMemo(() => buildSlateIndex(slateRows), [slateRows]);

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

  const current = items[cursor] ?? null;
  const currentStyle = CATEGORY_STYLES[current?.category ?? 'NEWS'];

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

      {/* The reader owns the story from here: full body, slate CTAs and the
          ESPN credit, with no way out of the app. */}
      <NewsDetailDrawer
        item={openItem}
        slateIndex={slateIndex}
        onClose={() => setOpenItem(null)}
        onOpenPlayer={onOpenPlayer}
      />
    </section>
  );
}
