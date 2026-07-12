/**
 * HrOverviewDossier — editorial player read for drawer + full profile.
 * One hero, one matchup strip, drivers (top 3 layers), form strip, signals.
 * No duplicate arc grids or identical stat chip walls.
 */

import React, { useMemo } from 'react';
import { AlertTriangle, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { HrWatchRow } from '../../types/hrWatch';
import type { RealGameLog } from '../../utils/realGameLogs';
import { logoByTeamName } from '../../../../lib/teamLogos';
import { HrActivityChart, GameLogEmpty, GameLogLoading } from './HrProfileCharts';
import type { RealGameLogState } from '../../hooks/useRealGameLog';

export interface HrOverviewDossierProps {
  player: HrWatchRow;
  formLogs: RealGameLog[];
  logState: RealGameLogState;
  variant?: 'drawer' | 'full';
}

interface DriverRow {
  label: string;
  value: number;
  weight: number;
}

function tierMeta(score: number) {
  if (score >= 97) return { label: 'Elite', tone: 'text-white/90', bar: 'bg-white/70' };
  if (score >= 92) return { label: 'Strong', tone: 'text-slate-200', bar: 'bg-slate-300' };
  if (score >= 85) return { label: 'Watch', tone: 'text-slate-300', bar: 'bg-slate-400/80' };
  if (score >= 75) return { label: 'Sleeper', tone: 'text-slate-400', bar: 'bg-slate-500/70' };
  return { label: 'Fade', tone: 'text-slate-500', bar: 'bg-slate-600/60' };
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function fmtOdds(v: number | null | undefined): string {
  if (v == null) return '—';
  return v > 0 ? `+${v}` : `${v}`;
}

function topDrivers(p: HrWatchRow): DriverRow[] {
  const rows: Array<{ label: string; value: number | null | undefined; weight: number }> = [
    { label: 'Power', value: p.hitterPower, weight: 25 },
    { label: 'Pitcher risk', value: p.pitcherVulnerability, weight: 20 },
    { label: 'Pitch mix', value: p.pitchMix, weight: 15 },
    { label: 'Park', value: p.parkFactor, weight: 10 },
    { label: 'Recent form', value: p.recentForm, weight: 10 },
  ];
  return rows
    .filter((r): r is { label: string; value: number; weight: number } => r.value != null && !Number.isNaN(r.value))
    .sort((a, b) => b.value * b.weight - a.value * a.weight)
    .slice(0, 3);
}

const GamePip: React.FC<{ log: RealGameLog }> = ({ log }) => {
  const hr = log.hrs > 0;
  const hit = !hr && log.hits > 0;
  return (
    <div className="ve-hr-dossier-pip group relative flex flex-col items-center gap-1">
      <span
        className={[
          'block h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-[#0a0e14]',
          hr ? 'bg-amber-400 ring-amber-400/30' : hit ? 'bg-emerald-500/80 ring-emerald-500/25' : 'bg-zinc-600 ring-zinc-600/20',
        ].join(' ')}
      />
      <span className="font-mono text-[7px] uppercase tracking-wide text-white/30">{log.opponentAbbr}</span>
      <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-[var(--ve-hr-tooltip)] px-1.5 py-0.5 font-mono text-[9px] text-white/70 group-hover:block">
        {log.date} · {log.hits}-{log.ab}{log.hrs > 0 ? ` · ${log.hrs} HR` : ''}
      </span>
    </div>
  );
};

export const HrOverviewDossier: React.FC<HrOverviewDossierProps> = ({
  player,
  formLogs,
  logState,
  variant = 'drawer',
}) => {
  const tier = tierMeta(player.hrScore);
  const teamLogo = player.teamLogoUrl || logoByTeamName(player.team);
  const oppLogo = player.opponentLogoUrl || logoByTeamName(player.opponent);
  const drivers = useMemo(() => topDrivers(player), [player]);
  const isOfficial = player.truthStatus === 'official';
  const isProjected = player.truthStatus === 'projected';

  const edge =
    player.hrProbability != null && player.impliedProbability != null
      ? player.hrProbability - player.impliedProbability
      : null;
  const edgePositive = edge != null && edge >= 0.02;
  const edgeNegative = edge != null && edge <= -0.02;

  const formHRs = formLogs.filter((g) => g.hrs > 0).length;

  return (
    <div className={`ve-hr-dossier ve-hr-dossier--${variant}`}>
      {/* Matchup strip — same language as landing cards */}
      <div className="ve-hr-dossier-matchup">
        {teamLogo && (
          <img src={teamLogo} alt="" className="ve-hr-dossier-matchup-watermark" loading="lazy" decoding="async" />
        )}
        <div className="ve-hr-dossier-matchup-inner">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Tonight&apos;s read</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
                {teamLogo && <img src={teamLogo} alt="" className="h-4 w-4 object-contain" />}
                <span className="font-semibold">{player.team}</span>
                <span className="text-white/25">at</span>
                {oppLogo && <img src={oppLogo} alt="" className="h-4 w-4 object-contain" />}
                <span className="font-semibold">{player.opponent}</span>
              </div>
              {player.pitcherName && (
                <p className="mt-1 truncate font-mono text-[11px] text-white/45">vs {player.pitcherName}</p>
              )}
              {player.venue && (
                <p className="mt-0.5 truncate text-[11px] text-white/35">
                  {player.venue}{player.gameTime ? ` · ${player.gameTime}` : ''}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className={`font-mono text-3xl font-black tabular-nums leading-none ${tier.tone}`}>
                {Math.round(player.hrScore)}
              </p>
              <p className="mt-1 inline-block rounded border border-white/12 bg-black/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/55">
                {tier.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Model vs market — single editorial row, not 8 boxes */}
      <div className="ve-hr-dossier-market">
        <div className="ve-hr-dossier-market-col">
          <span className="ve-hr-dossier-kicker">Model</span>
          <span className="ve-hr-dossier-market-value">{fmtPct(player.hrProbability)}</span>
          <span className="ve-hr-dossier-market-sub">HR probability</span>
        </div>
        <div className="ve-hr-dossier-market-divider" aria-hidden="true" />
        <div className="ve-hr-dossier-market-col">
          <span className="ve-hr-dossier-kicker">Book</span>
          <span className="ve-hr-dossier-market-value">{fmtOdds(player.bookOdds)}</span>
          <span className="ve-hr-dossier-market-sub">{fmtPct(player.impliedProbability)} implied</span>
        </div>
        {edge != null && (
          <>
            <div className="ve-hr-dossier-market-divider" aria-hidden="true" />
            <div className="ve-hr-dossier-market-col">
              <span className="ve-hr-dossier-kicker">Edge</span>
              <span
                className={[
                  've-hr-dossier-market-value',
                  edgePositive ? 'text-emerald-400/95' : edgeNegative ? 'text-rose-400/95' : 'text-white/55',
                ].join(' ')}
              >
                {edge >= 0 ? '+' : ''}{(edge * 100).toFixed(1)}%
              </span>
              <span className="ve-hr-dossier-market-sub">model − book</span>
            </div>
          </>
        )}
      </div>

      {/* Lineup truth + confidence — quiet, not another widget grid */}
      <div className="ve-hr-dossier-meta">
        <span
          className={[
            'inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wide',
            isOfficial
              ? 'border-white/12 bg-white/[0.04] text-white/65'
              : isProjected
                ? 'border-amber-500/25 bg-amber-500/8 text-amber-200/80'
                : 'border-white/10 bg-white/[0.03] text-white/45',
          ].join(' ')}
        >
          {isOfficial ? <ShieldCheck className="h-3 w-3" /> : <ShieldQuestion className="h-3 w-3" />}
          {isOfficial ? 'Confirmed lineup' : isProjected ? 'Lineup preview' : 'Unverified'}
        </span>
        {player.dataConfidence != null && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-white/35">Confidence</span>
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${tier.bar} transition-all duration-500`}
                style={{ width: `${Math.max(0, Math.min(100, player.dataConfidence))}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-white/70">
              {Math.round(player.dataConfidence)}
            </span>
          </div>
        )}
      </div>

      {/* Recent form — game pips + whisper chart, not a labeled API panel */}
      <section className="ve-hr-dossier-section">
        <div className="ve-hr-dossier-section-head">
          <h3 className="ve-hr-dossier-section-title">Recent box scores</h3>
          {logState === 'ready' && formLogs.length > 0 && (
            <span className="font-mono text-[10px] tabular-nums text-white/35">
              {formHRs} HR · last {formLogs.length} G
            </span>
          )}
        </div>
        {logState === 'loading' && <GameLogLoading />}
        {logState === 'unavailable' && <GameLogEmpty message="Season log not available yet." />}
        {logState === 'ready' && formLogs.length === 0 && (
          <GameLogEmpty message="No games logged this season." />
        )}
        {logState === 'ready' && formLogs.length > 0 && (
          <div className="ve-hr-dossier-form">
            <div className="flex flex-wrap justify-between gap-2 px-1">
              {formLogs.map((g, i) => (
                <GamePip key={`${g.date}-${i}`} log={g} />
              ))}
            </div>
            <div className="mt-3 opacity-80">
              <HrActivityChart logs={formLogs} height={48} />
            </div>
          </div>
        )}
      </section>

      {/* Top 3 drivers only — overview tease, full breakdown lives on Layers tab */}
      {drivers.length > 0 && (
        <section className="ve-hr-dossier-section">
          <div className="ve-hr-dossier-section-head">
            <h3 className="ve-hr-dossier-section-title">What&apos;s driving the score</h3>
            <span className="text-[10px] text-white/30">Top weighted layers</span>
          </div>
          <div className="space-y-3">
            {drivers.map((d) => (
              <div key={d.label} className="ve-hr-dossier-driver">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium text-white/75">{d.label}</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-white/90">{Math.round(d.value)}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-white/45 transition-all duration-700"
                    style={{ width: `${Math.max(0, Math.min(100, d.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Signals — numbered editorial, no sparkle icons */}
      {(player.reasons?.length ?? 0) > 0 && (
        <section className="ve-hr-dossier-section">
          <h3 className="ve-hr-dossier-section-title mb-3">Why we&apos;re watching</h3>
          <ol className="ve-hr-dossier-signals">
            {player.reasons!.slice(0, variant === 'drawer' ? 4 : 6).map((reason, i) => (
              <li key={i} className="ve-hr-dossier-signal">
                <span className="ve-hr-dossier-signal-num">{i + 1}</span>
                <span className="ve-hr-dossier-signal-text">{reason}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Warnings */}
      {(player.warnings?.length ?? 0) > 0 && (
        <section className="ve-hr-dossier-warnings">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-amber-300/90">
            <AlertTriangle className="h-3.5 w-3.5" />
            Caveats
          </p>
          <ul className="space-y-2">
            {player.warnings!.map((w, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-amber-200/75">
                {w}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
