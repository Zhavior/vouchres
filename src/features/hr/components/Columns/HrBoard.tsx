import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Flame, Plus, Search, ShieldCheck, ShieldQuestion, Zap } from 'lucide-react';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import type { HrBuckets } from '../../hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../types/hrWatch';
import { buildHrDecisionBrief } from '../../utils/hrDecisionBrief';
import { HrPlayerCard, type HrCardResult } from '../Cards/HrPlayerCard';

interface HrBoardProps {
  buckets: HrBuckets;
  onSelectPlayer: (player: HrWatchRow) => void;
  onViewProfile: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

type TierKey = keyof HrBuckets;

type TierDefinition = {
  key: TierKey;
  title: string;
  shortTitle: string;
  index: string;
  description: string;
  tone: string;
  border: string;
  surface: string;
  icon: typeof Flame;
};

const TIERS: TierDefinition[] = [
  { key: 'Elite', title: 'Elite Lens', shortTitle: 'Elite', index: '01', description: 'Highest-resolution signal stacks on the slate.', tone: 'text-[#00f0ff]', border: 'border-[#00f0ff]/30', surface: 'from-[#00f0ff]/[0.08]', icon: Zap },
  { key: 'Strong', title: 'Strong Targets', shortTitle: 'Strong', index: '02', description: 'Balanced candidates with multiple supporting factors.', tone: 'text-[#00ff94]', border: 'border-[#00ff94]/25', surface: 'from-[#00ff94]/[0.07]', icon: ShieldCheck },
  { key: 'Watch', title: 'Watch List', shortTitle: 'Watch', index: '03', description: 'Useful signals that still need context or confirmation.', tone: 'text-amber-200', border: 'border-amber-300/25', surface: 'from-amber-300/[0.07]', icon: Zap },
  { key: 'Sleepers', title: 'Deep Research', shortTitle: 'Sleeper', index: '04', description: 'Lower-ranked candidates for deliberate investigation.', tone: 'text-orange-300', border: 'border-orange-300/20', surface: 'from-orange-300/[0.06]', icon: Flame },
];

function metric(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '-' : String(Math.round(value));
}

function CompactPlayerCard({ player, tier, onResearch, onAddToSlip, result }: {
  player: HrWatchRow;
  tier: TierDefinition;
  onResearch: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
  result: HrCardResult;
}) {
  const brief = buildHrDecisionBrief(player, 'fresh', null, Boolean(onAddToSlip));
  const canAdd = brief.canAddToSlip;

  return (
    <article className={`z8-hr-compact-card relative overflow-hidden border ${tier.border} bg-gradient-to-br ${tier.surface} to-black/20`}>
      <div className="relative flex min-h-[92px] items-end gap-2.5 border-b border-white/[0.08] px-2.5 pt-2.5">
        <div className="absolute left-0 top-0 border-b border-r border-white/10 bg-black/45 px-1.5 py-1 font-mono text-sm font-black tabular-nums text-white">
          {Math.round(player.hrScore)}
        </div>
        <div className="z8-hr-compact-card__headshot flex h-[76px] w-[76px] shrink-0 items-end justify-center overflow-hidden">
          <PlayerHeadshot name={player.playerName} playerId={player.playerId} headshotUrl={player.headshotUrl} size={72} />
        </div>
        <div className="min-w-0 flex-1 pb-2.5">
          <p className="text-[14px] font-black leading-tight tracking-[-0.02em] text-white">{player.playerName}</p>
          <p className="mt-1 text-[10px] font-semibold text-white/55">{player.team} vs {player.opponent}</p>
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.05em] text-white/55">
            {player.truthStatus === 'official' ? <ShieldCheck className="h-2.5 w-2.5 text-[#00ff94]" /> : <ShieldQuestion className="h-2.5 w-2.5 text-amber-200" />}
            {player.truthStatus === 'official' ? 'Confirmed' : player.truthStatus === 'projected' ? 'Projected' : 'Unverified'}
          </div>
        </div>
        {result === 'hit' ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 border border-orange-300/45 bg-orange-400/15 px-1.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.08em] text-orange-200 shadow-[0_0_18px_rgba(251,146,60,.24)]">
            <Flame className="h-3 w-3" /> HR
          </span>
        ) : result === 'no-hr' ? (
          <span className="absolute right-2 top-2 border border-white/10 bg-black/35 px-1.5 py-1 font-mono text-[8px] font-bold uppercase text-white/35">No HR</span>
        ) : null}
      </div>

      <div className="grid grid-cols-3 border-b border-white/[0.08] bg-black/20 py-2">
        {[
          ['Power', player.hitterPower],
          ['Pitcher', player.pitcherVulnerability],
          ['Park', player.parkFactor],
        ].map(([label, value], index) => (
          <div key={String(label)} className={`text-center ${index > 0 ? 'border-l border-white/[0.08]' : ''}`}>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-white/40">{label}</p>
            <p className="mt-0.5 font-mono text-[13px] font-black tabular-nums text-white/90">{metric(value as number | null)}</p>
          </div>
        ))}
      </div>

      <div className="min-h-[88px] space-y-2 px-2.5 py-2.5">
        <div>
          <p className="font-mono text-[8px] font-black uppercase tracking-[0.1em] text-[#75ffc5]">Top factor</p>
          <p className="mt-1 text-[10px] font-semibold leading-4 text-white/70">{brief.reason}</p>
        </div>
        <div>
          <p className="font-mono text-[8px] font-black uppercase tracking-[0.1em] text-red-300/80">Main risk</p>
          <p className="mt-1 text-[10px] leading-4 text-white/52">{brief.risk}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 border-t border-white/[0.07] p-2">
        <button
          type="button"
          onClick={() => onResearch(player)}
          aria-label={`Research ${player.playerName}`}
          className="flex min-h-9 items-center justify-center gap-1.5 border border-[#00f0ff]/30 bg-[#00f0ff]/[0.055] px-2 text-[10px] font-black text-white/80 transition hover:border-[#00f0ff]/60 hover:text-[#00f0ff]"
        >
          <Search className="h-3 w-3" /> Research
        </button>
        <button
          type="button"
          onClick={() => onAddToSlip?.(player)}
          disabled={!canAdd}
          title={brief.addToSlipBlockReason ?? 'Add player to slip'}
          aria-label={`Add ${player.playerName} to slip`}
          className="flex min-h-9 items-center justify-center gap-1 border border-[#00ff94]/30 bg-[#00ff94]/[0.055] px-2 text-[10px] font-black text-[#75ffc5] transition hover:border-[#00ff94]/60 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus className="h-3.5 w-3.5" /> Slip
        </button>
      </div>
    </article>
  );
}

