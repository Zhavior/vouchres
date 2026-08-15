import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  Check, 
  Plus, 
  Layers, 
  Wind, 
  Activity 
} from 'lucide-react';
import PlayerHeadshot from '../../parlays/PlayerHeadshot';

export type PropCategory = 'HR' | 'RUNS' | 'HITS' | 'RBI' | 'BASES' | 'SB';

export interface PropMarket {
  id: string;
  label: string;
  subLabel: string;
  consensusOdds: string; // e.g. "+240"
  bestBook: string; // e.g. "FD"
  modelProb?: string; // e.g. "34.8%"
  evEdge: string; // e.g. "+18.4%"
  isBestValue?: boolean;
}

export interface PlayerPropDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: {
    id?: string | number;
    name: string;
    team: string;
    headshotUrl?: string;
    position?: string;
    handedness?: string;
    pitcherMatchup?: string;
    venue?: string;
    hrpiScore?: number;
    evScore?: string;
    exitVelocity?: string;
    launchAngle?: string;
    windVector?: string;
  };
  onAddToSlip: (market: PropMarket) => void;
}

const CATEGORIES: Array<{ id: PropCategory; label: string; icon: string }> = [
  { id: 'HR', label: 'Home Runs', icon: '⚾' },
  { id: 'RUNS', label: 'Runs', icon: '🏃' },
  { id: 'HITS', label: 'Hits', icon: '🎯' },
  { id: 'RBI', label: 'RBIs', icon: '📊' },
  { id: 'BASES', label: 'Total Bases', icon: '💥' },
  { id: 'SB', label: 'Stolen Bases', icon: '⚡' },
];

const CATEGORY_MARKETS: Record<PropCategory, PropMarket[]> = {
  HR: [
    {
      id: 'hr-anytime',
      label: 'Anytime Home Run',
      subLabel: 'Model: 34.8% (Fair +187)',
      consensusOdds: '+240',
      bestBook: 'FD',
      evEdge: '+18.4%',
      isBestValue: true,
    },
    {
      id: 'hr-2plus',
      label: '2+ Home Runs',
      subLabel: 'Model: 10.1% (Fair +890)',
      consensusOdds: '+950',
      bestBook: 'MGM',
      evEdge: '+6.2%',
    },
    {
      id: 'hr-run-combo',
      label: 'HR + Run Scored Combo',
      subLabel: 'Correlated SGP · 2 Legs',
      consensusOdds: '+290',
      bestBook: 'DK',
      evEdge: '+11.0%',
    },
  ],
  RUNS: [
    {
      id: 'runs-o05',
      label: 'Over 0.5 Runs Scored',
      subLabel: 'Model: 58.2% (Fair -139)',
      consensusOdds: '-115',
      bestBook: 'FD',
      evEdge: '+9.3%',
      isBestValue: true,
    },
    {
      id: 'runs-o15',
      label: 'Over 1.5 Runs Scored',
      subLabel: 'Model: 24.5% (Fair +308)',
      consensusOdds: '+360',
      bestBook: 'DK',
      evEdge: '+12.7%',
    },
  ],
  HITS: [
    {
      id: 'hits-o05',
      label: 'Over 0.5 Hits',
      subLabel: 'Model: 72.4% (Fair -262)',
      consensusOdds: '-210',
      bestBook: 'DK',
      evEdge: '+7.8%',
      isBestValue: true,
    },
    {
      id: 'hits-o15',
      label: 'Over 1.5 Hits',
      subLabel: 'Model: 32.1% (Fair +211)',
      consensusOdds: '+245',
      bestBook: 'FD',
      evEdge: '+10.9%',
    },
  ],
  RBI: [
    {
      id: 'rbi-o05',
      label: 'Over 0.5 RBIs',
      subLabel: 'Model: 44.0% (Fair +127)',
      consensusOdds: '+150',
      bestBook: 'MGM',
      evEdge: '+10.1%',
      isBestValue: true,
    },
    {
      id: 'rbi-o15',
      label: 'Over 1.5 RBIs',
      subLabel: 'Model: 18.2% (Fair +449)',
      consensusOdds: '+520',
      bestBook: 'FD',
      evEdge: '+13.0%',
    },
  ],
  BASES: [
    {
      id: 'bases-o15',
      label: 'Over 1.5 Total Bases',
      subLabel: 'Model: 51.5% (Fair -106)',
      consensusOdds: '+110',
      bestBook: 'FD',
      evEdge: '+8.2%',
      isBestValue: true,
    },
    {
      id: 'bases-o25',
      label: 'Over 2.5 Total Bases',
      subLabel: 'Model: 28.3% (Fair +253)',
      consensusOdds: '+295',
      bestBook: 'DK',
      evEdge: '+11.8%',
    },
  ],
  SB: [
    {
      id: 'sb-o05',
      label: 'Over 0.5 Stolen Bases',
      subLabel: 'Model: 19.5% (Fair +412)',
      consensusOdds: '+480',
      bestBook: 'FD',
      evEdge: '+13.2%',
      isBestValue: true,
    },
  ],
};

