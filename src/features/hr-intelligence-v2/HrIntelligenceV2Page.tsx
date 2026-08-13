import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AuroraMaxCommandHeader,
  AuroraMaxControl,
  AuroraMaxMetricStrip,
  AuroraMaxProductMark,
  AuroraMaxTruthBadge,
} from '../../components/aurora-max/AuroraMaxPrimitives';
import { usePlayerVouchLeaderboard, usePlayerVouchSummary, useTogglePlayerVouch } from '../../hooks/queries/usePlayerVouchLayer';
import { ProductEvents } from '../../lib/productEvents';
import { openParlayAdd } from '../../lib/parlays/parlayAddContract';
import { selectSpotlight, type SpotlightPick } from '../hr/engine/signalScore';
import { useHrBoardViewModel } from '../hr/hooks/useHrBoardViewModel';
import { useProMode } from '../hr/hooks/useProMode';
import type { HrWatchMode } from '../hr/types/hrWatch';
import type { HrWatchRow } from '../hr/types/hrWatch';
import { toHrParlayPickerPlayer } from '../hr/utils/hrDecisionBrief';
import {
  clearHrAuroraMaxPlayer,
  isHrAuroraMaxHistoryEntry,
  pushHrAuroraMaxPlayer,
  readHrAuroraMaxPlayerId,
} from './researchRoute';
import { DISPLAY_TIERS, SOURCE_MODES, type HrWorkspaceId } from './contracts';
import { BoardEmptyState, BoardErrorState, BoardLoadingState } from './DeskStates';
import { FieldDesk } from './FieldDesk';
import { formatRelativeTime } from './format';
import { ResearchOverlay } from './ResearchOverlay';
import { EdgeWorkspace, ExtremesWorkspace, MatrixWorkspace, StacksWorkspace, WorkspaceNav, type MatrixAxis } from './workspaces';
import './hr-intelligence-v2.css';

interface Props {
  onSectionChange?: (section: string) => void;
}

