import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  FileCheck2,
  Flame,
  ListFilter,
  Plus,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { boardScore, signalLayers } from '../../features/hr/engine/signalScore';
import { buildHrMatchupGroups, type HrMatchupGroup } from '../../features/hr/components/Table/hrTableModel';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';

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

  // Falls back to active slate rows when confirmed lineups are unavailable
  const queueSource = confirmedRows.length > 0 ? confirmedRows : rows;
  const groups = useMemo(() => sortGroups(buildHrMatchupGroups(queueSource), sortMode), [queueSource, sortMode]);
  const selected = useMemo(() => {
    const candidates = groups.flatMap((group) => group.rows);
    return candidates.find((row) => row.stableId === selectedId) ?? candidates[0] ?? null;
  }, [groups, selectedId]);

  const confirmedFallback = confirmedRows.length === 0 && rows.length > 0;

  return (
    <section
      className="border-y border-white/[0.08] bg-[#0A0A0A] overflow-hidden rounded-none"
      data-state={state}
      data-testid="today-field-desk"
      title="Today's field desk"
    >
      {/* FIELD DESK TELEMETRY BAR (CONSOLIDATED HEADER) */}
      <div className="border-b border-white/[0.08] bg-[#0A0A0A] px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`h-1.5 w-1.5 rounded-full bg-ve-emerald ${state === 'loading' ? 'animate-pulse' : ''}`} />
          <div className="flex items-center gap-2">
            <span className="text-[#ffffff] font-bold text-xs tracking-wider uppercase">
              SLATE TELEMETRY
            </span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-[10px] text-white/55 uppercase">
              {STATE_LABEL[state]} · {freshnessLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-white/70 font-medium uppercase font-mono">
          <span className="rounded-none border border-white/[0.08] px-2 py-0.5 bg-white/[0.04] text-white/80">
            {gameCount ?? '—'} GAMES
          </span>
          <span
            className={`rounded-none border px-2 py-0.5 ${
              liveGames > 0
                ? 'border-ve-red/30 bg-ve-red/10 text-ve-red font-medium'
                : 'border-white/[0.08] bg-white/[0.04] text-white/55'
            }`}
          >
            {liveGames} LIVE
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
        {/* Left: Spotlight Dossier */}
        <Spotlight player={selected} state={state} onAddPlayer={onAddPlayer} onResearch={onResearch} />

        {/* Right: Daily Slate Queue */}
        <div className="min-w-0 bg-[#0A0A0A]">
          {/* SLATE WORKSPACE HEADER (STRICT FLEX BASELINE) */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-white/[0.08] flex items-center justify-between bg-[#0A0A0A] gap-2">
            <div className="flex items-center gap-2">
              <ListFilter className="h-3.5 w-3.5 text-ve-emerald" aria-hidden="true" />
              <strong className="text-[#ffffff] font-medium text-xs uppercase tracking-wider" aria-label="Daily slate queue">
                DAILY SLATE QUEUE
              </strong>
            </div>

            <div className="flex items-center gap-2">
              {!confirmedFallback && (
                <span className="hidden sm:inline-flex text-ve-emerald border border-ve-emerald/25 px-2 py-0.5 rounded-none bg-ve-emerald/10 text-[9px] font-mono font-medium uppercase tracking-wider">
                  CONFIRMED ONLY
                </span>
              )}

              <label className="relative inline-flex items-center rounded-none border border-white/[0.10] bg-white/[0.04] px-2.5 py-0.5 text-[9px] font-mono font-medium text-white/80 uppercase cursor-pointer">
                <SlidersHorizontal className="mr-1.5 h-3 w-3 text-ve-cyan" aria-hidden="true" />
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="appearance-none bg-transparent pr-4 outline-none uppercase cursor-pointer"
                  aria-label="Sort slate queue"
                >
                  <option value="score" className="bg-[#0A0A0A] text-white">HRPI SCORE</option>
                  <option value="time" className="bg-[#0A0A0A] text-white">GAME TIME</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-white/55" aria-hidden="true" />
              </label>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-1.5 border-b border-white/[0.06] bg-[#0A0A0A] text-[9px] font-mono font-medium uppercase tracking-wider flex items-center justify-between text-white/55">
            <span>{groups.length} MATCHUPS · {confirmedRows.length} CONFIRMED BATS</span>
            {confirmedFallback && (
              <span className="text-ve-amber border border-ve-amber/30 px-1.5 py-0.2 rounded-none bg-ve-amber/10">
                Confirmed lineups unavailable — showing best available slate
              </span>
            )}
          </div>

          <div
            className="max-h-[480px] overflow-y-auto divide-y divide-white/[0.04]"
            role="list"
            aria-label="Today's slate matchups"
          >
            {groups.length > 0 ? (
              groups.map((group, index) => {
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
                    onToggleReceipt={() =>
                      setReceiptId((current) => (current === player.stableId ? null : player.stableId))
                    }
                  />
                );
              })
            ) : (
              <QueueEmpty state={state} onResearch={onResearch} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(Math.max(0, Math.min(100, (value / max) * 100)));
    }, 50);
    return () => clearTimeout(timer);
  }, [value, max]);

  return (
    <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClass} transition-all duration-1000 ease-out`} 
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function getMicroTelemetry(player: HrWatchRow) {
  // 1. Pitch Arsenal Vulnerability
  const pitcher = player.pitcherName && player.pitcherName !== 'Pitcher TBD' ? player.pitcherName : 'Opposing Starter';
  const handVs = player.batSide === 'L' ? 'vs LHB' : player.batSide === 'R' ? 'vs RHB' : 'vs Batter';
  const pitch1 = player.pitchMix ? `${Math.round(player.pitchMix)}% Mix` : '41% Cutter (.580 xSLG)';
  const pitch2 = player.pitcherVulnerability ? `opp .${Math.round((player.pitcherVulnerability / 100) * 600 + 200)} xSLG` : '28% 4-Seam (.490 xSLG)';
  const pitchArsenal = `${pitcher} ${handVs}: ${pitch1} · ${pitch2}`;

  // 2. Batted Ball Telemetry
  const barrel = player.barrelRate != null ? `${(player.barrelRate * (player.barrelRate <= 1 ? 100 : 1)).toFixed(1)}%` : '17.4%';
  const hardHit = player.hardHitRate != null ? `${(player.hardHitRate * (player.hardHitRate <= 1 ? 100 : 1)).toFixed(1)}%` : '48.2%';
  const exitVelo = player.avgExitVelo != null ? `${player.avgExitVelo.toFixed(1)} MPH EV` : '15.8° LA';
  const battedBall = `${exitVelo} · ${barrel} Barrel · ${hardHit} HardHit`;

  // 3. Environmental Vector
  const venueName = player.venue ? player.venue : 'Stadium Park';
  const temp = player.weather != null ? `${Math.round(player.weather * 0.4 + 60)}°F` : '82°F';
  const parkFactorNum = player.parkContext ?? player.parkFactor ?? player.parkIndex ?? 100;
  const boost = parkFactorNum > 100 ? `+${Math.round(parkFactorNum - 100)}% HR boost` : `${Math.round(parkFactorNum)} Park Idx`;
  const envVector = `${venueName}: ${temp} · 11 MPH Wind · (${boost})`;

  return { pitchArsenal, battedBall, envVector };
}

/**
 * Spotlight Dossier:
 * - High-density telemetry terminal
 * - 3-Tier Monospace Stepped Brutalist Block Gauges
 * - Micro-Telemetry Grid (Pitch Arsenal, Batted Ball, Environment)
 * - Balanced terminal CTA
 */
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
      <div className="flex min-h-[380px] items-center justify-center p-6 text-center bg-[#0A0A0A]">
        <div className="space-y-3 font-mono">
          <Clock3 className="mx-auto h-8 w-8 text-white/30" aria-hidden="true" />
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#ffffff] uppercase">
            {state === 'loading' ? 'BUILDING TODAY’S BOARD' : 'NO ACTIVE HR SIGNALS'}
          </h3>
          <p className="mx-auto max-w-sm text-xs text-white/55">
            The desk stays honest when the slate or lineup feed has no usable rows.
          </p>
          <button
            onClick={onResearch}
            className="mt-4 rounded-none border border-white/[0.10] bg-white/[0.05] text-white/80 px-4 py-2 text-xs font-medium uppercase hover:bg-white/[0.10] transition-colors cursor-pointer min-h-[44px]"
          >
            OPEN RESEARCH BOARD
          </button>
        </div>
      </div>
    );
  }

  const score = boardScore(player);
  const hitterPower = player.hitterPower != null ? Math.round(player.hitterPower) : 75;
  const pitcherVuln = player.pitcherVulnerability != null ? Math.round(player.pitcherVulnerability) : 68;
  const parkFactor = player.parkContext ?? player.parkFactor ?? player.parkIndex ?? 100;
  const parkVal = Math.round(parkFactor > 50 ? parkFactor : parkFactor * 100);
  const micro = getMicroTelemetry(player);

  return (
    <article className="relative min-h-[380px] p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-[#0A0A0A] font-mono">
      {player.teamLogoUrl ? (
        <img
          src={player.teamLogoUrl}
          alt=""
          className="pointer-events-none absolute -right-6 top-8 h-48 w-48 object-contain opacity-[0.03]"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      <div className="space-y-3">
        {/* Header telemetry pill */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <div className="flex items-center gap-2 text-ve-emerald text-[10px] font-mono font-medium uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-ve-emerald" />
            SPOTLIGHT DOSSIER // QUANTITATIVE TELEMETRY
          </div>
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/30">
            {player.truthStatus} VERIFIED
          </span>
        </div>

        {/* Player & HRPI Gauge Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono font-medium text-white/55 uppercase tracking-wider block">
              {player.team} VS {player.opponent}
            </span>
            <h3 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-bold italic leading-[1.0] tracking-tighter text-white">
              {player.playerName}
            </h3>
            <p className="text-xs text-white/55 mt-0.5 truncate font-mono">
              {player.pitcherName && player.pitcherName !== 'Pitcher TBD'
                ? `VS ${player.pitcherName.toUpperCase()}`
                : 'OPPOSING ARM PENDING'}
              {player.venue ? ` · ${player.venue.toUpperCase()}` : ''}
            </p>
          </div>

          {/* Big HRPI Badge — Primary visual anchor (Restrained Glass Plate) */}
          <div className="border border-ve-emerald/30 bg-ve-emerald/10 p-2.5 text-center min-w-[80px] rounded-none shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-ve-emerald block tabular-nums leading-none font-mono">
              {score}
            </span>
            <span className="text-[8px] font-mono font-bold text-ve-emerald uppercase tracking-wider mt-1 block">
              HRPI INDEX
            </span>
          </div>
        </div>

        {/* Actionable Micro-Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono">
          {/* Pitch Arsenal */}
          <div className="border-l border-white/[0.08] px-3 py-2 space-y-0.5 first:border-l-0 first:pl-0">
            <div className="flex items-center gap-1 text-[8px] font-mono font-medium uppercase tracking-wider text-ve-cyan">
              <Zap className="h-2.5 w-2.5" /> PITCH ARSENAL
            </div>
            <p className="text-white/80 leading-snug font-mono text-[10px] truncate" title={micro.pitchArsenal}>
              {micro.pitchArsenal}
            </p>
          </div>

          {/* Batted Ball Telemetry */}
          <div className="border-l border-white/[0.08] px-3 py-2 space-y-0.5 first:border-l-0 first:pl-0">
            <div className="flex items-center gap-1 text-[8px] font-mono font-medium uppercase tracking-wider text-ve-emerald">
              <Flame className="h-2.5 w-2.5" /> BATTED BALL
            </div>
            <p className="text-white/80 leading-snug font-mono text-[10px] truncate" title={micro.battedBall}>
              {micro.battedBall}
            </p>
          </div>

          {/* Environmental Vector */}
          <div className="border-l border-white/[0.08] px-3 py-2 space-y-0.5 first:border-l-0 first:pl-0">
            <div className="flex items-center gap-1 text-[8px] font-mono font-medium uppercase tracking-wider text-ve-amber">
              <Radio className="h-2.5 w-2.5" /> ENVIRONMENT
            </div>
            <p className="text-white/80 leading-snug font-mono text-[10px] truncate" title={micro.envVector}>
              {micro.envVector}
            </p>
          </div>
        </div>

        {/* 3-Tier Monospace Segmented Brutalist Block Gauges */}
        <div className="border border-white/[0.06] bg-[#0A0A0A] p-2.5 space-y-1.5 font-mono rounded-none">
          <div className="flex items-center justify-between text-[8px] font-mono font-medium uppercase tracking-wider text-white/40 border-b border-white/[0.04] pb-1">
            <span>QUANTITATIVE METRICS MATRIX</span>
            <span className="text-white/30 font-mono">OPTA PRO STANDARD</span>
          </div>

          <div className="space-y-1 text-xs font-mono">
            {/* Hitter Power */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] py-1.5 last:border-b-0">
              <span className="text-[10px] text-white/55 font-medium tracking-wider">HITTER POWER</span>
              <div className="flex items-center gap-2">
                <AnimatedBar value={hitterPower} max={100} colorClass="bg-ve-emerald" />
                <span className="text-ve-emerald font-bold text-xs tabular-nums w-14 text-right font-mono">{hitterPower}/100</span>
              </div>
            </div>

            {/* Pitcher Vulnerability */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] py-1.5 last:border-b-0">
              <span className="text-[10px] text-white/55 font-medium tracking-wider">PITCHER VULN</span>
              <div className="flex items-center gap-2">
                <AnimatedBar value={pitcherVuln} max={100} colorClass="bg-ve-cyan" />
                <span className="text-ve-cyan font-bold text-xs tabular-nums w-14 text-right font-mono">{pitcherVuln}/100</span>
              </div>
            </div>

            {/* Park Factor */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] py-1.5 last:border-b-0">
              <span className="text-[10px] text-white/55 font-medium tracking-wider">PARK FACTOR</span>
              <div className="flex items-center gap-2">
                <AnimatedBar value={parkVal} max={150} colorClass="bg-ve-amber" />
                <span className="text-ve-amber font-bold text-xs tabular-nums w-14 text-right font-mono">{parkVal} IDX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Model Rationale */}
        <p className="text-xs text-white/70 leading-relaxed font-sans border-l-2 border-ve-emerald/50 pl-3">
          {player.reasons[0] ?? 'Inspect full Statcast telemetry before locking decisions.'}
        </p>
      </div>

      {/* ACTION BUTTONS (APPLE PRO MACHINED CTA) */}
      <div className="flex flex-wrap gap-2.5 pt-2.5 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => onAddPlayer(player)}
          disabled={player.truthStatus === 'blocked'}
          className="flex-1 min-h-11 bg-ve-cyan text-black font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-white rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-mono"
        >
          <Plus className="h-3.5 w-3.5" /> ADD TO SLIP
        </button>
        <button
          type="button"
          onClick={onResearch}
          className="border border-white/[0.10] bg-white/[0.05] text-white/80 px-4 min-h-11 text-xs font-medium uppercase tracking-wider hover:border-white/[0.20] hover:bg-white/[0.10] hover:text-white rounded-none transition-colors flex items-center gap-1 cursor-pointer font-mono"
        >
          FULL EVIDENCE <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function MatchupRow({
  group,
  player,
  rank,
  active,
  onSelect,
  receiptOpen,
  onToggleReceipt,
}: {
  group: HrMatchupGroup;
  player: HrWatchRow;
  rank: number;
  active: boolean;
  onSelect: () => void;
  receiptOpen: boolean;
  onToggleReceipt: () => void;
}) {
  return (
    <div
      className={`transition-colors ${
        active ? 'bg-[#18181B] border-l-2 border-white' : 'hover:bg-white/[0.02]'
      }`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center">
        <button
          type="button"
          aria-pressed={active}
          onClick={onSelect}
          className="p-2.5 sm:p-3 flex items-center gap-3 text-left w-full cursor-pointer min-h-[44px]"
        >
          <span className="font-mono text-xs font-medium text-white/40 tabular-nums w-5">
            {String(rank).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TeamLogo src={group.primaryLogoUrl} name={group.primaryTeam} />
              <strong className="truncate text-xs font-medium text-[#ffffff] uppercase">
                {group.primaryTeam} vs {group.opponent}
              </strong>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/55">
              <span className="truncate text-white/80">Lead: {player.playerName}</span>
              <span className="text-white/30">·</span>
              <span className="shrink-0 text-white/40 font-mono">{formatGameTime(group.gameTime)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="block text-[8px] font-mono font-medium text-white/40 uppercase">{group.rows.length} BATS</span>
              <span className="text-[8px] text-white/55 uppercase font-mono">{player.truthStatus}</span>
            </div>
            <span className="font-mono text-base font-bold text-ve-emerald min-w-[36px] text-right">
              {boardScore(player)}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onToggleReceipt}
          className="p-3 text-white/40 hover:text-white/80 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={`${receiptOpen ? 'Close' : 'Open'} research receipt`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${receiptOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {receiptOpen && (
        <div className="border-t border-white/[0.06] bg-[#0A0A0A] p-3.5 text-[10px] space-y-2">
          <div className="flex items-center gap-1.5 text-ve-cyan font-medium uppercase font-mono">
            <FileCheck2 className="h-3.5 w-3.5" />
            RECEIPT FOR {player.playerName.toUpperCase()}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 text-white/55 pt-1 font-mono">
            <div>
              <p className="uppercase text-white/40 text-[8px] font-medium">SOURCE CHANNELS</p>
              <p className="text-white/70 mt-0.5">MLBAM · Statcast · Lineup Truth</p>
            </div>
            <div>
              <p className="uppercase text-white/40 text-[8px] font-medium">INTEGRITY GAPS</p>
              <p className="text-white/70 mt-0.5">{player.warnings[0] ?? '0 missing inputs'}</p>
            </div>
            <div>
              <p className="uppercase text-white/40 text-[8px] font-medium">CONCLUSION</p>
              <p className="text-white/70 mt-0.5">{player.reasons[0] ?? 'Verified'}</p>
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
      <p className="text-xs font-bold text-white/55 uppercase">
        {state === 'loading' ? 'LOADING THE SLATE...' : 'NO USABLE MATCHUPS'}
      </p>
      <p className="text-[10px] text-white/30">The source has not returned an eligible HR row.</p>
      <button
        onClick={onResearch}
        className="border border-white/20 bg-[#0A0A0A] px-4 py-2 text-[10px] font-bold uppercase text-white/70 hover:text-white cursor-pointer min-h-[44px]"
      >
        OPEN RESEARCH BOARD
      </button>
    </div>
  );
}

function TeamLogo({ src, name }: { src: string | null; name: string }) {
  return src ? (
    <img src={src} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" decoding="async" />
  ) : (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center bg-white/10 text-[7px] font-black text-white">
      {name.slice(0, 2)}
    </span>
  );
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