function DesktopTierColumn({ tier, players, onResearch, onAddToSlip, getHrResult }: {
  tier: TierDefinition;
  players: HrWatchRow[];
  onResearch: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}) {
  const [expanded, setExpanded] = useState(false);
  const visiblePlayers = expanded ? players : players.slice(0, 2);
  const Icon = tier.icon;

  return (
    <section className="z8-hr-tier-section min-w-0 overflow-hidden" aria-label={`${tier.shortTitle} signals`}>
      <header className={`flex items-center justify-between gap-2 border-b ${tier.border} bg-black/25 px-2.5 py-2.5`}>
        <div className={`flex items-center gap-1.5 ${tier.tone}`}>
          <Icon className="h-3.5 w-3.5" />
          <h3 className="font-mono text-[11px] font-black uppercase tracking-[0.1em]">{tier.shortTitle}</h3>
        </div>
        <span className="font-mono text-[9px] font-bold tabular-nums text-white/48">{players.length} player{players.length === 1 ? '' : 's'}</span>
      </header>

      <div className="space-y-2 p-1.5">
        {visiblePlayers.length > 0 ? visiblePlayers.map((player) => (
          <CompactPlayerCard
            key={player.stableId}
            player={player}
            tier={tier}
            onResearch={onResearch}
            onAddToSlip={onAddToSlip}
            result={getHrResult?.(player.playerId) ?? null}
          />
        )) : (
          <div className="flex min-h-36 items-center justify-center p-4 text-center">
            <div>
              <Check className="mx-auto h-4 w-4 text-white/18" />
              <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">No players in this tier</p>
            </div>
          </div>
        )}
      </div>

      {players.length > 2 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-white/[0.08] bg-black/20 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-white/45 transition hover:bg-white/[0.025] hover:text-white/75"
        >
          {expanded ? 'Show top 2' : `Show all ${players.length}`}
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      ) : null}
    </section>
  );
}

export function HrBoard({ buckets, onSelectPlayer, onViewProfile, onAddToSlip, getHrResult }: HrBoardProps) {
  const firstPopulated = useMemo(() => TIERS.find((tier) => buckets[tier.key].length > 0)?.key ?? 'Elite', [buckets]);
  const [activeTier, setActiveTier] = useState<TierKey>(firstPopulated);

  useEffect(() => {
    if (buckets[activeTier].length === 0) setActiveTier(firstPopulated);
  }, [activeTier, buckets, firstPopulated]);

  const active = TIERS.find((tier) => tier.key === activeTier) ?? TIERS[0];
  const players = buckets[activeTier];
  return (
    <section className="z8-hr-board space-y-3">
      <div className="hidden grid-cols-4 gap-2 xl:grid">
        {TIERS.map((tier) => (
          <DesktopTierColumn
            key={tier.key}
            tier={tier}
            players={buckets[tier.key]}
            onResearch={onViewProfile}
            onAddToSlip={onAddToSlip}
            getHrResult={getHrResult}
          />
        ))}
      </div>

      <div className="space-y-4 xl:hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto border-b border-white/[0.08] bg-black/15 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Home run signal tiers">
          {TIERS.map((tier) => {
            const selected = tier.key === activeTier;
            return (
              <button
                key={tier.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTier(tier.key)}
                className={`min-h-11 min-w-[9rem] flex-1 snap-start border-b-2 px-3 py-2 text-left transition ${selected ? 'border-b-[hsl(var(--ve-success))] bg-[linear-gradient(to_top,hsl(var(--ve-success)/0.08),transparent)]' : 'border-b-transparent text-white/35 hover:bg-white/[0.025] hover:text-white/60'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-mono text-[9px] font-black uppercase tracking-[0.14em] ${selected ? tier.tone : 'text-white/35'}`}>{tier.index} {tier.title}</span>
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
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">{players.length} candidates / ranked by model score</p>
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
      </div>
    </section>
  );
}
