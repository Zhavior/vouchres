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
      <header className="fixed inset-x-0 top-0 z-40 flex h-[52px] items-center justify-between gap-2 border-b border-white/[0.08] bg-[#050505]/95 px-3 font-mono md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ve-emerald animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className="block truncate font-bold text-xs text-[#ffffff] uppercase tracking-wider">
              VOUCHEDGE // TODAY
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-white/55">
              <span className="text-ve-emerald font-medium">{gameCount ?? '—'} SLATE</span>
              <span>·</span>
              {firstPitch?.countdownMs != null ? (
                <span className="text-ve-emerald font-medium tabular-nums font-mono">
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
            <span className="flex items-center gap-1 border border-ve-red/25 bg-ve-red/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-ve-red rounded-none">
              <span className="h-1.5 w-1.5 rounded-full bg-ve-red animate-pulse" />
              {liveCount} LIVE
            </span>
          )}

          {/* Sensors Verified pill */}
          <span className="hidden xs:inline-flex items-center gap-1 border border-ve-emerald/25 bg-ve-emerald/10 px-1.5 py-0.5 text-[8px] font-mono font-medium text-ve-emerald rounded-none">
            <ShieldCheck className="h-2.5 w-2.5" /> VERIFIED
          </span>

          {/* Quick Sync [R] */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Quick Sync"
              className="grid h-8 w-8 place-items-center rounded-none border border-white/[0.08] bg-[#0A0A0A] text-white/70 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-ve-emerald ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => openCommandPalette?.()}
            aria-label="Search"
            className="grid h-8 w-8 place-items-center rounded-none border border-white/[0.08] bg-[#0A0A0A] text-white/70 active:bg-white/10 min-h-[44px] min-w-[44px]"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={openMobileDrawer}
            aria-label="Account and navigation"
            className="grid h-8 w-8 place-items-center border border-white/20 bg-[#0A0A0A] text-white/70 active:bg-white/10 min-h-[44px] min-w-[44px]"
          >
            <UserCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Sticky Filter Rail */}
      <div
        className="tn-scrollbar-none sticky top-[52px] z-30 flex gap-2 overflow-x-auto border-b border-white/15 bg-[#0A0A0A]/95 px-3 py-2 md:hidden font-mono"
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
              className={`flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap border px-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
                active
                  ? 'border-ve-cyan bg-ve-cyan/10 text-ve-cyan'
                  : 'border-white/10 bg-transparent text-white/45'
              }`}
            >
              {def.label}
              <span className={`font-mono text-[9px] tabular-nums ${active ? 'text-ve-cyan/70' : 'text-white/30'}`}>
                ({counts[def.id]})
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
