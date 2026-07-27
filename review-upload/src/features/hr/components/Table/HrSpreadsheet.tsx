import { Fragment, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Heart,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../../lib/teamLogos';
import { buildHrDecisionBrief, type HrBoardFreshness } from '../../utils/hrDecisionBrief';
import type { HrWatchRow } from '../../types/hrWatch';
import {
  buildHrMatchupGroups,
  getHrTableReason,
  getHrTableRisk,
  getHrTableTier,
  HR_TABLE_TIERS,
  type HrTableTier,
} from './hrTableModel';

interface HrSpreadsheetProps {
  rows: HrWatchRow[];
  onSelectPlayer: (row: HrWatchRow) => void;
  onAddToSlip?: (row: HrWatchRow) => void;
  onTogglePlayerVouch?: (row: HrWatchRow) => void;
  playerVouchMap?: Map<string, { totalVouches: number; viewerHasVouched: boolean }>;
  pendingPlayerVouchId?: string | null;
  freshness: HrBoardFreshness;
  generatedAt: Date | null;
}

const TIER_STYLES: Record<HrTableTier, string> = {
  Elite: 'border-[#00ff94]/35 bg-[#00ff94]/10 text-[#75ffc5]',
  Strong: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  Watch: 'border-sky-300/20 bg-sky-300/[0.07] text-sky-100',
  Sleeper: 'border-amber-300/25 bg-amber-300/[0.08] text-amber-200',
};

const TRUTH_STYLES: Record<HrWatchRow['truthStatus'], string> = {
  official: 'text-[#75ffc5]',
  projected: 'text-amber-200',
  blocked: 'text-red-300',
  unknown: 'text-white/55',
};

function numberLabel(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '-' : String(Math.round(value));
}

function probabilityLabel(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '-' : `${(value * 100).toFixed(1)}%`;
}

function marketEdgeLabel(row: HrWatchRow): string | null {
  if (row.hrProbability == null || row.impliedProbability == null) return null;
  const edge = (row.hrProbability - row.impliedProbability) * 100;
  if (!Number.isFinite(edge)) return null;
  return `${edge >= 0 ? '+' : ''}${edge.toFixed(1)} pts`;
}

function hasMarketData(row: HrWatchRow): boolean {
  const label = row.oddsLabel?.trim().toLowerCase() ?? '';
  const placeholder = ['', '-', 'tbd', 'odds tbd', 'odds unavailable', 'unavailable'].includes(label);
  return row.bookOdds != null || row.impliedProbability != null || !placeholder;
}

function gameTimeLabel(value: string | null): string {
  if (!value) return 'Time TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time TBD';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function TeamMark({ team, logoUrl }: { team: string; logoUrl: string | null }) {
  const resolvedLogo = logoUrl || logoByTeamName(team);
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 sm:h-9 sm:w-9">
      {resolvedLogo && !imageFailed ? (
        <img src={resolvedLogo} alt="" className="h-6 w-6 object-contain sm:h-7 sm:w-7" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
      ) : (
        <span className="font-mono text-[8px] font-black text-white/65">{team.slice(0, 3).toUpperCase()}</span>
      )}
    </div>
  );
}

function TierBadge({ tier, muted = false }: { tier: HrTableTier; muted?: boolean }) {
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.1em] ${TIER_STYLES[tier]} ${muted ? 'opacity-35' : ''}`}>
      {tier}
    </span>
  );
}

function TruthLabel({ row }: { row: HrWatchRow }) {
  const label = row.truthStatus === 'official'
    ? 'Confirmed'
    : row.truthStatus === 'projected'
      ? 'Projected'
      : row.truthStatus === 'blocked'
        ? 'Blocked'
        : 'Unverified';
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.06em] ${TRUTH_STYLES[row.truthStatus]}`}>
      {row.truthStatus === 'official' ? <ShieldCheck className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
      {label}
    </span>
  );
}

