import { useEffect, useMemo, useState } from 'react';
import type { HrBuckets } from '../../hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../types/hrWatch';
import { HrPlayerCard, type HrCardResult } from '../Cards/HrPlayerCard';

interface HrBoardProps {
  buckets: HrBuckets;
  onSelectPlayer: (player: HrWatchRow) => void;
  onViewProfile: (player: HrWatchRow) => void;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

type TierKey = keyof HrBuckets;

const TIERS: Array<{ key: TierKey; title: string; index: string; description: string; tone: string }> = [
  { key: 'Elite', title: 'Elite Lens', index: '01', description: 'Highest-resolution signal stacks on the slate.', tone: 'text-[#00ff94]' },
  { key: 'Strong', title: 'Strong Targets', index: '02', description: 'Balanced candidates with multiple supporting factors.', tone: 'text-cyan-200' },
  { key: 'Watch', title: 'Watch List', index: '03', description: 'Useful signals that still need context or confirmation.', tone: 'text-slate-200' },
  { key: 'Sleepers', title: 'Deep Research', index: '04', description: 'Lower-ranked candidates for deliberate investigation.', tone: 'text-amber-200' },
];

export function HrBoard({ buckets, onSelectPlayer, onViewProfile, getHrResult }: HrBoardProps) {
  const firstPopulated = useMemo(() => TIERS.find((tier) => buckets[tier.key].length > 0)?.key ?? 'Elite', [buckets]);
  const [activeTier, setActiveTier] = useState<TierKey>(firstPopulated);

  useEffect(() => {
    if (buckets[activeTier].length === 0) setActiveTier(firstPopulated);
  }, [activeTier, buckets, firstPopulated]);

  const active = TIERS.find((tier) => tier.key === activeTier) ?? TIERS[0];
  const players = buckets[activeTier];

  return (
    <section className="z8-hr-board space-y-4">
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Home run signal tiers">
        {TIERS.map((tier) => {
          const selected = tier.key === activeTier;
          return (
            <button
              key={tier.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTier(tier.key)}
              className={`min-h-14 min-w-[9.5rem] flex-1 snap-start border px-3 py-2.5 text-left transition ${selected ? 'border-[#00ff94]/35 bg-[#00ff94]/[0.08] shadow-[inset_0_-2px_#00ff94]' : 'border-white/8 bg-black/25 hover:border-white/15'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`font-mono text-[9px] font-black uppercase tracking-[0.18em] ${selected ? tier.tone : 'text-white/35'}`}>{tier.index} {tier.title}</span>
                <span className="font-mono text-xs font-black tabular-nums text-white/70">{buckets[tier.key].length}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`font-mono text-[10px] font-black uppercase tracking-[0.2em] ${active.tone}`}>{active.index} / Signal group</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{active.title}</h2>
          <p className="mt-1 text-xs leading-5 text-white/40">{active.description}</p>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">{players.length} candidates · ranked by model score</p>
      </div>

      <div className="z8-hr-card-grid" role="tabpanel" aria-label={active.title}>
        {players.map((player) => (
          <HrPlayerCard
            key={player.stableId}
            player={player}
            onClick={() => onSelectPlayer(player)}
            onViewProfile={onViewProfile}
            hrResult={getHrResult?.(player.playerId) ?? null}
          />
        ))}
      </div>
    </section>
  );
}
