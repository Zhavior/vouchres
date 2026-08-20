import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Clock3, FileCheck2, ListFilter, Plus, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { boardScore, signalLayers } from '../../features/hr/engine/signalScore';
import { buildHrMatchupGroups, type HrMatchupGroup } from '../../features/hr/components/Table/hrTableModel';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import { getPlayerInitials } from '../../lib/mlbHeadshot';
import {
  AuroraMaxCommandHeader,
  AuroraMaxControl,
  AuroraMaxEvidenceLadder,
  AuroraMaxFallback,
  AuroraMaxRankedWorkspace,
  AuroraMaxReceiptAction,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
  type AuroraMaxTruthState,
} from '../aurora-max/AuroraMaxPrimitives';

export type TodayFieldState = 'loading' | 'live' | 'pregame' | 'postgame' | 'no-slate' | 'degraded';

interface Props {
  rows: readonly HrWatchRow[];
  confirmedRows: readonly HrWatchRow[];
  freshnessLabel: string;
  state: TodayFieldState;
  gameCount: number | null;
  liveGames: number;
  onAddPlayer: (player: HrWatchRow) => void;
  onResearch: () => void;
}

type SortMode = 'score' | 'time';

const STATE_LABEL: Record<TodayFieldState, string> = {
  loading: 'SYNCING SOURCES',
  live: 'LIVE SLATE ACTIVE',
  pregame: 'PREGAME BOARD VERIFIED',
  postgame: 'SLATE FINALIZED',
  'no-slate': 'NO ACTIVE MLB SLATE',
  degraded: 'VERIFY SOURCE SENSORS',
};

