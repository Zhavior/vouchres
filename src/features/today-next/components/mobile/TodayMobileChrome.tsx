import React from 'react';
import { RefreshCw, Search, ShieldCheck, UserCircle, Zap } from 'lucide-react';
import { useNavUiStore } from '../../../../stores/navUiStore';
import { TODAY_MOBILE_FILTERS, type TodayMobileFilter } from './todayMobileFilters';
import { formatCountdown, type TodayNextFirstPitch } from '../../hooks/useTodayNextHome';

interface TodayMobileChromeProps {
  reportDateLabel: string;
  liveCount: number;
  gameCount: number | null;
  firstPitch: TodayNextFirstPitch | null;
  filter: TodayMobileFilter;
  onFilterChange: (filter: TodayMobileFilter) => void;
  counts: Record<TodayMobileFilter, number>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function compactDate(label: string): string {
  return label.replace(
    /^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day/,
    (_match, stem: string) =>
      ({ Mon: 'Mon', Tues: 'Tue', Wednes: 'Wed', Thurs: 'Thu', Fri: 'Fri', Satur: 'Sat', Sun: 'Sun' })[stem] ?? stem,
  );
}

export function TodayMobileChrome({
  reportDateLabel,
  liveCount,
  gameCount,
  firstPitch,
  filter,
  onFilterChange,
  counts,
  onRefresh,
  isRefreshing = false,
}: TodayMobileChromeProps) {
  const openMobileDrawer = useNavUiStore((s) => s.openMobileDrawer);
  const openCommandPalette = useNavUiStore((s) => s.openCommandPalette);

  return (
    <>
      {/* Telemetry Top Bar (Sticky on Mobile) */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-[52px] items-center justify-between gap-2 border-b border-white/[0.08] bg-[#050505]/95 px-3 backdrop-blur-xl font-mono md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className="block truncate font-bold text-xs text-[#F4F4F5] uppercase tracking-wider">
              VOUCHEDGE // TODAY
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-400">
              <span className="text-emerald-400 font-medium">{gameCount ?? '—'} SLATE</span>
              <span>·</span>
              {firstPitch?.countdownMs != null ? (
                <span className="text-emerald-400 font-medium tabular-nums font-mono">
                  LOCK: {formatCountdown(firstPitch.countdownMs)}
                </span>
              ) : (
                <span>{compactDate(reportDateLabel)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-rose-400 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
              {liveCount} LIVE
            </span>
          )}

          {/* Sensors Verified pill */}
          <span className="hidden xs:inline-flex items-center gap-1 border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-mono font-medium text-emerald-400 rounded">
            <ShieldCheck className="h-2.5 w-2.5" /> VERIFIED
          </span>

          {/* Quick Sync [R] */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Quick Sync"
              className="grid h-8 w-8 place-items-center rounded-md border border-white/[0.08] bg-[#111113] text-zinc-300 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => openCommandPalette?.()}
            aria-label="Search"
            className="grid h-8 w-8 place-items-center rounded-md border border-white/[0.08] bg-[#111113] text-zinc-300 active:bg-white/10 min-h-[44px] min-w-[44px]"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={openMobileDrawer}
            aria-label="Account and navigation"
            className="grid h-8 w-8 place-items-center border border-white/20 bg-[#131B1E] text-zinc-300 active:bg-white/10 min-h-[44px] min-w-[44px]"
          >
            <UserCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Sticky Filter Rail */}
      <div
        className="tn-scrollbar-none sticky top-[52px] z-30 flex gap-2 overflow-x-auto border-b border-white/15 bg-[#0A0D0E]/95 px-3 py-2 backdrop-blur-sm md:hidden font-mono"
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
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border px-3 py-2 text-[11px] font-bold uppercase transition-colors min-h-[44px] ${
                active
                  ? 'border-[#00FF87] bg-emerald-950/60 text-[#00FF87] shadow-[2px_2px_0px_0px_#00FF87]'
                  : 'border-white/15 bg-[#131B1E] text-zinc-400'
              }`}
            >
              <span aria-hidden="true">{def.glyph}</span>
              {def.label}
              <span className={`font-mono text-[9px] tabular-nums ${active ? 'text-[#00FF87]' : 'text-zinc-500'}`}>
                ({counts[def.id]})
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