function DataStatus({ row }: { row: HrWatchRow }) {
  const confidence = row.dataConfidence == null || !Number.isFinite(row.dataConfidence)
    ? null
    : Math.round(row.dataConfidence);
  return (
    <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.06em] ${confidence == null ? 'text-white/55' : confidence >= 75 ? 'text-[#75ffc5]/80' : 'text-amber-200/85'}`}>
      {confidence == null ? 'Data unavailable' : `Data ${confidence}%`}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="border border-white/[0.07] bg-black/20 px-2.5 py-2">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">{label}</p>
      <p className="mt-1 font-mono text-sm font-black tabular-nums text-white/85">{numberLabel(value)}</p>
    </div>
  );
}

function Score({ value }: { value: number }) {
  return (
    <div title="Composite matchup score. Not an estimated home-run probability.">
      <p className="font-mono text-base font-black leading-none tabular-nums text-[#00f0ff] sm:text-lg">
        {Math.round(value)}<span className="text-[10px] text-[#00f0ff]/55">/100</span>
      </p>
      <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-white/45">Signal score</p>
    </div>
  );
}

function ExpandedDetails({ row, freshness, generatedAt, showMarket }: {
  row: HrWatchRow;
  freshness: HrBoardFreshness;
  generatedAt: Date | null;
  showMarket: boolean;
}) {
  const brief = buildHrDecisionBrief(row, freshness, generatedAt);
  const marketEdge = marketEdgeLabel(row);
  return (
    <div className="grid gap-3 border-t border-[#00f0ff]/15 bg-[#00f0ff]/[0.025] p-3 sm:p-4 xl:grid-cols-[1fr_300px]">
      <div>
        <p className="mb-2 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#00f0ff]/75">Signal inputs</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Metric label="Power" value={row.hitterPower} />
          <Metric label="Pitcher vulnerability" value={row.pitcherVulnerability} />
          <Metric label="Park" value={row.parkFactor} />
          <Metric label="Form" value={row.recentForm} />
          <Metric label="Data confidence" value={row.dataConfidence} />
        </div>
      </div>
      <div className="space-y-2 border border-white/[0.09] bg-black/20 p-3 text-[11px] leading-5 text-white/68">
        <p><span className="font-mono text-[9px] font-black uppercase text-white/45">Freshness</span><br />{brief.freshnessLabel}</p>
        <p><span className="font-mono text-[9px] font-black uppercase text-white/45">Lineup</span><br />{brief.lineupLabel}</p>
        {showMarket ? (
          <p>
            <span className="font-mono text-[9px] font-black uppercase text-white/45">Market context</span><br />
            {row.oddsLabel || 'Odds available'} / Model {probabilityLabel(row.hrProbability)} / Book {probabilityLabel(row.impliedProbability)}
            {marketEdge ? ` / ${marketEdge} model edge` : ''}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface TargetProps {
  row: HrWatchRow;
  onSelect: (row: HrWatchRow) => void;
  onAddToSlip?: (row: HrWatchRow) => void;
  onTogglePlayerVouch?: (row: HrWatchRow) => void;
  vouchInfo?: { totalVouches: number; viewerHasVouched: boolean } | null;
  isVouchPending?: boolean;
  freshness: HrBoardFreshness;
  generatedAt: Date | null;
  expanded: boolean;
  onToggle: () => void;
  showMarket: boolean;
}

function MobileTarget({ row, onSelect, onAddToSlip, onTogglePlayerVouch, vouchInfo, isVouchPending, freshness, generatedAt, expanded, onToggle, showMarket }: TargetProps) {
  const tier = getHrTableTier(row) ?? 'Sleeper';
  const brief = buildHrDecisionBrief(row, freshness, generatedAt, Boolean(onAddToSlip));
  const reason = getHrTableReason(row);

  return (
    <Fragment>
      <tr className={`border-t border-white/[0.12] transition ${expanded ? 'bg-[#00f0ff]/[0.08] shadow-[inset_2px_0_0_rgba(0,240,255,.6)]' : 'bg-black/20 odd:bg-white/[0.02]'}`}>

        {/* Player Column */}
        <td className="p-2 align-middle">
          <div className="flex items-center gap-2 min-w-0">
            <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-white">{row.playerName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[9px] font-bold text-slate-400">{row.team}</span>
                <TruthLabel row={row} />
              </div>
            </div>
          </div>
        </td>

        {/* Score Column */}
        <td className="p-2 align-middle font-mono">
          <div className="flex flex-col items-start gap-0.5">
            <Score value={row.hrScore} />
            <TierBadge tier={tier} />
          </div>
        </td>

        {/* Matchup Column */}
        <td className="p-2 align-middle font-mono">
          <p className="truncate text-[11px] font-bold text-slate-200">vs {brief.pitcherLabel}</p>
          <p className="text-[9px] text-slate-400">Vuln {numberLabel(row.pitcherVulnerability)}</p>
        </td>

        {/* Actions Column */}
        <td className="p-2 align-middle">
          <div className="flex items-center gap-1 justify-end">
            <button
              type="button"
              onClick={() => onTogglePlayerVouch?.(row)}
              disabled={!onTogglePlayerVouch || isVouchPending}
              title="Vouch for player"
              className={`flex h-7 items-center gap-1 rounded-md border px-1.5 font-mono text-[10px] font-bold transition ${
                vouchInfo?.viewerHasVouched
                  ? 'border-vouch-emerald/50 bg-vouch-emerald/20 text-vouch-emerald shadow-[0_0_8px_rgba(0,255,148,0.2)]'
                  : 'border-white/15 bg-black/40 text-slate-300'
              } disabled:opacity-40`}
            >
              <Heart className={`h-3 w-3 text-vouch-emerald ${vouchInfo?.viewerHasVouched ? 'fill-current' : ''}`} />
              <span>{vouchInfo?.totalVouches ?? 0}</span>
            </button>

            <button
              type="button"
              onClick={() => onAddToSlip?.(row)}
              disabled={!brief.canAddToSlip}
              title="Add to slip"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-vouch-emerald/40 bg-vouch-emerald/15 text-vouch-emerald disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggle}
              aria-label="Toggle details"
              className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${
                expanded ? 'border-vouch-cyan bg-vouch-cyan/20 text-vouch-cyan' : 'border-white/15 bg-black/40 text-slate-300'
              }`}
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Table Row Drawer */}
      {expanded && (
        <tr className="border-b border-vouch-cyan/30 bg-[#071322]/95">
          <td colSpan={4} className="p-3 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Primary Catalysts & Risks:</span>
              <button
                type="button"
                onClick={() => onSelect(row)}
                className="flex items-center gap-1 text-[10px] font-bold text-vouch-cyan hover:underline"
              >
                Full Research Dossier <Search className="h-3 w-3" />
              </button>
            </div>

            <p className="text-slate-200 border-l-2 border-vouch-emerald pl-2 text-[11px] leading-snug">{reason}</p>

            <div className="pt-1">
              <ExpandedDetails row={row} freshness={freshness} generatedAt={generatedAt} showMarket={showMarket} />
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function DesktopTarget({ row, onSelect, onAddToSlip, onTogglePlayerVouch, vouchInfo, isVouchPending, freshness, generatedAt, expanded, onToggle, showMarket }: TargetProps) {
  const tier = getHrTableTier(row) ?? 'Sleeper';
  const brief = buildHrDecisionBrief(row, freshness, generatedAt, Boolean(onAddToSlip));
  const reason = getHrTableReason(row);
  const risk = getHrTableRisk(row);
  const columnCount = showMarket ? 8 : 7;

  return (
    <Fragment>
      <tr className={`group border-t border-white/[0.16] transition ${expanded ? 'bg-[#00f0ff]/[0.06] shadow-[inset_3px_0_0_rgba(0,240,255,.58)]' : 'bg-black/[0.08] odd:bg-white/[0.018] hover:bg-[#00f0ff]/[0.045]'}`}>
        <td className="px-3 py-3.5 align-top">
          <div className="flex items-center gap-2.5">
            <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={42} />
            <div className="min-w-0">
              <p className="whitespace-normal text-[13px] font-black leading-5 text-white">{row.playerName}</p>
              <p className="mt-0.5 font-mono text-[10px] font-black text-white/65">{row.team}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3.5 align-top"><div className="flex flex-col items-start gap-2"><Score value={row.hrScore} /><TierBadge tier={tier} /></div></td>
        <td className="px-3 py-3.5 align-top">
          <p className="text-[12px] font-bold leading-5 text-white/80">vs {brief.pitcherLabel}</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-white/58">Pitcher vulnerability {numberLabel(row.pitcherVulnerability)}</p>
        </td>
        {showMarket ? (
          <td className="px-3 py-3.5 align-top font-mono">
            <p className="text-[12px] font-black text-white/80">{row.oddsLabel}</p>
            <p className="mt-1 text-[9px] leading-4 text-white/45">Book {probabilityLabel(row.impliedProbability)}</p>
          </td>
        ) : null}
        <td className="px-3 py-3.5 align-top">
          <p className="text-[12px] font-semibold leading-5 text-white/80">{reason}</p>
        </td>
        <td className="px-3 py-3.5 align-top">
          <p className="text-[12px] leading-5 text-amber-100/78">{risk}</p>
        </td>
        <td className="px-3 py-3.5 align-top">
          <div className="flex flex-col items-start gap-2"><TruthLabel row={row} /><DataStatus row={row} /></div>
        </td>
        <td className="px-3 py-3.5 align-top">
          <div className="flex min-w-[190px] flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => onSelect(row)} className="flex min-h-8 items-center gap-1 border border-[#00f0ff]/30 bg-[#00f0ff]/[0.07] px-2 text-[9px] font-black uppercase tracking-wide text-[#00f0ff] transition hover:border-[#00f0ff]/60">
              <Search className="h-3 w-3" /> Research
            </button>
            <button
              type="button"
              onClick={() => onTogglePlayerVouch?.(row)}
              disabled={!onTogglePlayerVouch || isVouchPending}
              title="Vouch for this player"
              className={`flex min-h-8 items-center gap-1 border px-2 font-mono text-[9px] font-bold transition ${
                vouchInfo?.viewerHasVouched
                  ? 'border-vouch-emerald/50 bg-vouch-emerald/20 text-vouch-emerald shadow-[0_0_8px_rgba(0,255,148,0.2)]'
                  : 'border-white/15 bg-black/30 text-white/70 hover:border-vouch-emerald/40 hover:text-white'
              } disabled:opacity-40`}
            >
              <Heart className={`h-3 w-3 ${vouchInfo?.viewerHasVouched ? 'fill-current' : ''}`} />
              <span>{vouchInfo?.totalVouches ?? 0}</span>
            </button>
            <button
              type="button"
              onClick={() => onAddToSlip?.(row)}
              disabled={!brief.canAddToSlip}
              title={brief.addToSlipBlockReason ?? 'Add player to slip'}
              className="flex min-h-8 items-center gap-1 border border-[#00ff94]/30 bg-[#00ff94]/[0.07] px-2 text-[9px] font-black uppercase tracking-wide text-[#75ffc5] transition hover:border-[#00ff94]/60 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Plus className="h-3 w-3" /> Slip
            </button>
            <button type="button" onClick={onToggle} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(); } }} aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Show'} details for ${row.playerName}`} title={`${expanded ? 'Hide' : 'Show'} details`} className={`flex h-8 w-8 items-center justify-center border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]/70 ${expanded ? 'border-[#00f0ff]/45 bg-[#00f0ff]/10 text-[#00f0ff]' : 'border-white/14 bg-black/25 text-white/62 hover:border-white/30 hover:text-white'}`}>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t border-[#00f0ff]/10">
          <td colSpan={columnCount} className="p-0"><ExpandedDetails row={row} freshness={freshness} generatedAt={generatedAt} showMarket={showMarket} /></td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export function HrSpreadsheet({
  rows,
  onSelectPlayer,
  onAddToSlip,
  onTogglePlayerVouch,
  playerVouchMap,
  pendingPlayerVouchId,
  freshness,
  generatedAt,
}: HrSpreadsheetProps) {
  const groups = buildHrMatchupGroups(rows);
  const [selectedGameKey, setSelectedGameKey] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set());
  const matchupRailRef = useRef<HTMLDivElement | null>(null);
  const selectedGameIndex = groups.findIndex((group) => group.key === selectedGameKey);
  const activeGameKey = selectedGameIndex >= 0 ? selectedGameKey : 'all';
  const activeGroup = selectedGameIndex >= 0 ? groups[selectedGameIndex] : null;
  const visibleGroups = activeGroup ? [activeGroup] : groups;
  const showMarket = rows.some(hasMarketData);
  const previousGroup = groups.length > 0
    ? groups[selectedGameIndex >= 0 ? (selectedGameIndex - 1 + groups.length) % groups.length : groups.length - 1]
    : null;
  const nextGroup = groups.length > 0
    ? groups[selectedGameIndex >= 0 ? (selectedGameIndex + 1) % groups.length : 0]
    : null;

  useEffect(() => {
    if (activeGameKey === 'all') return;
    const rail = matchupRailRef.current;
    const target = rail?.querySelector<HTMLElement>(`[data-matchup-key="${activeGameKey}"]`);
    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeGameKey]);

  const toggleExpanded = (stableId: string) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(stableId)) next.delete(stableId);
      else next.add(stableId);
      return next;
    });
  };

  const selectAdjacentGame = (direction: -1 | 1) => {
    if (groups.length === 0) return;
    if (selectedGameIndex < 0) {
      setSelectedGameKey(direction > 0 ? groups[0].key : groups[groups.length - 1].key);
      return;
    }
    const nextIndex = (selectedGameIndex + direction + groups.length) % groups.length;
    setSelectedGameKey(groups[nextIndex].key);
  };

  if (groups.length === 0) {
    return <div className="flex items-center justify-center border border-white/10 bg-black/25 py-16 text-sm text-white/50">No players match the current filters.</div>;
  }

  return (
    <section id="hr-matchup-table" className="scroll-mt-24 space-y-2.5" aria-label="Home run targets grouped by matchup">
      <div className="flex flex-col gap-1.5 border border-white/12 bg-black/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#00ff94]">Advanced matchup table</p>
          <p className="mt-0.5 text-[12px] text-white/65">Compare signals quickly. Expand a player for the underlying inputs.</p>
        </div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white/60">{groups.length} game{groups.length === 1 ? '' : 's'} / {rows.length} players</p>
      </div>

      {!showMarket ? (
        <div className="flex items-center gap-2 border border-amber-300/18 bg-amber-300/[0.045] px-3 py-1.5 text-[11px] text-amber-100/75">
          <CircleAlert className="h-3.5 w-3.5 shrink-0 text-amber-200/65" />
          Market odds unavailable for this preview slate. The empty market column is hidden.
        </div>
      ) : null}

      {groups.length > 1 ? (
        <section className="border border-white/[0.11] bg-black/30" aria-label="Choose a matchup">
          <div className="grid gap-2 border-b border-white/[0.09] p-2.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-white/55">
                  Matchup navigator
                </p>
                <span className="border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.08em] text-white/45">
                  {activeGroup ? `Game ${selectedGameIndex + 1} of ${groups.length}` : `${groups.length} games`}
                </span>
              </div>

              {activeGroup ? (
                <div className="mt-2 flex min-w-0 items-center gap-3">
                  <div className="flex -space-x-2">
                    <TeamMark team={activeGroup.primaryTeam} logoUrl={activeGroup.primaryLogoUrl} />
                    <TeamMark team={activeGroup.opponent} logoUrl={activeGroup.opponentLogoUrl} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-black tracking-tight text-white">
                      {activeGroup.primaryTeam}
                      <span className="mx-1.5 font-mono text-[9px] text-white/35">VS</span>
                      {activeGroup.opponent}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.05em] text-white/48">
                      {gameTimeLabel(activeGroup.gameTime)}
                      {activeGroup.venue ? ` / ${activeGroup.venue}` : ''}
                      {` / ${activeGroup.rows.length} players`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-[14px] font-black text-white">All slate matchups</p>
                  <p className="mt-0.5 text-[10px] text-white/50">
                    Select a game card to isolate one matchup.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => selectAdjacentGame(-1)}
                aria-label={previousGroup ? `Previous matchup: ${previousGroup.primaryTeam} vs ${previousGroup.opponent}` : 'Previous matchup'}
                className="group flex min-h-10 min-w-0 items-center gap-2 border border-white/12 bg-black/30 px-2.5 text-left transition hover:border-[#00f0ff]/35 hover:bg-[#00f0ff]/[0.05]"
              >
                <ChevronLeft className="h-4 w-4 shrink-0 text-white/45 group-hover:text-[#00f0ff]" />
                <span className="min-w-0">
                  <span className="block font-mono text-[7px] font-black uppercase tracking-[0.08em] text-white/35">Previous</span>
                  <span className="block truncate text-[10px] font-black text-white/72">
                    {previousGroup ? `${previousGroup.primaryTeam} vs ${previousGroup.opponent}` : 'Matchup'}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectAdjacentGame(1)}
                aria-label={nextGroup ? `Next matchup: ${nextGroup.primaryTeam} vs ${nextGroup.opponent}` : 'Next matchup'}
                className="group flex min-h-10 min-w-0 items-center justify-end gap-2 border border-white/12 bg-black/30 px-2.5 text-right transition hover:border-[#00f0ff]/35 hover:bg-[#00f0ff]/[0.05]"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[7px] font-black uppercase tracking-[0.08em] text-white/35">Next</span>
                  <span className="block truncate text-[10px] font-black text-white/72">
                    {nextGroup ? `${nextGroup.primaryTeam} vs ${nextGroup.opponent}` : 'Matchup'}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/45 group-hover:text-[#00f0ff]" />
              </button>
            </div>
          </div>

          <div
            ref={matchupRailRef}
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto p-2 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Team versus team matchups"
          >
            <button
              type="button"
              data-matchup-key="all"
              onClick={() => setSelectedGameKey('all')}
              aria-pressed={activeGameKey === 'all'}
              aria-current={activeGameKey === 'all' ? 'true' : undefined}
              className={`min-h-[76px] min-w-[136px] snap-center border px-3 py-2 text-left transition ${
                activeGameKey === 'all'
                  ? 'border-[#00ff94]/45 bg-[#00ff94]/10 shadow-[inset_0_-3px_#00ff94,0_0_24px_rgba(0,255,148,.08)]'
                  : 'border-white/12 bg-black/25 hover:border-white/24'
              }`}
            >
              <p className={`font-mono text-[8px] font-black uppercase tracking-[0.1em] ${activeGameKey === 'all' ? 'text-[#75ffc5]' : 'text-white/45'}`}>
                All slate
              </p>
              <p className="mt-1 text-base font-black tabular-nums text-white">{groups.length} games</p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.05em] text-white/38">{rows.length} players</p>
            </button>

            {groups.map((group, index) => {
              const selected = activeGameKey === group.key;
              return (
                <button
                  key={group.key}
                  type="button"
                  data-matchup-key={group.key}
                  onClick={() => setSelectedGameKey(group.key)}
                  aria-label={`Show ${group.primaryTeam} vs ${group.opponent}`}
                  aria-pressed={selected}
                  aria-current={selected ? 'true' : undefined}
                  className={`min-h-[76px] snap-center border px-3 py-2 text-left transition ${
                    selected
                      ? 'min-w-[240px] border-[#00f0ff]/55 bg-[#00f0ff]/[0.1] shadow-[inset_0_-3px_#00f0ff,0_0_28px_rgba(0,240,255,.1)]'
                      : 'min-w-[198px] border-white/12 bg-black/25 hover:border-white/24 hover:bg-white/[0.035]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-1.5">
                      <TeamMark team={group.primaryTeam} logoUrl={group.primaryLogoUrl} />
                      <TeamMark team={group.opponent} logoUrl={group.opponentLogoUrl} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-[13px] font-black ${selected ? 'text-white' : 'text-white/78'}`}>
                          {group.primaryTeam}
                          <span className="mx-1 font-mono text-[8px] text-white/35">VS</span>
                          {group.opponent}
                        </p>
                        <span className="shrink-0 font-mono text-[7px] font-black uppercase tracking-[0.08em] text-white/30">
                          {index + 1}/{groups.length}
                        </span>
                      </div>

                      <p className="mt-1 truncate font-mono text-[8px] uppercase tracking-[0.05em] text-white/45">
                        {gameTimeLabel(group.gameTime)}
                        {group.venue ? ` / ${group.venue}` : ''}
                      </p>

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="font-mono text-[8px] font-black uppercase tracking-[0.05em] text-[#75ffc5]/75">
                          {group.rows.length} players
                        </span>
                        {selected ? (
                          <span className="border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-1.5 py-0.5 font-mono text-[7px] font-black uppercase tracking-[0.08em] text-[#00f0ff]">
                            Active
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {visibleGroups.map((group) => (
        <article key={group.key} className="overflow-hidden border border-white/12 bg-[hsl(var(--ve-bg-panel)/0.88)] shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
          <header className="relative overflow-hidden border-b border-white/[0.14] bg-[linear-gradient(105deg,rgba(0,255,148,0.065),rgba(0,0,0,0.22)_48%,rgba(0,240,255,0.055))] px-3 py-2.5 sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex -space-x-1.5"><TeamMark team={group.primaryTeam} logoUrl={group.primaryLogoUrl} /><TeamMark team={group.opponent} logoUrl={group.opponentLogoUrl} /></div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-black tracking-tight text-white sm:text-base">{group.primaryTeam} <span className="font-mono text-[9px] text-white/38">VS</span> {group.opponent}</h3>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-white/48">{gameTimeLabel(group.gameTime)}{group.venue ? ` / ${group.venue}` : ''}</p>
                </div>
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                {HR_TABLE_TIERS.map((tier) => (
                  <span key={tier} className={`border px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.06em] ${TIER_STYLES[tier]} ${group.tierCounts[tier] === 0 ? 'opacity-30' : ''}`}>{tier} {group.tierCounts[tier]}</span>
                ))}
              </div>
              <span className="shrink-0 font-mono text-[9px] font-black uppercase tracking-[0.06em] text-white/45 sm:hidden">{group.rows.length} players</span>
            </div>
            {group.lineupNotice ? (
              <div className="mt-2 flex items-center gap-1.5 border-t border-amber-300/15 pt-2 font-mono text-[9px] font-bold uppercase tracking-[0.05em] text-amber-100/75">
                <Clock3 className="h-3 w-3 shrink-0 text-amber-200" />
                {group.lineupNotice}
              </div>
            ) : null}
          </header>

          {/* Smart Mobile Table View */}
          <div className="overflow-x-auto lg:hidden">
            <table className="w-full min-w-[360px] border-collapse text-left">
              <thead className="sticky top-0 z-20 border-b border-white/18 bg-[#080d14]/95 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 backdrop-blur">
                <tr>
                  <th className="p-2">Player</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Matchup</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <MobileTarget
                    key={row.stableId}
                    row={row}
                    onSelect={onSelectPlayer}
                    onAddToSlip={onAddToSlip}
                    onTogglePlayerVouch={onTogglePlayerVouch}
                    vouchInfo={playerVouchMap?.get(String(row.playerId))}
                    isVouchPending={pendingPlayerVouchId != null && String(row.playerId) === pendingPlayerVouchId}
                    freshness={freshness}
                    generatedAt={generatedAt}
                    expanded={expandedRows.has(row.stableId)}
                    onToggle={() => toggleExpanded(row.stableId)}
                    showMarket={showMarket}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1160px] border-collapse text-left">
              <colgroup>
                <col className="w-[19%]" /><col className="w-[9%]" /><col className="w-[16%]" />
                {showMarket ? <col className="w-[9%]" /> : null}
                <col className="w-[18%]" /><col className="w-[16%]" /><col className="w-[10%]" /><col className="w-[210px]" />
              </colgroup>
              <thead className="sticky top-0 z-20 border-b border-white/18 bg-[#080d14]/95 font-mono text-[9px] font-black uppercase tracking-[0.1em] text-white/62 shadow-[0_3px_10px_rgba(0,0,0,.35)] backdrop-blur">
                <tr>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2"><span title="Composite matchup score. Not an estimated home-run probability.">Signal score</span></th>
                  <th className="px-3 py-2">Matchup</th>
                  {showMarket ? <th className="px-3 py-2">Market</th> : null}
                  <th className="px-3 py-2">Main reason</th>
                  <th className="px-3 py-2">Main risk</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <DesktopTarget
                    key={row.stableId}
                    row={row}
                    onSelect={onSelectPlayer}
                    onAddToSlip={onAddToSlip}
                    onTogglePlayerVouch={onTogglePlayerVouch}
                    vouchInfo={playerVouchMap?.get(String(row.playerId))}
                    isVouchPending={pendingPlayerVouchId != null && String(row.playerId) === pendingPlayerVouchId}
                    freshness={freshness}
                    generatedAt={generatedAt}
                    expanded={expandedRows.has(row.stableId)}
                    onToggle={() => toggleExpanded(row.stableId)}
                    showMarket={showMarket}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}

      <div className="flex items-start gap-2 border border-white/[0.11] bg-black/25 px-3 py-2 text-[10px] leading-4 text-white/60">
        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200/65" />
        <p>Tier labels reflect the current signal score. A zero count means no player qualified for that tier. Projected and unavailable inputs remain clearly labeled.</p>
      </div>
    </section>
  );
}