export default function TodayFieldDesk({
  rows,
  confirmedRows,
  freshnessLabel,
  state,
  gameCount,
  liveGames,
  onAddPlayer,
  onResearch,
}: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const queueSource = confirmedRows.length > 0 ? confirmedRows : rows;
  const groups = useMemo(() => sortGroups(buildHrMatchupGroups(queueSource), sortMode), [queueSource, sortMode]);
  const selected = useMemo(() => {
    const candidates = groups.flatMap((group) => group.rows);
    return candidates.find((row) => row.stableId === selectedId) ?? candidates[0] ?? null;
  }, [groups, selectedId]);

  const confirmedFallback = confirmedRows.length === 0 && rows.length > 0;

  return (
    <section className="border-2 border-white/15 bg-black overflow-hidden font-mono shadow-2xl" data-state={state} data-testid="today-field-desk">
      {/* COMMAND DESK HEADER */}
      <div className="border-b border-white/15 bg-zinc-950 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 bg-emerald-400 ${state === 'loading' ? 'animate-pulse' : ''}`} />
          <div>
            <h2 className="text-white font-black text-xs tracking-widest uppercase">
              VOUCHEDGE // RESEARCH COMMAND DESK
            </h2>
            <p className="text-[10px] text-zinc-400 uppercase mt-0.5">
              {STATE_LABEL[state]} · {freshnessLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase">
          <span className="border border-white/15 px-2 py-0.5 bg-black text-zinc-300">
            {gameCount ?? '—'} GAMES
          </span>
          <span className={`border px-2 py-0.5 ${liveGames > 0 ? 'border-rose-500/50 bg-rose-950/40 text-rose-300' : 'border-white/15 bg-black text-zinc-500'}`}>
            {liveGames} LIVE
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.94fr)_minmax(440px,1.06fr)] divide-y lg:divide-y-0 lg:divide-x divide-white/15">
        <Spotlight player={selected} state={state} onAddPlayer={onAddPlayer} onResearch={onResearch} />

        <div className="min-w-0 bg-black">
          {/* SLATE WORKSPACE HEADER */}
          <div className="px-5 py-3.5 border-b border-white/15 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2">
              <ListFilter className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
              <strong className="text-white font-bold text-xs uppercase tracking-wider">DAILY SLATE QUEUE</strong>
            </div>

            <label className="relative inline-flex items-center border border-white/20 bg-black px-2.5 py-1 text-[9px] font-bold text-zinc-300 uppercase cursor-pointer">
              <SlidersHorizontal className="mr-1.5 h-3 w-3 text-cyan-300" aria-hidden="true" />
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="appearance-none bg-transparent pr-4 outline-none uppercase cursor-pointer"
                aria-label="Sort slate queue"
              >
                <option value="score" className="bg-black text-white">HRPI SCORE</option>
                <option value="time" className="bg-black text-white">GAME TIME</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-zinc-400" aria-hidden="true" />
            </label>
          </div>

          <div className="px-5 py-2 border-b border-white/10 bg-zinc-950/60 text-[9px] font-bold uppercase tracking-wider flex items-center justify-between text-zinc-400">
            <span>{groups.length} MATCHUPS · {confirmedRows.length} CONFIRMED BATS</span>
            {confirmedFallback ? (
              <span className="text-amber-400 border border-amber-400/40 px-1.5 py-0.2 bg-amber-950/40">
                PROJECTED LINEUPS
              </span>
            ) : (
              <span className="text-emerald-400 border border-emerald-400/40 px-1.5 py-0.2 bg-emerald-950/40">
                CONFIRMED ONLY
              </span>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-white/10" role="list" aria-label="Today's slate matchups">
            {groups.length > 0 ? groups.map((group, index) => {
              const player = group.rows[0];
              const active = selected?.stableId === player.stableId;
              return (
                <MatchupRow
                  key={group.key}
                  group={group}
                  player={player}
                  rank={index + 1}
                  active={active}
                  onSelect={() => setSelectedId(player.stableId)}
                  receiptOpen={receiptId === player.stableId}
                  onToggleReceipt={() => setReceiptId((current) => current === player.stableId ? null : player.stableId)}
                />
              );
            }) : <QueueEmpty state={state} onResearch={onResearch} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function Spotlight({
  player,
  state,
  onAddPlayer,
  onResearch,
}: {
  player: HrWatchRow | null;
  state: TodayFieldState;
  onAddPlayer: (player: HrWatchRow) => void;
  onResearch: () => void;
}) {
  if (!player) {
    return (
      <div className="flex min-h-[380px] items-center justify-center p-6 text-center bg-black">
        <div className="space-y-3">
          <Clock3 className="mx-auto h-8 w-8 text-zinc-600" aria-hidden="true" />
          <h3 className="text-lg font-black tracking-tight text-white uppercase">{state === 'loading' ? 'BUILDING TODAY’S BOARD' : 'NO ACTIVE HR SIGNALS'}</h3>
          <p className="mx-auto max-w-sm text-xs text-zinc-500">The desk stays honest when the slate or lineup feed has no usable rows.</p>
          <button onClick={onResearch} className="mt-4 border border-cyan-400 bg-cyan-950/40 text-cyan-300 px-4 py-2 text-xs font-bold uppercase hover:bg-cyan-900/50 transition-colors cursor-pointer">OPEN RESEARCH BOARD</button>
        </div>
      </div>
    );
  }

  const layers = signalLayers(player);
  const score = boardScore(player);
  const validLayers = layers.filter((layer) => layer.value != null);

  return (
    <article className="relative min-h-[380px] p-5 sm:p-7 flex flex-col justify-between space-y-5 bg-black">
      {player.teamLogoUrl ? <img src={player.teamLogoUrl} alt="" className="pointer-events-none absolute -right-6 top-8 h-44 w-44 object-contain opacity-[0.035]" loading="lazy" decoding="async" /> : null}
      
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <span className="h-2 w-2 bg-emerald-400" />
            SPOTLIGHT DOSSIER
          </div>
          <span className="text-[9px] border border-white/15 px-2 py-0.5 text-zinc-400 uppercase">
            {player.truthStatus} VERIFIED
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              {player.team} VS {player.opponent}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 font-sans">
              {player.playerName}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {player.pitcherName && player.pitcherName !== 'Pitcher TBD' ? `VS ${player.pitcherName.toUpperCase()}` : 'OPPOSING PITCHER PENDING'}
              {player.venue ? ` · ${player.venue.toUpperCase()}` : ''}
            </p>
          </div>

          <div className="border-2 border-emerald-400/60 bg-emerald-950/30 p-2.5 text-center min-w-[70px]">
            <span className="text-2xl font-black text-emerald-400 block tabular-nums">{score}</span>
            <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">HRPI</span>
          </div>
        </div>

        {/* Evidence Metric Bars */}
        <div className="border border-white/10 bg-zinc-950 p-3.5 space-y-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            STATCAST SENSOR LADDER:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {validLayers.slice(0, 4).map((layer) => (
              <div key={layer.label} className="border border-white/10 bg-black p-2 flex items-center justify-between text-[10px]">
                <span className="text-zinc-400 uppercase">{layer.label}</span>
                <strong className="text-cyan-300 tabular-nums">{Math.round(layer.value as number)}</strong>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-sans border-l-2 border-white/20 pl-3">
          {player.reasons[0] ?? 'Inspect full Statcast telemetry before locking decisions.'}
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={() => onAddPlayer(player)}
          disabled={player.truthStatus === 'blocked'}
          className="flex-1 min-h-11 border-2 border-white bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> ADD TO SLIP
        </button>
        <button
          type="button"
          onClick={onResearch}
          className="border-2 border-white/20 bg-zinc-900 text-white px-4 min-h-11 text-xs font-bold uppercase tracking-wider hover:border-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          FULL EVIDENCE <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function MatchupRow({ group, player, rank, active, onSelect, receiptOpen, onToggleReceipt }: { group: HrMatchupGroup; player: HrWatchRow; rank: number; active: boolean; onSelect: () => void; receiptOpen: boolean; onToggleReceipt: () => void }) {
  return (
    <div className={`transition-colors ${active ? 'bg-zinc-950 border-l-4 border-cyan-400' : 'hover:bg-zinc-950/60'}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center">
        <button
          type="button"
          aria-pressed={active}
          onClick={onSelect}
          className="p-3.5 flex items-center gap-3 text-left w-full cursor-pointer"
        >
          <span className="font-mono text-xs font-black text-zinc-600 tabular-nums w-5">
            {String(rank).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TeamLogo src={group.primaryLogoUrl} name={group.primaryTeam} />
              <strong className="truncate text-xs font-bold text-white uppercase">
                {group.primaryTeam} vs {group.opponent}
              </strong>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-400">
              <span className="truncate">Lead: {player.playerName}</span>
              <span>·</span>
              <span className="shrink-0">{formatGameTime(group.gameTime)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="block text-[8px] font-bold text-zinc-500 uppercase">{group.rows.length} BATS</span>
              <span className="text-[8px] text-zinc-400 uppercase">{player.truthStatus}</span>
            </div>
            <span className="font-mono text-base font-black text-emerald-400 min-w-[36px] text-right">
              {boardScore(player)}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onToggleReceipt}
          className="p-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label={`${receiptOpen ? 'Close' : 'Open'} research receipt`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${receiptOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {receiptOpen && (
        <div className="border-t border-white/10 bg-zinc-950 p-4 text-[10px] space-y-2">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase">
            <FileCheck2 className="h-3.5 w-3.5" />
            RECEIPT FOR {player.playerName.toUpperCase()}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 text-zinc-400 pt-1">
            <div>
              <p className="uppercase text-zinc-500 text-[8px] font-bold">SOURCE CHANNELS</p>
              <p className="text-zinc-300 mt-0.5">MLBAM · Statcast · Lineup Truth</p>
            </div>
            <div>
              <p className="uppercase text-zinc-500 text-[8px] font-bold">INTEGRITY GAPS</p>
              <p className="text-zinc-300 mt-0.5">{player.warnings[0] ?? '0 missing inputs'}</p>
            </div>
            <div>
              <p className="uppercase text-zinc-500 text-[8px] font-bold">CONCLUSION</p>
              <p className="text-zinc-300 mt-0.5">{player.reasons[0] ?? 'Verified'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueEmpty({ state, onResearch }: { state: TodayFieldState; onResearch: () => void }) {
  return (
    <div className="p-8 text-center space-y-3 font-mono">
      <p className="text-xs font-bold text-zinc-400 uppercase">{state === 'loading' ? 'LOADING THE SLATE...' : 'NO USABLE MATCHUPS'}</p>
      <p className="text-[10px] text-zinc-600">The source has not returned an eligible HR row.</p>
      <button onClick={onResearch} className="border border-white/20 bg-zinc-900 px-4 py-2 text-[10px] font-bold uppercase text-zinc-300 hover:text-white cursor-pointer">OPEN RESEARCH BOARD</button>
    </div>
  );
}

function TeamLogo({ src, name }: { src: string | null; name: string }) {
  return src
    ? <img src={src} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" decoding="async" />
    : <span className="flex h-4 w-4 shrink-0 items-center justify-center bg-zinc-800 text-[7px] font-black text-white">{name.slice(0, 2)}</span>;
}

function sortGroups(groups: HrMatchupGroup[], sortMode: SortMode) {
  return [...groups].sort((left, right) => {
    if (sortMode === 'score') return boardScore(right.rows[0]) - boardScore(left.rows[0]);
    const leftTime = left.gameTime ? Date.parse(left.gameTime) : Number.POSITIVE_INFINITY;
    const rightTime = right.gameTime ? Date.parse(right.gameTime) : Number.POSITIVE_INFINITY;
    return leftTime - rightTime || boardScore(right.rows[0]) - boardScore(left.rows[0]);
  });
}

function formatGameTime(value: string | null) {
  if (!value) return 'Time TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time TBD';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