const ALT_LINES: Record<PropCategory, Array<{ line: string; odds: string; target: string }>> = {
  HR: [
    { line: 'O 0.5 HR', odds: '+240', target: '0.5' },
    { line: 'O 1.5 HR', odds: '+950', target: '1.5' },
    { line: 'O 2.5 HR', odds: '+3500', target: '2.5' },
  ],
  RUNS: [
    { line: 'O 0.5 Runs', odds: '-115', target: '0.5' },
    { line: 'O 1.5 Runs', odds: '+360', target: '1.5' },
    { line: 'O 2.5 Runs', odds: '+1200', target: '2.5' },
  ],
  HITS: [
    { line: 'O 0.5 Hits', odds: '-210', target: '0.5' },
    { line: 'O 1.5 Hits', odds: '+245', target: '1.5' },
    { line: 'O 2.5 Hits', odds: '+750', target: '2.5' },
  ],
  RBI: [
    { line: 'O 0.5 RBIs', odds: '+150', target: '0.5' },
    { line: 'O 1.5 RBIs', odds: '+520', target: '1.5' },
    { line: 'O 2.5 RBIs', odds: '+1600', target: '2.5' },
  ],
  BASES: [
    { line: 'O 1.5 TB', odds: '+110', target: '1.5' },
    { line: 'O 2.5 TB', odds: '+295', target: '2.5' },
    { line: 'O 3.5 TB', odds: '+650', target: '3.5' },
  ],
  SB: [
    { line: 'O 0.5 SB', odds: '+480', target: '0.5' },
    { line: 'O 1.5 SB', odds: '+2200', target: '1.5' },
    { line: 'O 2.5 SB', odds: '+8000', target: '2.5' },
  ],
};

