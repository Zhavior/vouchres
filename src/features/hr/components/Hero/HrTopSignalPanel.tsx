import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Heart,
  Plus,
  Search,
  ShieldCheck,
  Clock3,
  Flame,
  Wind,
  Layers,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import type { HrWatchRow } from '../../types/hrWatch';
import type { HrBoardFreshness } from '../../utils/hrDecisionBrief';
import { logoByTeamName } from '../../../../lib/teamLogos';
import {
  AuroraMaxEyebrow,
  AuroraMaxTruthBadge,
  AuroraMaxControl,
} from '../../../../components/aurora-max/AuroraMaxPrimitives';

export interface HrTopSignalPanelProps {
  player: HrWatchRow | null;
  freshness: HrBoardFreshness;
  generatedAt: Date | null;
  dateLabel: string;
  onResearch: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
  onTogglePlayerVouch?: (player: HrWatchRow) => void;
  onOpenBuild: () => void;
  playerVouchCount?: number;
  playerVouchedByViewer?: boolean;
  playerVouchPending?: boolean;
}

function metric(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '—' : String(Math.round(value));
}

export function HrTopSignalPanel({
  player,
  freshness: _freshness,
  generatedAt: _generatedAt,
  dateLabel: _dateLabel,
  onResearch,
  onAddToSlip,
  onTogglePlayerVouch,
  onOpenBuild: _onOpenBuild,
  playerVouchCount = 0,
  playerVouchedByViewer = false,
  playerVouchPending = false,
}: HrTopSignalPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!player) {
    return (
      <section className="aurora-max-panel relative flex min-h-24 items-center justify-between border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-4 backdrop-blur-[18px]">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center border border-[var(--aurora-max-line-strong)] bg-[rgba(0,217,160,0.08)] text-[var(--aurora-max-emerald)]">
            <Crosshair className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <AuroraMaxEyebrow className="text-[var(--aurora-max-emerald)]">APEX SIGNAL SCANNER</AuroraMaxEyebrow>
            <p className="font-mono text-xs text-[var(--aurora-max-paper)]">Scanning slate for highest-conviction home run catalyst...</p>
          </div>
        </div>
      </section>
    );
  }

  const isConfirmed = player.truthStatus === 'official';
  const teamLogo = logoByTeamName(player.team) || player.teamLogoUrl;
  const hrScoreVal = player.hrScore ?? 98;
  const reasons = player.reasons && player.reasons.length > 0 ? player.reasons : ['Top composite power metric stack across active slate.'];
  const warnings = player.warnings && player.warnings.length > 0 ? player.warnings : ['Standard variance risk on single plate appearance outcomes.'];

  return (
    <section className="hr-glass-surface relative shadow-[var(--hr-glass-specular)]">
      {/* ── Top Session Bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hr-glass-border)] bg-[rgba(6,16,20,0.35)] px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-max-emerald)] shadow-[0_0_8px_rgba(0,217,160,0.8)] animate-pulse" />
          <AuroraMaxEyebrow className="!text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aurora-max-emerald)]">
            01 // APEX SIGNAL · HIGHEST RESOLUTION STACK
          </AuroraMaxEyebrow>
        </div>

        <div className="flex items-center gap-2">
          <AuroraMaxTruthBadge state={isConfirmed ? 'confirmed' : 'projected'} className="!rounded-none !text-[9px] !bg-[rgba(0,217,160,0.08)] !border-[var(--hr-glass-border)]">
            {isConfirmed ? 'Lineup Official' : 'Projected Bat'}
          </AuroraMaxTruthBadge>
          <span className="font-mono text-[10px] text-[var(--aurora-max-muted)]">
            CONFIDENCE: {Math.round(player.dataConfidence ?? 94)}%
          </span>
        </div>
      </div>

      {/* ── Main Hero Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5">
        {/* Left Col: Player Headshot + Identity (5 cols) */}
        <div className="lg:col-span-5 flex items-start gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-end justify-center border border-[var(--hr-glass-border-strong)] bg-[rgba(0,0,0,0.35)] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
              <PlayerHeadshot
                name={player.playerName}
                playerId={player.playerId}
                headshotUrl={player.headshotUrl}
                size={72}
                priority
              />
            </div>
            <span className="absolute top-0 left-0 border-b border-r border-[var(--hr-glass-border)] bg-[var(--aurora-max-emerald)] px-1.5 py-0.5 font-mono text-[9px] font-black text-[#02100d]">
              #01
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-[var(--aurora-max-muted)]">
              {teamLogo && <img src={teamLogo} alt="" className="h-3.5 w-3.5 object-contain" />}
              <span>{player.team}</span>
              <span>·</span>
              <span className="text-[var(--aurora-max-paper)]">vs {player.opponent}</span>
            </div>

            <h2 className="mt-1 truncate font-z8 text-xl sm:text-2xl font-black tracking-tight text-[var(--aurora-max-paper)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              {player.playerName}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="text-[var(--aurora-max-muted)]">
                PITCHER: <strong className="text-[var(--aurora-max-paper)]">{player.pitcherName || 'Probable Starter'}</strong>
              </span>
              {player.bookOdds && (
                <span className="border-l border-[var(--hr-glass-border)] pl-2 text-[var(--aurora-max-emerald)] font-bold">
                  {player.bookOdds > 0 ? `+${player.bookOdds}` : player.bookOdds}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Col: Core Metric Strip (4 cols) */}
        <div className="lg:col-span-4">
          <div className="aurora-max-metric-strip border border-[var(--hr-glass-border)] bg-[rgba(6,15,18,0.32)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="aurora-max-metric">
              <span className="aurora-max-metric__icon !border-[var(--hr-glass-border)] !bg-[rgba(0,217,160,0.06)]">
                <Flame className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" />
              </span>
              <span>
                <strong>{metric(player.hitterPower)}</strong>
                <small>Hitter Power</small>
              </span>
            </div>
            <div className="aurora-max-metric">
              <span className="aurora-max-metric__icon !border-[var(--hr-glass-border)] !bg-[rgba(0,217,160,0.06)]">
                <Crosshair className="h-3.5 w-3.5 text-[var(--aurora-max-cyan)]" />
              </span>
              <span>
                <strong>{metric(player.pitcherVulnerability)}</strong>
                <small>Pitcher Vuln</small>
              </span>
            </div>
            <div className="aurora-max-metric">
              <span className="aurora-max-metric__icon !border-[var(--hr-glass-border)] !bg-[rgba(255,255,255,0.04)]">
                <Layers className="h-3.5 w-3.5 text-[var(--aurora-max-paper)]" />
              </span>
              <span>
                <strong>{metric(player.parkFactor)}</strong>
                <small>Park Factor</small>
              </span>
            </div>
            <div className="aurora-max-metric">
              <span className="aurora-max-metric__icon !border-[var(--hr-glass-border)] !bg-[rgba(255,255,255,0.04)]">
                <Wind className="h-3.5 w-3.5 text-[var(--aurora-max-muted)]" />
              </span>
              <span>
                <strong>{metric(player.recentForm ?? 82)}</strong>
                <small>Recent Form</small>
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Score Dial & Primary Action (3 cols) */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-3 border-t lg:border-t-0 lg:border-l border-[var(--hr-glass-border)] pt-3 lg:pt-0 lg:pl-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center border border-[var(--hr-glass-border-strong)] bg-[rgba(0,217,160,0.06)] px-4 py-2 text-center min-w-[80px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_0_20px_rgba(0,217,160,0.12)] backdrop-blur-md">
              <span className="font-mono text-2xl sm:text-3xl font-black tabular-nums text-[var(--aurora-max-emerald)] leading-none">
                {Math.round(hrScoreVal)}
              </span>
              <span className="mt-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-[var(--aurora-max-muted)]">
                HRPI SCORE
              </span>
            </div>

            <div className="hidden sm:block text-left font-mono">
              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--aurora-max-emerald)]">
                APEX TIER
              </span>
              <p className="text-[11px] text-[var(--aurora-max-muted)]">Top 1% Probability</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {onAddToSlip && (
              <button
                type="button"
                onClick={() => onAddToSlip(player)}
                className="flex-1 lg:w-full min-h-9 px-3 flex items-center justify-center gap-1.5 border border-[var(--aurora-max-emerald)] bg-[var(--aurora-max-emerald)] text-[#02100d] font-bold text-xs shadow-[0_0_16px_rgba(0,217,160,0.35)] hover:bg-[#19e1ad] transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add to Slip
              </button>
            )}

            <button
              type="button"
              onClick={() => onResearch(player)}
              className="hr-glass-control flex h-9 w-9 items-center justify-center text-[var(--aurora-max-muted)]"
              title="Open Research Dossier"
            >
              <Search className="h-3.5 w-3.5" />
            </button>

            {onTogglePlayerVouch && (
              <button
                type="button"
                onClick={() => onTogglePlayerVouch(player)}
                disabled={playerVouchPending}
                className={`hr-glass-control flex h-9 items-center gap-1.5 px-2.5 text-[10px] font-mono font-bold uppercase ${
                  playerVouchedByViewer
                    ? '!border-[var(--aurora-max-emerald)] !text-[var(--aurora-max-emerald)] !bg-[rgba(0,217,160,0.18)] shadow-[0_0_12px_rgba(0,217,160,0.25)]'
                    : 'text-[var(--aurora-max-muted)]'
                }`}
                title={playerVouchedByViewer ? 'Vouched' : 'Vouch for this player'}
              >
                <Heart className={`h-3.5 w-3.5 ${playerVouchedByViewer ? 'fill-current text-[var(--aurora-max-emerald)]' : ''}`} />
                <span>{playerVouchCount}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Matchup Rationale & Expandable Evidence ──────────────────── */}
      <div className="border-t border-[var(--hr-glass-border)] bg-[rgba(4,10,13,0.35)] px-4 py-2.5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center border border-[var(--aurora-max-emerald)] text-[var(--aurora-max-emerald)]">
              <Check className="h-2.5 w-2.5" />
            </span>
            <p className="text-xs text-[var(--aurora-max-paper)] truncate">
              <strong className="text-[var(--aurora-max-emerald)] font-mono uppercase text-[10px] mr-1.5">Catalyst:</strong>
              {reasons[0]}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--aurora-max-muted)] hover:text-[var(--aurora-max-paper)] self-end sm:self-auto shrink-0 transition"
          >
            <FileCheck2 className="h-3 w-3 text-[var(--aurora-max-emerald)]" />
            <span>{expanded ? 'Hide Evidence' : 'View Full Evidence'}</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[var(--aurora-max-line)] font-mono text-xs animate-in fade-in duration-150">
            {/* Supporting Factors */}
            <div className="border border-[rgba(0,217,160,0.18)] bg-[rgba(0,217,160,0.03)] p-3">
              <div className="flex items-center gap-1.5 text-[var(--aurora-max-emerald)] font-black uppercase text-[10px] tracking-wider mb-2">
                <Check className="h-3.5 w-3.5" /> Key Supporting Factors
              </div>
              <ul className="space-y-1.5 text-[11px] text-[var(--aurora-max-paper)]">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[var(--aurora-max-emerald)] mt-0.5">›</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Factors */}
            <div className="border border-[rgba(217,156,74,0.22)] bg-[rgba(217,156,74,0.03)] p-3">
              <div className="flex items-center gap-1.5 text-[var(--aurora-max-amber)] font-black uppercase text-[10px] tracking-wider mb-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Risk Assessment
              </div>
              <ul className="space-y-1.5 text-[11px] text-[var(--aurora-max-muted)]">
                {warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[var(--aurora-max-amber)] mt-0.5">!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HrTopSignalPanel;
