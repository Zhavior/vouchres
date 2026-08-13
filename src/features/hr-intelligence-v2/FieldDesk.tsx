import { useMemo, useState, type ReactNode } from 'react';
import { Star } from 'lucide-react';
import {
  AuroraMaxCommandHeader,
  AuroraMaxControl,
  AuroraMaxEvidenceLadder,
  AuroraMaxFallback,
  AuroraMaxRankedWorkspace,
  AuroraMaxReceiptAction,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../components/aurora-max/AuroraMaxPrimitives';
import { boardScore, signalLayers } from '../hr/engine/signalScore';
import type { HrResult } from '../hr/hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../hr/types/hrWatch';
import { getPlayerInitials } from '../../lib/mlbHeadshot';
import { formatGameTime } from './format';
import { truthLabel, truthState } from './truth';

type SortMode = 'score' | 'time';

interface FieldDeskProps {
  rows: readonly HrWatchRow[];
  selectedId: string | null;
  onSelect: (stableId: string) => void;
  onResearch: (row: HrWatchRow) => void;
  onAddToSlip?: (row: HrWatchRow) => void;
  onToggleVouch?: (row: HrWatchRow) => void;
  vouchedIds?: ReadonlySet<string>;
  getHrResult: (playerId: string | number | null) => HrResult;
  sortMode: SortMode;
  onSortMode: (mode: SortMode) => void;
  subtitle: string;
}

export function FieldDesk({
  rows,
  selectedId,
  onSelect,
  onResearch,
  onAddToSlip,
  onToggleVouch,
  vouchedIds,
  getHrResult,
  sortMode,
  onSortMode,
  subtitle,
}: FieldDeskProps) {
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const sorted = useMemo(() => sortRows(rows, sortMode), [rows, sortMode]);
  const selected = useMemo(
    () => sorted.find((row) => row.stableId === selectedId) ?? sorted[0] ?? null,
    [sorted, selectedId],
  );

  return (
    <AuroraMaxPanelDesk>
      <div className="hr-intel-v2-desk">
        <Spotlight
          player={selected}
          onResearch={onResearch}
          onAddToSlip={onAddToSlip}
          onToggleVouch={onToggleVouch}
          vouched={selected != null && vouchedIds?.has(String(selected.playerId ?? '')) === true}
        />
        <div className="hr-intel-v2-queue">
          <AuroraMaxRankedWorkspace
            className="px-3 pt-3 sm:px-4"
            title="Daily HR board"
            subtitle={subtitle}
            controls={
              <label className="relative inline-flex min-h-9 items-center border border-[var(--aurora-max-line)] bg-black/25 px-3 pr-8 text-[10px] font-bold text-white/68">
                <span className="sr-only">Sort board</span>
                <select
                  value={sortMode}
                  onChange={(event) => onSortMode(event.target.value as SortMode)}
                  className="appearance-none bg-transparent outline-none"
                  aria-label="Sort board"
                >
                  <option value="score">HRPI score</option>
                  <option value="time">Game time</option>
                </select>
              </label>
            }
          >
            <div className="hr-intel-v2-queue-head" aria-hidden="true">
              <span>#</span>
              <span>Batter</span>
              <span>Matchup</span>
              <span>Truth</span>
              <span>HRPI</span>
            </div>
            {sorted.length === 0 ? (
              <AuroraMaxFallback
                compact
                title="No candidates in this filter"
                detail="Confirmed lineups may still be posting, or the current source/tier filter excluded every row."
              />
            ) : (
              <div role="list" aria-label="Ranked HR candidates">
                {sorted.map((row, index) => (
                  <PlayerRow
                    key={row.stableId}
                    row={row}
                    rank={index + 1}
                    active={selected?.stableId === row.stableId}
                    receiptOpen={receiptId === row.stableId}
                    result={getHrResult(row.playerId)}
                    onSelect={() => onSelect(row.stableId)}
                    onToggleReceipt={() => setReceiptId((current) => (current === row.stableId ? null : row.stableId))}
                    onResearch={() => onResearch(row)}
                  />
                ))}
              </div>
            )}
          </AuroraMaxRankedWorkspace>
        </div>
      </div>
    </AuroraMaxPanelDesk>
  );
}

function AuroraMaxPanelDesk({ children }: { children: ReactNode }) {
  return <section className="aurora-max-panel overflow-hidden">{children}</section>;
}

function Spotlight({
  player,
  onResearch,
  onAddToSlip,
  onToggleVouch,
  vouched,
}: {
  player: HrWatchRow | null;
  onResearch: (row: HrWatchRow) => void;
  onAddToSlip?: (row: HrWatchRow) => void;
  onToggleVouch?: (row: HrWatchRow) => void;
  vouched: boolean;
}) {
  if (!player) {
    return (
      <div className="flex min-h-[22rem] items-center justify-center p-6">
        <AuroraMaxFallback
          title="No primary signal"
          detail="The desk stays empty until a validated HR row is available for this slate."
        />
      </div>
    );
  }

  const layers = signalLayers(player).filter((layer) => layer.value != null);
  const score = boardScore(player);

  return (
    <article className="relative min-h-[22rem] overflow-hidden p-5 sm:p-6">
      <AuroraMaxCommandHeader
        compact
        eyebrow="Primary research signal"
        title={player.playerName}
        description={`${player.team} vs ${player.opponent}${player.venue ? ` · ${player.venue}` : ''}`}
        meta={<AuroraMaxScoreBadge score={score} />}
      />
      <div className="mt-4 flex items-end gap-3">
        <PlayerPortrait player={player} />
        <div className="min-w-0 pb-1">
          <p className="truncate text-xs text-white/55">
            {player.pitcherName && player.pitcherName !== 'Pitcher TBD' ? `vs ${player.pitcherName}` : 'Opposing pitcher pending'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <AuroraMaxTruthBadge state={truthState(player.truthStatus)}>{truthLabel(player.truthStatus)}</AuroraMaxTruthBadge>
            {player.last7DayHomeRuns != null ? (
              <AuroraMaxTruthBadge state="live">{player.last7DayHomeRuns} HR / 7d</AuroraMaxTruthBadge>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <AuroraMaxEvidenceLadder
          meta={player.reasons[0] ? 'Top model reason' : 'Missing rationale'}
          items={layers.map((layer) => ({
            label: layer.label,
            value: Math.round(layer.value as number),
            score: layer.value,
            tone: 'confirmed' as const,
          }))}
        />
      </div>
      <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-white/48">
        {player.reasons[0] ?? 'Open research to inspect this matchup before acting.'}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {onAddToSlip ? (
          <AuroraMaxControl tone="primary" disabled={player.truthStatus === 'blocked'} onClick={() => onAddToSlip(player)}>
            Add HR prop
          </AuroraMaxControl>
        ) : null}
        <AuroraMaxControl onClick={() => onResearch(player)}>Open research</AuroraMaxControl>
        {onToggleVouch && player.playerId != null ? (
          <AuroraMaxControl aria-pressed={vouched} onClick={() => onToggleVouch(player)}>
            <Star className="h-3.5 w-3.5" aria-hidden="true" fill={vouched ? 'currentColor' : 'none'} />
            {vouched ? 'Vouched' : 'Vouch'}
          </AuroraMaxControl>
        ) : null}
      </div>
    </article>
  );
}

function PlayerRow({
  row,
  rank,
  active,
  receiptOpen,
  result,
  onSelect,
  onToggleReceipt,
  onResearch,
}: {
  row: HrWatchRow;
  rank: number;
  active: boolean;
  receiptOpen: boolean;
  result: HrResult;
  onSelect: () => void;
  onToggleReceipt: () => void;
  onResearch: () => void;
}) {
  return (
    <div role="listitem">
      <div className="grid grid-cols-[minmax(0,1fr)_auto]">
        <button type="button" className="hr-intel-v2-row" aria-pressed={active} onClick={onSelect}>
          <span className="font-mono text-[10px] font-black text-white/28">{String(rank).padStart(2, '0')}</span>
          <span className="min-w-0">
            <strong className="block truncate text-xs font-black text-[var(--aurora-max-paper)]">{row.playerName}</strong>
            <span className="mt-0.5 block truncate text-[10px] text-white/42">
              {row.team} vs {row.opponent} · {formatGameTime(row.gameTime)}
            </span>
          </span>
          <span className="hidden truncate font-mono text-[10px] text-white/45 md:block">{row.pitcherName ?? 'TBD'}</span>
          <span className="hidden md:block">
            <AuroraMaxTruthBadge state={truthState(row.truthStatus)}>
              {result === 'hit' ? 'HR' : result === 'no-hr' ? 'No HR' : truthLabel(row.truthStatus)}
            </AuroraMaxTruthBadge>
          </span>
          <span className="font-mono text-lg font-black text-[var(--aurora-max-emerald)]">{boardScore(row)}</span>
        </button>
        <div className="flex items-center px-2">
          <AuroraMaxReceiptAction
            expanded={receiptOpen}
            onClick={onToggleReceipt}
            label={`${receiptOpen ? 'Close' : 'Open'} ${row.playerName} receipt`}
          />
        </div>
      </div>
      {receiptOpen ? (
        <div className="border-b border-[var(--aurora-max-line-strong)] bg-[var(--aurora-max-panel-strong)] px-4 py-3" role="region" aria-label={`${row.playerName} research receipt`}>
          <p className="text-[10px] font-semibold text-[var(--aurora-max-paper)]">Research receipt · {row.playerName}</p>
          <div className="mt-3 grid gap-3 text-[10px] sm:grid-cols-3">
            <div>
              <p className="font-mono uppercase tracking-[0.12em] text-white/30">Conclusion</p>
              <p className="mt-1 text-white/60">{row.reasons[0] ?? 'Evidence detail unavailable.'}</p>
            </div>
            <div>
              <p className="font-mono uppercase tracking-[0.12em] text-white/30">Missing / risk</p>
              <p className="mt-1 text-white/60">{row.warnings[0] ?? 'No additional source gap reported.'}</p>
            </div>
            <div>
              <p className="font-mono uppercase tracking-[0.12em] text-white/30">Action</p>
              <AuroraMaxControl className="mt-1" onClick={onResearch}>Inspect research</AuroraMaxControl>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlayerPortrait({ player }: { player: HrWatchRow }) {
  const [failed, setFailed] = useState(false);
  if (!player.headshotUrl || failed) {
    return (
      <div className="flex h-20 w-16 shrink-0 items-center justify-center border border-[var(--aurora-max-line)] bg-white/[0.04] text-lg font-black text-white/42">
        {getPlayerInitials(player.playerName)}
      </div>
    );
  }
  return (
    <img
      src={player.headshotUrl}
      alt=""
      className="h-20 w-16 shrink-0 object-contain object-bottom"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function sortRows(rows: readonly HrWatchRow[], sortMode: SortMode): HrWatchRow[] {
  return [...rows].sort((left, right) => {
    if (sortMode === 'score') return boardScore(right) - boardScore(left);
    const leftTime = left.gameTime ? Date.parse(left.gameTime) : Number.POSITIVE_INFINITY;
    const rightTime = right.gameTime ? Date.parse(right.gameTime) : Number.POSITIVE_INFINITY;
    return leftTime - rightTime || boardScore(right) - boardScore(left);
  });
}
