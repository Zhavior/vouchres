import React from 'react';
import { PlayerTDCard } from './PlayerTDCard';
import type { TouchdownPlayer, PlayerTier } from '../../../types/touchdown';
import { Zap, Flame, Sparkles, Target, Moon } from 'lucide-react';

interface TierBoardProps {
  tierPartition: Record<PlayerTier, TouchdownPlayer[]>;
  onOpenDossier: (player: TouchdownPlayer) => void;
  onAddToSlip: (player: TouchdownPlayer) => void;
}

interface TierColumnDef {
  tier: PlayerTier;
  title: string;
  subTitle: string;
  threshold: string;
  icon: React.ComponentType<{ className?: string }>;
  headerBorder: string;
  headerBg: string;
  headerDot: string;
  badgeBg: string;
  textColor: string;
}

const TIER_COLUMNS: TierColumnDef[] = [
  {
    tier: 'ELITE',
    title: 'TIER 1: ELITE TD',
    subTitle: 'Heavy Goal-Line Volume (>35% RZ)',
    threshold: 'TDPI ≥ 80',
    icon: Flame,
    headerBorder: 'border-[#10B981]/25',
    headerBg: 'bg-[#060a0a]',
    headerDot: 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    badgeBg: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/35',
    textColor: 'text-[#10B981]',
  },
  {
    tier: 'STRONG',
    title: 'TIER 2: STRONG TD',
    subTitle: 'High Red-Zone Game Leverage',
    threshold: 'TDPI 65 - 79',
    icon: Zap,
    headerBorder: 'border-[#6EE7B7]/25',
    headerBg: 'bg-[#060a0a]',
    headerDot: 'bg-[#6EE7B7] shadow-[0_0_8px_rgba(110,231,183,0.8)]',
    badgeBg: 'bg-[#6EE7B7]/15 text-[#6EE7B7] border border-[#6EE7B7]/35',
    textColor: 'text-[#6EE7B7]',
  },
  {
    tier: 'VALUE',
    title: 'TIER 3: VALUE EDGE',
    subTitle: 'Model vs Market Odds Divergence',
    threshold: 'TDPI 50 - 64',
    icon: Sparkles,
    headerBorder: 'border-[#F59E0B]/25',
    headerBg: 'bg-[#060a0a]',
    headerDot: 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    badgeBg: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/35',
    textColor: 'text-[#F59E0B]',
  },
  {
    tier: 'SLEEPER',
    title: 'TIER 4: SLEEPER / DART',
    subTitle: 'Goal-Line Vultures & Weak Secondaries',
    threshold: 'TDPI < 50',
    icon: Moon,
    headerBorder: 'border-[#A855F7]/25',
    headerBg: 'bg-[#060a0a]',
    headerDot: 'bg-[#A855F7] shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    badgeBg: 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/35',
    textColor: 'text-[#A855F7]',
  },
];

export const TierBoard: React.FC<TierBoardProps> = ({
  tierPartition,
  onOpenDossier,
  onAddToSlip,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-4 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
      {/* 4-Column Board with Minimum Width Constraint (min-w-[1140px]) to Guarantee ≥260px per Card */}
      <div className="grid grid-cols-4 gap-4 items-start w-full min-w-[1140px] font-mono">
        {TIER_COLUMNS.map((col) => {
          const players = tierPartition[col.tier];
          const Icon = col.icon;

          return (
            <section
              key={col.tier}
              className="flex flex-col min-w-[260px]"
              style={{ contain: 'layout style' }}
            >
              {/* Column Header styled like HR Next */}
              <header
                className={`mb-3 flex items-center justify-between gap-2 rounded-lg border ${col.headerBorder} ${col.headerBg} px-3 py-2`}
              >
                <h2
                  className={`flex min-w-0 items-center gap-2 font-mono font-black uppercase ${col.textColor} text-[11px] tracking-[0.18em]`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${col.headerDot}`} />
                  <span className="truncate">{col.title}</span>
                </h2>
                <span className="shrink-0 font-mono text-[9px] font-bold tabular-nums text-white/40">
                  {players.length} · {col.threshold}
                </span>
              </header>

              {/* Players Stack */}
              <div className="flex flex-col gap-3">
                {players.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-6 text-center text-zinc-500 text-xs">
                    <Target className="h-6 w-6 mb-1 text-zinc-600" />
                    <p className="font-bold">No players match</p>
                    <p className="text-[10px] mt-0.5 text-zinc-600">Adjust tactical radar filters</p>
                  </div>
                ) : (
                  players.map((player) => (
                    <PlayerTDCard
                      key={player.id}
                      player={player}
                      onOpenDossier={onOpenDossier}
                      onAddToSlip={onAddToSlip}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
