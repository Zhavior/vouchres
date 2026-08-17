import React from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crosshair,
  Radio,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import '../../../../styles/command-deck.css';
import '../../hr-command.css';
import { localISODate } from '../../utils/localDate';
import { HrProModeToggle } from './HrProModeToggle';

export type HrViewMode = 'cards' | 'table' | 'treemap';
export type HrFreshness = 'fresh' | 'delayed' | 'stale';

export interface HrHeaderProps {
  mode: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
  lastUpdatedLabel?: string;
  date?: string;
  isToday?: boolean;
  onDateChange?: (date: string) => void;
  gameCount?: number;
  hasGames?: boolean;
  freshness?: HrFreshness;
  confirmedCount?: number;
  previewCount?: number;
  isProMode?: boolean;
  onToggleProMode?: () => void;
  onProModeIntent?: () => void;
}

const FRESHNESS: Record<
  HrFreshness,
  { label: string; tone: 'emerald' | 'amber' | 'danger'; icon: React.ReactNode }
> = {
  fresh: { label: 'Fresh', tone: 'emerald', icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
  delayed: { label: 'Delayed', tone: 'amber', icon: <Clock3 className="h-2.5 w-2.5" /> },
  stale: { label: 'Stale', tone: 'danger', icon: <TriangleAlert className="h-2.5 w-2.5" /> },
};

const DatePicker: React.FC<{
  date: string;
  isToday: boolean;
  onChange: (date: string) => void;
}> = ({ date, isToday, onChange }) => (
  <label className="deck-control relative flex h-10 min-w-[120px] cursor-pointer items-center gap-2 rounded-xl px-3 sm:min-w-[150px]">
    <Calendar className="h-3.5 w-3.5 shrink-0 text-vouch-cyan" />
    <span className="flex-1 truncate font-mono text-[11px] font-bold sm:text-xs">
      {isToday ? 'Today' : date}
    </span>
    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
    <input
      type="date"
      value={date}
      max={localISODate()}
      onChange={(event) => event.target.value && onChange(event.target.value)}
      className="absolute inset-0 cursor-pointer opacity-0"
      aria-label="Pick a date"
    />
  </label>
);

function RailCell({
  label,
  value,
  tone = 'cyan',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'cyan' | 'emerald' | 'amber' | 'danger';
}) {
  return (
    <div className="deck-rail-cell" data-tone={tone}>
      <span className="deck-rail-label font-mono">{label}</span>
      <span className="deck-rail-value">{value}</span>
    </div>
  );
}

export const HrHeader: React.FC<HrHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  lastUpdatedLabel,
  date,
  isToday = true,
  onDateChange,
  gameCount = 0,
  hasGames = true,
  freshness = 'fresh',
  confirmedCount = 0,
  previewCount = 0,
  isProMode = false,
  onToggleProMode,
  onProModeIntent,
}) => {
  const noGames = !hasGames || gameCount === 0;
  const freshnessTone = FRESHNESS[freshness] ?? FRESHNESS.fresh;

  return (
    <header className="deck-hero rounded-2xl p-2.5 sm:p-5">
      <div className="flex min-w-0 flex-col gap-2.5 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="aurora-max-eyebrow deck-product-mark !text-[9.5px] font-bold sm:!text-xs">
            <Crosshair className="h-3.5 w-3.5 shrink-0 text-vouch-cyan" />
            <span className="min-w-0 truncate">
              Home Run Intelligence<span className="hidden sm:inline"> · MLB Signal Deck</span>
            </span>
          </div>
          <h1 className="mt-1.5 max-w-2xl text-[15px] font-black leading-tight tracking-tight text-white sm:mt-2 sm:text-3xl">
            Every bat that can leave the yard,{' '}
            <span className="text-vouch-emerald">ranked and receipted.</span>
          </h1>
          {/* The positioning line is orientation for a first-time visitor; on a
              phone it costs a third of the fold, so it starts at sm. */}
          <p className="mt-1.5 hidden max-w-2xl text-[11px] leading-relaxed text-white/60 sm:block sm:text-sm">
            Power, matchup vulnerability, park factors and official batting orders, scored on one slate and labelled
            confirmed or projected.
          </p>
        </div>

        {/* Phones get one no-wrap control row that scrolls rather than three
            stacked wrapped rows. */}
        <div className="deck-hero-controls -mx-2.5 flex shrink-0 items-center gap-2 overflow-x-auto px-2.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {onToggleProMode ? (
            <HrProModeToggle
              isProMode={isProMode}
              onToggle={onToggleProMode}
              onIntent={onProModeIntent}
              className="w-[190px] sm:w-[210px]"
            />
          ) : null}

          <div
            className="hr-live-pill inline-flex h-10 items-center gap-2 rounded-xl px-3 font-mono text-[10px] font-bold uppercase tracking-wider sm:text-xs"
            data-live={isToday}
          >
            <Radio className={`h-3.5 w-3.5 ${isToday && !isRefreshing ? 'animate-pulse' : ''}`} />
            <span>{isToday ? 'Live slate' : 'Historical'}</span>
          </div>

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh slate data"
              className="deck-control flex h-10 w-10 items-center justify-center rounded-xl text-vouch-cyan"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          ) : null}

          {date && onDateChange ? <DatePicker date={date} isToday={isToday} onChange={onDateChange} /> : null}
        </div>
      </div>

      <div className="deck-rail mt-2.5 rounded-xl sm:mt-4">
        <RailCell label="MLB slate" value={noGames ? 'No games' : `${gameCount} game${gameCount === 1 ? '' : 's'}`} />
        <RailCell
          label="Freshness"
          tone={freshnessTone.tone}
          value={
            <span className="inline-flex items-center gap-1">
              {freshnessTone.icon}
              {freshnessTone.label}
              {lastUpdatedLabel ? <span className="font-normal text-white/35">· {lastUpdatedLabel}</span> : null}
            </span>
          }
        />
        <RailCell label="Confirmed" tone="emerald" value={`${confirmedCount} official`} />
        <RailCell label="Preview" tone="amber" value={`${previewCount} projected`} />
      </div>
    </header>
  );
};

export default HrHeader;