export function PlayerPropDrawer({
  isOpen,
  onOpenChange,
  player,
  onAddToSlip,
}: PlayerPropDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<PropCategory>('HR');
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>('hr-anytime');
  const [addedMarketIds, setAddedMarketIds] = useState<Set<string>>(new Set());
  const [selectedAltLine, setSelectedAltLine] = useState<string>('0.5');
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const markets = CATEGORY_MARKETS[activeCategory];
      if (markets && markets[0]) {
        setSelectedMarketId(markets[0].id);
      }
    }
  }, [isOpen, activeCategory]);

  if (!isOpen) return null;

  const currentMarkets = CATEGORY_MARKETS[activeCategory] || CATEGORY_MARKETS.HR;
  const currentAltLines = ALT_LINES[activeCategory] || ALT_LINES.HR;

  const handleToggleAdd = (market: PropMarket) => {
    onAddToSlip(market);
    setAddedMarketIds((prev) => {
      const next = new Set(prev);
      if (next.has(market.id)) next.delete(market.id);
      else next.add(market.id);
      return next;
    });
  };

  const handleAltLineClick = (alt: { line: string; odds: string; target: string }) => {
    setSelectedAltLine(alt.target);
    const customMarket: PropMarket = {
      id: `alt-${activeCategory}-${alt.target}`,
      label: `${player.name} ${alt.line}`,
      subLabel: `Alt-line Over/Under · Model Fair`,
      consensusOdds: alt.odds,
      bestBook: 'Consensus',
      modelProb: 'Model Priced',
      evEdge: '+EV',
    };
    handleToggleAdd(customMarket);
  };

  const primarySelectedMarket = currentMarkets.find((m) => m.id === selectedMarketId) || currentMarkets[0];

  return (
    <div className="fixed inset-0 z-[130] flex justify-center items-end sm:items-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#07090C]/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div 
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${player.name} Prop Intelligence Tray`}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border-t sm:border border-emerald-500/30 bg-[#0D1117] p-4 sm:p-5 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.8)] outline-none animate-in slide-in-from-bottom duration-300"
      >
        {/* Top Mobile Grab Handle */}
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20 sm:hidden" />

        {/* 1. HEADER: Player & Model Edge */}
        <div className="flex items-start justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-emerald-500/30 bg-[#07090C] shadow-inner">
              <PlayerHeadshot
                name={player.name}
                playerId={player.id ? String(player.id) : undefined}
                size={48}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-white">
                  {player.name}
                </h3>
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                  {player.team} {player.position ? `· ${player.position}` : ''} {player.handedness ? `· ${player.handedness}` : ''}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-white/50">
                vs {player.pitcherMatchup || 'Scheduled Starter'} · {player.venue || 'Stadium'}
              </p>
            </div>
          </div>

          {/* HRPI Gauge */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="font-mono text-[8px] uppercase tracking-widest text-emerald-400/80">HRPI CORE</span>
              <span className="font-mono text-2xl font-black text-emerald-400 [text-shadow:0_0_12px_rgba(16,185,129,0.4)]">
                {player.hrpiScore ?? 98}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-sm p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. TELEMETRY STRIP (Exit Velo / Launch / Weather) */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded border border-white/[0.04] bg-[#07090C] p-2 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 text-white/70">
            <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Launch: <strong className="text-white">{player.exitVelocity || '116 mph'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-white/70">
            <Activity className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">EV Edge: <strong className="text-emerald-400">{player.evScore || '+18.4%'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-white/70">
            <Wind className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
            <span className="truncate">{player.windVector || 'Wind 8mph Out'}</span>
          </div>
        </div>

        {/* 3. CATEGORY SELECTOR TABS */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-shrink-0 items-center gap-1 rounded-sm border px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wider transition-all ${
                activeCategory === cat.id
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'border-white/10 bg-[#07090C] text-white/50 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 4. PROP MARKET CARDS */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white/40">
            <span>Market Selection</span>
            <span>Best Odds & EV</span>
          </div>

          {currentMarkets.map((market) => {
            const isAdded = addedMarketIds.has(market.id);
            const isSelected = selectedMarketId === market.id;

            return (
              <div
                key={market.id}
                onClick={() => setSelectedMarketId(market.id)}
                className={`relative flex cursor-pointer items-center justify-between rounded-sm border p-3 transition-all ${
                  isSelected
                    ? 'border-emerald-500/60 bg-[#0B0F14]'
                    : 'border-white/[0.06] bg-[#07090C]/60 hover:border-white/20'
                }`}
              >
                {market.isBestValue && (
                  <div className="absolute -top-2 left-3 rounded bg-emerald-500 px-1.5 py-0.2 font-mono text-[8px] font-black uppercase tracking-widest text-black shadow">
                    ★ High EV Pick
                  </div>
                )}

                {/* Left Market Info */}
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-white">
                    {market.label}
                  </span>
                  <p className="font-mono text-[10px] text-white/40">
                    {market.subLabel}
                  </p>
                </div>

                {/* Right: Odds + EV + Action */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-black text-emerald-400">
                        {market.consensusOdds}
                      </span>
                      <span className="font-mono text-[9px] text-white/40">
                        ({market.bestBook})
                      </span>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-cyan-400">
                      {market.evEdge} EV
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAdd(market);
                    }}
                    aria-label={`${isAdded ? 'Remove' : 'Add'} ${market.label}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-all ${
                      isAdded
                        ? 'border-emerald-500 bg-emerald-500 text-black font-bold'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                    }`}
                  >
                    {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. ALT-LINE OVER/UNDER SELECTOR (Replaces Custom Line) */}
        <div className="mt-4 rounded border border-white/[0.06] bg-[#07090C] p-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            Alternate Line Matrix (Over / Under)
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {currentAltLines.map((alt, idx) => {
              const isSelected = selectedAltLine === alt.target;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAltLineClick(alt)}
                  className={`flex flex-col items-center justify-center rounded-sm border p-2 font-mono transition-all ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-[#0B0F14] text-white/50 hover:text-white hover:border-white/25'
                  }`}
                >
                  <span className="text-[11px] font-bold">{alt.line}</span>
                  <span className="text-[10px] text-emerald-400/80">{alt.odds}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. PRIMARY SLIP CTA */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              if (primarySelectedMarket) {
                handleToggleAdd(primarySelectedMarket);
              }
            }}
            className="group relative w-full overflow-hidden rounded-sm border border-emerald-500/40 bg-emerald-500/20 py-3 transition-all hover:bg-emerald-500/30 active:scale-[0.99]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.15),transparent)] -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative font-mono text-xs font-black uppercase tracking-[0.15em] text-emerald-300">
              ⚡ Add Top Edge ({primarySelectedMarket.consensusOdds} {primarySelectedMarket.label}) To My List
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
export default PlayerPropDrawer;