export default function HrIntelligenceV2Page({ onSectionChange }: Props) {
  const vm = useHrBoardViewModel();
  const [isProMode, toggleProMode] = useProMode();
  const [workspace, setWorkspace] = useState<HrWorkspaceId>('overview');
  const [sortMode, setSortMode] = useState<'score' | 'time'>('score');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [researchPlayer, setResearchPlayer] = useState<HrWatchRow | null>(null);
  const [xAxis, setXAxis] = useState<MatrixAxis>('pitcherVulnerability');
  const [yAxis, setYAxis] = useState<MatrixAxis>('hitterPower');

  const rows = vm.rows ?? [];
  const selected = useMemo(
    () => rows.find((row) => row.stableId === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );
  const picks = useMemo(() => selectSpotlight(rows), [rows]);
  const visiblePlayerIds = useMemo(() => rows.map((row) => row.playerId), [rows]);
  const vouchSummary = usePlayerVouchSummary(vm.date, isProMode ? visiblePlayerIds : []);
  const vouchLeaderboard = usePlayerVouchLeaderboard(vm.date, 5);
  const toggleVouch = useTogglePlayerVouch();
  const vouchedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of vouchSummary.data ?? []) {
      if (entry.viewerHasVouched) ids.add(String(entry.playerId));
    }
    return ids;
  }, [vouchSummary.data]);

  const openResearch = useCallback((player: HrWatchRow) => {
    ProductEvents.playerCardOpened({
      date: vm.date,
      mode: vm.mode,
      player_id: player.playerId == null ? null : String(player.playerId),
      player_name: player.playerName,
      truth_status: player.truthStatus,
      hr_score: player.hrScore,
    });
    ProductEvents.playerResearchViewed({
      date: vm.date,
      mode: vm.mode,
      player_id: player.playerId == null ? null : String(player.playerId),
      player_name: player.playerName,
      truth_status: player.truthStatus,
      hr_score: player.hrScore,
    });
    setResearchPlayer(player);
    vm.setSelectedPlayer(player);
    if (player.playerId != null && readHrAuroraMaxPlayerId() !== String(player.playerId)) {
      pushHrAuroraMaxPlayer(player.playerId);
    }
  }, [vm]);

  const closeResearch = useCallback(() => {
    if (readHrAuroraMaxPlayerId() && isHrAuroraMaxHistoryEntry()) {
      window.history.back();
      return;
    }
    clearHrAuroraMaxPlayer();
    setResearchPlayer(null);
    vm.setSelectedPlayer(null);
  }, [vm]);

  useEffect(() => {
    const sync = () => {
      const playerId = readHrAuroraMaxPlayerId();
      if (!playerId) {
        setResearchPlayer(null);
        return;
      }
      const match = (vm.researchRows ?? rows).find((row) => String(row.playerId) === playerId) ?? null;
      setResearchPlayer(match);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [rows, vm.researchRows]);

  const addToSlip = useCallback((player: HrWatchRow) => {
    if (!onSectionChange) return;
    ProductEvents.slipBuildStarted({
      entrypoint: 'hr_aurora_max',
      date: vm.date,
      top_player: player.playerName,
      top_player_id: player.playerId == null ? null : String(player.playerId),
    });
    clearHrAuroraMaxPlayer();
    setResearchPlayer(null);
    vm.setSelectedPlayer(null);
    openParlayAdd({
      player: toHrParlayPickerPlayer(player),
      propHint: {
        id: `hr-watch-${player.stableId}`,
        market: 'Home Runs',
        odds: player.bookOdds ?? null,
        spec: `${player.playerName} 1+ Home Run`,
        gamePk: player.gamePk ?? undefined,
        playerId: player.playerId ?? undefined,
      },
      initialFamily: 'home_runs',
      isPitcher: false,
      source: 'hr_intelligence',
      dataStatus: player.truthStatus === 'official' ? 'official' : player.truthStatus === 'projected' ? 'projected' : 'unknown',
      reasoningSnapshot: player.reasons[0] ?? null,
      riskSnapshot: player.warnings[0] ?? null,
    });
  }, [onSectionChange, vm]);

  const confirmedCount = vm.modeCounts?.confirmed ?? 0;
  const previewCount = vm.modeCounts?.curated ?? 0;
  const empty = !vm.loading && !vm.error && rows.length === 0;
  const noConfirmed = vm.mode === 'confirmed' && confirmedCount === 0 && previewCount > 0;

  return (
    <div className="hr-intel-v2" data-testid="hr-intelligence-v2" data-scroll-owner="inner-view-slot">
      <div className="hr-intel-v2-shell">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <AuroraMaxProductMark />
            <AuroraMaxCommandHeader
              eyebrow="Aurora Max"
              title="HR Aurora Max"
              description={vm.isToday ? 'Today’s ranked HR board. Confirmed lineups stay confirmed; projected stays projected.' : `Historical board for ${vm.date}.`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AuroraMaxTruthBadge state={vm.isToday ? 'live' : 'projected'}>{vm.isToday ? 'Live slate' : vm.date}</AuroraMaxTruthBadge>
            <AuroraMaxControl aria-pressed={isProMode} onClick={toggleProMode}>
              {isProMode ? 'Full desk' : 'Standard desk'}
            </AuroraMaxControl>
            <AuroraMaxControl onClick={() => void vm.refresh()} disabled={vm.syncing}>
              {vm.syncing ? 'Syncing' : 'Refresh'}
            </AuroraMaxControl>
          </div>
        </header>

        <AuroraMaxMetricStrip
          items={[
            { label: 'Board', value: vm.stats?.total ?? rows.length, tone: 'confirmed' },
            { label: 'Confirmed', value: confirmedCount, tone: confirmedCount > 0 ? 'confirmed' : 'warning' },
            { label: 'Preview', value: previewCount, tone: 'neutral' },
            { label: 'Updated', value: formatRelativeTime(vm.lastUpdated), tone: vm.connection?.isLastGood ? 'warning' : 'live' },
          ]}
        />

        {vm.refreshError || vm.connection?.isLastGood ? (
          <div className="hr-intel-v2-banner hr-intel-v2-banner--warning" role="status">
            {vm.refreshError ?? 'Showing last successful board while a refresh is degraded.'}
          </div>
        ) : null}
        {vm.autoSwitchedToPreview ? (
          <div className="hr-intel-v2-banner" role="status">
            Confirmed lineups are empty. The desk switched to preview candidates and did not invent official batting orders.
          </div>
        ) : null}

        <div className="hr-intel-v2-filters">
          {SOURCE_MODES.map((mode) => (
            <AuroraMaxControl
              key={mode.id}
              aria-pressed={vm.mode === mode.id}
              onClick={() => vm.setMode(mode.id as HrWatchMode)}
            >
              {mode.label}
            </AuroraMaxControl>
          ))}
          <input
            className="hr-intel-v2-search sm:col-span-2 md:min-w-[12rem]"
            value={vm.search}
            onChange={(event) => vm.setSearch(event.target.value)}
            placeholder="Find a batter"
            aria-label="Find a batter"
          />
          {isProMode
            ? DISPLAY_TIERS.map((tier) => (
                <AuroraMaxControl
                  key={tier}
                  aria-pressed={vm.selectedTiers.includes(tier)}
                  onClick={() => vm.onToggleTier(tier)}
                >
                  {tier}
                </AuroraMaxControl>
              ))
            : null}
        </div>

        {isProMode ? <WorkspaceNav active={workspace} onChange={setWorkspace} /> : null}

        {picks.length > 0 && (!isProMode || workspace === 'overview') ? (
          <SpotlightPicks picks={picks} selectedId={selected?.stableId ?? null} onSelect={setSelectedId} />
        ) : null}

        {isProMode && workspace === 'overview' && (vouchLeaderboard.data?.length ?? 0) > 0 ? (
          <MostVouchedStrip
            names={vouchLeaderboard.data ?? []}
            onSelectName={(name) => {
              const match = rows.find((row) => row.playerName === name);
              if (match) setSelectedId(match.stableId);
            }}
          />
        ) : null}

        {vm.loading && rows.length === 0 ? (
          <BoardLoadingState />
        ) : vm.error ? (
          <BoardErrorState message={vm.error} onRetry={() => void vm.refresh()} />
        ) : empty ? (
          <BoardEmptyState
            noConfirmed={noConfirmed}
            previewCount={previewCount}
            onShowPreview={() => vm.setMode('curated')}
            onRetry={() => void vm.refresh()}
          />
        ) : !isProMode || workspace === 'overview' ? (
          <FieldDesk
            rows={rows}
            selectedId={selected?.stableId ?? null}
            onSelect={setSelectedId}
            onResearch={openResearch}
            onAddToSlip={onSectionChange ? addToSlip : undefined}
            onToggleVouch={isProMode ? (player) => {
              if (player.playerId == null) return;
              toggleVouch.mutate({
                playerId: player.playerId,
                playerName: player.playerName,
                team: player.team,
                opponent: player.opponent,
                gamePk: player.gamePk,
                contextDate: vm.date,
                sourcePage: 'hr_intelligence_v2',
              });
            } : undefined}
            vouchedIds={vouchedIds}
            getHrResult={vm.getHrResult}
            sortMode={sortMode}
            onSortMode={setSortMode}
            subtitle={`${rows.length} bats · ${confirmedCount} confirmed`}
          />
        ) : workspace === 'edge' ? (
          <EdgeWorkspace rows={rows} onSelect={(row) => { setSelectedId(row.stableId); openResearch(row); }} />
        ) : workspace === 'stacks' ? (
          <StacksWorkspace rows={rows} onSelect={(row) => { setSelectedId(row.stableId); openResearch(row); }} />
        ) : workspace === 'matrix' ? (
          <MatrixWorkspace
            rows={rows}
            xAxis={xAxis}
            yAxis={yAxis}
            onXAxis={setXAxis}
            onYAxis={setYAxis}
            selectedId={selected?.stableId ?? null}
            onSelect={(row) => setSelectedId(row.stableId)}
          />
        ) : (
          <ExtremesWorkspace rows={rows} onSelect={(row) => { setSelectedId(row.stableId); openResearch(row); }} />
        )}
      </div>

      {researchPlayer ? (
        <ResearchOverlay
          player={researchPlayer}
          date={vm.date}
          onClose={closeResearch}
          onAddToSlip={onSectionChange ? addToSlip : undefined}
        />
      ) : null}
    </div>
  );
}

function SpotlightPicks({
  picks,
  selectedId,
  onSelect,
}: {
  picks: readonly SpotlightPick[];
  selectedId: string | null;
  onSelect: (stableId: string) => void;
}) {
  return (
    <div className="hr-intel-v2-picks" role="list" aria-label="Spotlight signals">
      {picks.map((pick) => (
        <button
          key={pick.key}
          type="button"
          className="hr-intel-v2-pick"
          role="listitem"
          aria-pressed={selectedId === pick.row.stableId}
          onClick={() => onSelect(pick.row.stableId)}
        >
          <small>{pick.title}</small>
          <strong>{pick.row.playerName}</strong>
          <span>{pick.metricLabel} {pick.metricValue}</span>
        </button>
      ))}
    </div>
  );
}

function MostVouchedStrip({
  names,
  onSelectName,
}: {
  names: readonly { playerId: string; playerName: string; totalVouches: number }[];
  onSelectName: (name: string) => void;
}) {
  return (
    <div className="aurora-max-panel px-3 py-2">
      <p className="aurora-max-eyebrow">Most vouched</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {names.map((entry) => (
          <AuroraMaxControl key={entry.playerId} onClick={() => onSelectName(entry.playerName)}>
            {entry.playerName} · {entry.totalVouches}
          </AuroraMaxControl>
        ))}
      </div>
    </div>
  );
}
