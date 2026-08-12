import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Clock3, FileCheck2, ListFilter, Plus, SlidersHorizontal } from 'lucide-react';
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
  loading: 'Syncing sources',
  live: 'Live slate',
  pregame: 'Pregame board',
  postgame: 'Slate complete',
  'no-slate': 'No MLB slate',
  degraded: 'Verify source data',
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
    <section className="aurora-max-panel mt-4 overflow-hidden" data-state={state} data-testid="today-field-desk">
      <div className="border-b border-[var(--aurora-max-line)] bg-[rgba(5,11,13,0.62)] px-4 py-3 sm:px-5">
        <AuroraMaxCommandHeader
          compact
          eyebrow={<span className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 bg-[var(--aurora-max-emerald)] shadow-[0_0_15px_rgba(0,217,160,0.85)] ${state === 'loading' ? 'animate-pulse' : ''}`} aria-hidden="true" /> Research command desk</span>}
          title="Today's field desk"
          description={`${STATE_LABEL[state]} · ${freshnessLabel}`}
          meta={<div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-white/46">
          <span>{gameCount ?? '—'} games</span>
          <span className="text-white/18">/</span>
          <span className={liveGames > 0 ? 'text-vouch-emerald' : ''}>{liveGames} live</span>
          </div>}
        />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.94fr)_minmax(440px,1.06fr)]">
        <Spotlight player={selected} state={state} onAddPlayer={onAddPlayer} onResearch={onResearch} />

        <div className="min-w-0 border-t border-[var(--aurora-max-line)] bg-[rgba(4,10,15,0.45)] lg:border-l lg:border-t-0">
          <AuroraMaxRankedWorkspace
            className="px-4 pt-3 sm:px-5"
            title={<span className="flex items-center gap-2"><ListFilter className="h-3.5 w-3.5 text-vouch-emerald" aria-hidden="true" /> Daily slate queue</span>}
            subtitle={`${groups.length} matchup${groups.length === 1 ? '' : 's'} · ${confirmedRows.length} confirmed lineup rows`}
            controls={<label className="relative inline-flex min-h-9 items-center border border-white/10 bg-black/25 pl-3 pr-8 text-[10px] font-bold text-white/68">
              <SlidersHorizontal className="mr-1.5 h-3 w-3 text-vouch-cyan" aria-hidden="true" />
              <span className="sr-only">Sort slate queue</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="appearance-none bg-transparent pr-1 outline-none"
                aria-label="Sort slate queue"
              >
                <option value="score">HRPI score</option>
                <option value="time">Game time</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3 w-3 text-white/40" aria-hidden="true" />
            </label>}
          >

          <div className="-mx-4 flex items-center gap-2 border-b border-[var(--aurora-max-line)] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.12em] sm:-mx-5 sm:px-5">
            {confirmedFallback ? (
              <AuroraMaxTruthBadge state="warning">Confirmed lineups unavailable — showing best available slate</AuroraMaxTruthBadge>
            ) : (
              <AuroraMaxTruthBadge state="confirmed">Confirmed only</AuroraMaxTruthBadge>
            )}
          </div>

          <div className="-mx-4 max-h-[310px] overflow-y-auto sm:-mx-5" role="list" aria-label="Today's slate matchups">
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
          </AuroraMaxRankedWorkspace>
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
      <div className="flex min-h-[350px] items-center justify-center border-r border-[var(--aurora-max-line)] p-6 text-center">
        <div>
          <Clock3 className="mx-auto h-7 w-7 text-white/24" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">{state === 'loading' ? 'Building today’s board' : 'No active HR signals yet'}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">The desk stays honest when the slate or lineup feed has no usable rows.</p>
          <AuroraMaxControl onClick={onResearch} className="mt-5 min-h-11 px-4 text-xs text-[var(--aurora-max-cyan)]">Open research board</AuroraMaxControl>
        </div>
      </div>
    );
  }

  const layers = signalLayers(player);
  const score = boardScore(player);
  const validLayers = layers.filter((layer) => layer.value != null);

  return (
    <article className="relative min-h-[350px] overflow-hidden border-r border-[var(--aurora-max-line)] p-5 sm:p-6">
      {player.teamLogoUrl ? <img src={player.teamLogoUrl} alt="" className="pointer-events-none absolute -right-6 top-8 h-40 w-40 object-contain opacity-[0.045]" loading="lazy" decoding="async" /> : null}
      <div className="relative flex h-full flex-col">
        <div className="-mx-5 -mt-5 mb-4 flex min-h-9 items-center justify-between border-b border-[var(--aurora-max-line)] bg-[var(--aurora-max-panel-strong)] px-4 sm:-mx-6 sm:-mt-6">
          <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--aurora-max-emerald)]"><span className="h-2 w-2 shrink-0 bg-[var(--aurora-max-emerald)] shadow-[0_0_15px_rgba(0,217,160,0.85)]" aria-hidden="true" /> Primary research signal</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30">{player.truthStatus} receipt</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-vouch-emerald">Spotlight receipt</p>
            <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/42">{player.team} vs {player.opponent}</p>
          </div>
          <AuroraMaxScoreBadge score={score} />
        </div>

        <div className="mt-2 flex min-w-0 items-end gap-3">
          <PlayerPortrait player={player} />
          <div className="min-w-0 pb-2">
            <h1 className="truncate text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">{player.playerName}</h1>
            <p className="mt-1 truncate text-xs font-semibold text-white/52">
              {player.pitcherName && player.pitcherName !== 'Pitcher TBD' ? `vs ${player.pitcherName}` : 'Opposing pitcher pending'}
              {player.venue ? ` · ${player.venue}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <AuroraMaxEvidenceLadder
            meta={<AuroraMaxTruthBadge state={truthState(player.truthStatus)}>{player.truthStatus} data</AuroraMaxTruthBadge>}
            items={validLayers.map((layer) => ({
              label: layer.label,
              value: Math.round(layer.value as number),
              score: layer.value,
              tone: 'confirmed' as const,
            }))}
          />
        </div>

        <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-white/48">{player.reasons[0] ?? 'Open the full research board to inspect this matchup before making a decision.'}</p>
        <div className="mt-auto flex gap-2 pt-4">
          <AuroraMaxControl
            onClick={() => onAddPlayer(player)}
            disabled={player.truthStatus === 'blocked'}
            tone="primary"
            className="!border-[rgba(0,217,160,0.4)] !bg-[var(--aurora-max-emerald)] !text-[#02100d] min-h-11 flex-1 px-4 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add to slip
          </AuroraMaxControl>
          <AuroraMaxControl onClick={onResearch} className="min-h-11 px-4 text-xs text-[var(--aurora-max-cyan)]">
            Full research <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </AuroraMaxControl>
        </div>
      </div>
    </article>
  );
}

