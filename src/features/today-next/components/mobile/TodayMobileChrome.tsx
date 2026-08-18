import { Search, UserCircle } from 'lucide-react';
import { useNavUiStore } from '../../../../stores/navUiStore';
import { TODAY_MOBILE_FILTERS, type TodayMobileFilter } from './todayMobileFilters';

interface TodayMobileChromeProps {
  reportDateLabel: string;
  liveCount: number;
  filter: TodayMobileFilter;
  onFilterChange: (filter: TodayMobileFilter) => void;
  counts: Record<TodayMobileFilter, number>;
}

/** "Sunday, Aug 16" → "Sun, Aug 16" — the bar has one line to spend. */
function compactDate(label: string): string {
  return label.replace(
    /^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day/,
    (_match, stem: string) => ({ Mon: 'Mon', Tues: 'Tue', Wednes: 'Wed', Thurs: 'Thu', Fri: 'Fri', Satur: 'Sat', Sun: 'Sun' })[stem] ?? stem,
  );
}

/*
 * The phone's app header, fixed to the viewport, plus the slate filter rail
 * stuck beneath it.
 *
 * This replaces the shared app top bar on Today rather than stacking under it
 * (see the `body:has()` rule in today-next.css) — two brand bars, two search
 * affordances and 108px of chrome before any content is not a native header.
 * Account moves in here alongside search: the five-tab bottom bar has no slot
 * for it, and it is the only route to settings and sign-out on a phone.
 */
export function TodayMobileChrome({
  reportDateLabel,
  liveCount,
  filter,
  onFilterChange,
  counts,
}: TodayMobileChromeProps) {
  const openMobileDrawer = useNavUiStore((s) => s.openMobileDrawer);
  const openCommandPalette = useNavUiStore((s) => s.openCommandPalette);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-[52px] items-center justify-between gap-3 border-b border-emerald-950/80 bg-[var(--aurora-max-obsidian)]/95 px-4 backdrop-blur-md md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--aurora-max-emerald)]/15 text-[13px] text-[var(--aurora-max-emerald)]"
            aria-hidden="true"
          >
            ⚡
          </span>
          <span className="truncate font-display text-[15px] font-bold tracking-tight text-white">VouchEdge</span>
        </div>

        <p className="shrink-0 font-mono text-[11px] text-white/45">{compactDate(reportDateLabel)}</p>

        <div className="flex shrink-0 items-center gap-1.5">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-black text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" aria-hidden="true" />
              {liveCount}
            </span>
          )}
          <button
            type="button"
            onClick={() => openCommandPalette?.()}
            aria-label="Search"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/55 active:bg-white/10"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={openMobileDrawer}
            aria-label="Account and navigation"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/55 active:bg-white/10"
          >
            <UserCircle className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        className="tn-scrollbar-none sticky top-[52px] z-30 flex gap-2 overflow-x-auto border-b border-emerald-950/50 bg-[var(--aurora-max-obsidian)]/90 px-4 py-2 backdrop-blur-sm md:hidden"
        role="tablist"
        aria-label="Slate filter"
      >
        {TODAY_MOBILE_FILTERS.map((def) => {
          const active = def.id === filter;
          return (
            <button
              key={def.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilterChange(def.id)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors active:scale-[0.97] ${
                active
                  ? 'border-[var(--aurora-max-emerald)]/45 bg-[var(--aurora-max-emerald)]/15 text-[var(--aurora-max-emerald)]'
                  : 'border-white/10 bg-white/[0.03] text-white/55'
              }`}
            >
              <span aria-hidden="true">{def.glyph}</span>
              {def.label}
              <span className={`font-mono text-[10px] tabular-nums ${active ? 'text-[var(--aurora-max-emerald)]/70' : 'text-white/30'}`}>
                ({counts[def.id]})
              </span>
              <span className="sr-only">. {def.description}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
