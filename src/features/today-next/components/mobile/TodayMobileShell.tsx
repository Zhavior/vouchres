import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import HrPlayerDrawer from '../../../hr/components/Drawer/HrPlayerDrawer';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import type { TodayDecision } from '../../../../components/today/todayDecisionModel';
import type { ApiGame } from '../../../../types/mlb';
import { formatCountdown, type TodayNextFirstPitch } from '../../hooks/useTodayNextHome';
import { TodayMobileChrome } from './TodayMobileChrome';
import { TodayMobileHero } from './TodayMobileHero';
import { TodayMobileLiveStrip } from './TodayMobileLiveStrip';
import { TodayMobileNewsWire } from './TodayMobileNewsWire';
import { TodayMobileResearchCta } from './TodayMobileResearchCta';
import {
  applyTodayMobileFilter,
  emptyReasonFor,
  TODAY_MOBILE_FILTERS,
  type TodayMobileFilter,
} from './todayMobileFilters';

interface TodayMobileShellProps {
  decision: TodayDecision;
  reportDateLabel: string;
  firstPitch: TodayNextFirstPitch | null;
  liveGames: ApiGame[];
  deskRows: readonly HrWatchRow[];
  deskConfirmedRows: readonly HrWatchRow[];
  /** Unnarrowed board, so 'confirmed only' is a real filter and not a no-op. */
  deskAllRows: readonly HrWatchRow[];
  onAddPlayer: (row: HrWatchRow) => void;
  onRoute: (section: string) => void;
}

const HERO_COUNT = 5;

/*
 * The phone composition. Not the desktop stack narrowed — a different order.
 *
 * Today answers "what should I do in the next hour": the brief, the top few
 * collisions, live scores, and a door to the full board. It deliberately does
 * NOT render the whole 250+ row slate any more — that duplicated the HR Max
 * route and left two surfaces answering the same question. The board lives in
 * research; this page hands off to it.
 *
 * The desktop desk's side-by-side spotlight + queue does not survive a 375px
 * column, so the spotlight becomes a swipe deck.
 */
export function TodayMobileShell({
  decision,
  reportDateLabel,
  firstPitch,
  liveGames,
  deskRows,
  deskConfirmedRows,
  deskAllRows,
  onAddPlayer,
  onRoute,
}: TodayMobileShellProps) {
  const [filter, setFilter] = useState<TodayMobileFilter>('collision');
  const [openRow, setOpenRow] = useState<HrWatchRow | null>(null);

  const source = deskAllRows.length > 0 ? deskAllRows : deskConfirmedRows.length > 0 ? deskConfirmedRows : deskRows;

  const counts = useMemo(() => {
    const next = {} as Record<TodayMobileFilter, number>;
    for (const def of TODAY_MOBILE_FILTERS) {
      next[def.id] = applyTodayMobileFilter(source, def.id, liveGames).length;
    }
    return next;
  }, [source, liveGames]);

  const filtered = useMemo(
    () => applyTodayMobileFilter(source, filter, liveGames),
    [source, filter, liveGames],
  );

  const hero = filtered.slice(0, HERO_COUNT);
  const rest = filtered.slice(HERO_COUNT);

  return (
    /* Bottom gutter clears the two pieces of fixed chrome stacked at the
       bottom of a phone: the ParlayOS slip dock and the nav pill beneath it.
       The mobile rule on #inner-view-slot already contributes 5rem, which
       covers the pill alone — the dock needs the rest, or the last rows of the
       board sit permanently underneath it. */
    /* Top gutter clears the fixed 52px header only — the filter rail below it
       is sticky, not fixed, so it flows as the first child and sits directly
       under the header rather than needing its own reserved space. Bottom
       gutter clears the slip pill stacked over the nav bar. */
    <div className="pt-[52px] pb-[132px] md:hidden">
      <TodayMobileChrome
        reportDateLabel={reportDateLabel}
        liveCount={liveGames.length}
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />

      {/* Decision brief — one card, one action. */}
      <section className="px-4 pt-4" aria-label="Today's brief">
        <div className="rounded-2xl border border-white/10 bg-[var(--aurora-max-panel-strong)] p-4">
          {firstPitch && liveGames.length === 0 && (
            <p className="mb-2 font-mono text-[11px] text-white/45">
              First pitch in{' '}
              <span className="font-bold tabular-nums text-white">
                {firstPitch.countdownMs != null ? formatCountdown(firstPitch.countdownMs) : 'now'}
              </span>
            </p>
          )}
          <h2 className="text-balance text-[19px] font-bold leading-snug text-white">{decision.title}</h2>
          <p className="mt-1.5 text-[13px] leading-5 text-white/50">{decision.description}</p>
          <button
            type="button"
            onClick={() => onRoute(decision.ctaSection)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--aurora-max-emerald)]/45 bg-[var(--aurora-max-emerald)]/15 text-[13px] font-bold text-[var(--aurora-max-emerald)] transition active:bg-[var(--aurora-max-emerald)]/30"
          >
            {decision.ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Spotlight deck */}
      <div className="pt-4">
        <TodayMobileHero rows={hero} onAdd={onAddPlayer} onOpen={setOpenRow} />
      </div>

      {/* Live scores */}
      <div className="pt-5">
        <TodayMobileLiveStrip games={liveGames} onRoute={onRoute} />
      </div>

      {/* Intel wire — between the scores and the handoff, where a phone
          scrolling for "what changed" actually looks. */}
      <div className="pt-5">
        <TodayMobileNewsWire slateRows={source} onOpenPlayer={setOpenRow} />
      </div>

      {/* Hand off to the full board */}
      <div className="pt-5">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] leading-6 text-white/40">
            {emptyReasonFor(filter, source.length > 0)}
          </p>
        ) : (
          <TodayMobileResearchCta remaining={rest.length} onRoute={onRoute} />
        )}
      </div>

      {/* Deep intel. HrPlayerDrawer owns its own overlay and escape handling. */}
      <HrPlayerDrawer player={openRow} isOpen={openRow != null} onClose={() => setOpenRow(null)} />
    </div>
  );
}