function MatchupRow({ group, player, rank, active, onSelect, receiptOpen, onToggleReceipt }: { group: HrMatchupGroup; player: HrWatchRow; rank: number; active: boolean; onSelect: () => void; receiptOpen: boolean; onToggleReceipt: () => void }) {
  return (
    <div>
      <div className={`grid grid-cols-[minmax(0,1fr)_auto] border-b border-[var(--aurora-max-line)] transition ${active ? 'bg-[rgba(0,217,160,0.075)]' : 'hover:bg-[rgba(0,217,160,0.035)]'}`}>
        <button type="button" aria-pressed={active} onClick={onSelect} className={`grid min-h-[62px] w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-4 text-left transition hover:bg-[rgba(0,217,160,0.035)] sm:px-5 ${active ? 'bg-[rgba(0,217,160,0.065)] shadow-[inset_2px_0_var(--aurora-max-emerald)]' : ''}`}>
          <span className="font-mono text-[10px] font-black text-white/28">{String(rank).padStart(2, '0')}</span>
          <span className="min-w-0">
            <span className="flex items-center gap-2"><TeamLogo src={group.primaryLogoUrl} name={group.primaryTeam} /><strong className="truncate text-xs font-black text-white">{group.primaryTeam} vs {group.opponent}</strong></span>
            <span className="mt-1 flex min-w-0 items-center gap-2 pl-7 text-[10px] text-white/42"><span className="truncate">Lead: {player.playerName}</span><span aria-hidden="true">·</span><span className="shrink-0">{formatGameTime(group.gameTime)}</span></span>
          </span>
          <span className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-white/28">{group.rows.length} bats</span><span className="mt-0.5 block text-[9px] text-white/38">{player.truthStatus}</span></span><span className="min-w-9 font-mono text-lg font-black text-vouch-emerald">{boardScore(player)}</span></span>
        </button>
        <div className="flex items-center px-2"><AuroraMaxReceiptAction onClick={onToggleReceipt} expanded={receiptOpen} label={`${receiptOpen ? 'Close' : 'Open'} ${player.playerName} research receipt`}><ChevronDown className={`h-3 w-3 transition ${receiptOpen ? 'rotate-180' : ''}`} /></AuroraMaxReceiptAction></div>
      </div>
      {receiptOpen ? <div className="border-b border-[var(--aurora-max-line-strong)] bg-[var(--aurora-max-panel-strong)] px-4 py-3 sm:px-5" role="region" aria-label={`${player.playerName} research receipt`}><div className="flex items-center gap-2 text-[10px] font-semibold text-[var(--aurora-max-paper)]"><FileCheck2 className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" /> Research receipt · {player.playerName}</div><div className="mt-3 grid gap-3 text-[10px] sm:grid-cols-3"><div><p className="font-mono uppercase tracking-[0.12em] text-white/30">Sources</p><p className="mt-1 text-white/60">HR research board · MLB schedule · lineup truth</p></div><div><p className="font-mono uppercase tracking-[0.12em] text-white/30">Missing inputs</p><p className="mt-1 text-white/60">{player.warnings[0] ?? 'No additional source gap reported.'}</p></div><div><p className="font-mono uppercase tracking-[0.12em] text-white/30">Conclusion</p><p className="mt-1 text-white/60">{player.reasons[0] ?? 'Evidence detail unavailable.'}</p></div></div></div> : null}
    </div>
  );
}

function QueueEmpty({ state, onResearch }: { state: TodayFieldState; onResearch: () => void }) {
  return (
    <AuroraMaxFallback
      title={state === 'loading' ? 'Loading the slate…' : 'No usable matchups yet'}
      detail="Filters did not hide the slate. The source has not returned an eligible HR row."
      action={<AuroraMaxControl onClick={onResearch} className="mt-4 min-h-10 text-xs text-vouch-cyan">Open research board</AuroraMaxControl>}
    />
  );
}

function PlayerPortrait({ player }: { player: HrWatchRow }) {
  const [failed, setFailed] = useState(false);
  if (!player.headshotUrl || failed) return <div className="flex h-20 w-16 shrink-0 items-center justify-center border border-[var(--aurora-max-line)] bg-white/[0.04] text-lg font-black text-white/42">{getPlayerInitials(player.playerName)}</div>;
  return <img src={player.headshotUrl} alt="" className="h-20 w-16 shrink-0 object-contain object-bottom" onError={() => setFailed(true)} decoding="async" />;
}

function TeamLogo({ src, name }: { src: string | null; name: string }) {
  return src
    ? <img src={src} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" decoding="async" />
    : <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[7px] font-black text-white/40">{name.slice(0, 2)}</span>;
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

function truthState(status: HrWatchRow['truthStatus']): AuroraMaxTruthState {
  if (status === 'official') return 'confirmed';
  if (status === 'projected') return 'projected';
  if (status === 'blocked') return 'warning';
  return 'missing';
}
