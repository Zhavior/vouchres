import React from 'react';
import { X, Flame, AlertTriangle, Gavel, ShieldCheck, TrendingUp, MapPin, Lock, BarChart3 } from 'lucide-react';
import type { HrBoardRow } from '../../types/hrBoard';
import { GradeBadge, edgeColor, RISK_COLOR } from './HrBoardRow';

const APPROVAL_COLOR: Record<string, string> = {
  Approved: '#34d399', 'Playable but risky': '#fbbf24', 'Needs more data': '#60a5fa', Avoid: '#f87171',
};

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
      <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">{label}</p>
      <p className="text-sm font-mono font-black mt-0.5" style={{ color: color ?? '#e2e8f0' }}>{value}</p>
    </div>
  );
}

function isProPlayerEdgeUnlocked(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const profile = JSON.parse(localStorage.getItem('vouchedge_profile') || '{}');
    return profile.subscriptionTier === 'GOLD' || profile.subscriptionTier === 'SELLER_PRO';
  } catch {
    return false;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatNumber(value: unknown, fallback = 'N/A') {
  return isFiniteNumber(value) ? String(Math.round(value)) : fallback;
}

function formatDecimal(value: unknown, digits = 3, fallback = 'N/A') {
  return isFiniteNumber(value) ? value.toFixed(digits) : fallback;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function scoreColor(value: number) {
  if (value >= 80) return '#fb923c';
  if (value >= 65) return '#38bdf8';
  if (value >= 50) return '#a78bfa';
  return '#64748b';
}

function GraphBar({ label, value, max = 100, color }: { label: string; value?: number; max?: number; color?: string }) {
  const hasValue = isFiniteNumber(value);
  const normalized = hasValue && max > 0 ? clampPercent((value / max) * 100) : 0;
  const display = hasValue ? (max === 1 ? value.toFixed(3) : String(Math.round(value))) : 'N/A';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-[10px] font-mono font-black text-slate-200">{display}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-950/80 border border-slate-800/70 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${normalized}%`,
            background: hasValue ? color ?? scoreColor(value) : '#334155',
            boxShadow: hasValue ? `0 0 14px ${color ?? scoreColor(value)}55` : 'none',
          }}
        />
      </div>
    </div>
  );
}

function SignalTile({ label, value, color }: { label: string; value?: number; color: string }) {
  const hasValue = isFiniteNumber(value);
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="text-xs font-mono font-black" style={{ color: hasValue ? color : '#64748b' }}>
          {hasValue ? Math.round(value) : 'N/A'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${hasValue ? clampPercent(value) : 0}%`, background: color }}
        />
      </div>
    </div>
  );
}

function LockedGraphPlaceholder({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/45 p-3 opacity-90">
      <div className="flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{title}</span>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{detail}</p>
    </div>
  );
}

function ProLockedPanel() {
  return (
    <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-sky-300" />
        <h4 className="text-xs font-black uppercase tracking-wider text-sky-100">Pro Player Edge Lab</h4>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        Basic player context is visible. Score graphs unlock for Pro users using the existing HR Engine Pro v2 payload.
      </p>
      <div className="mt-3 grid gap-2">
        <LockedGraphPlaceholder title="Score Breakdown Graph" detail="Coming soon with Pro data feed access for this account." />
        <LockedGraphPlaceholder title="Recent Form Graph" detail="Requires Pro Player Edge access. No game-by-game data is faked." />
        <LockedGraphPlaceholder title="HR Signal Matrix" detail="Unlocks existing hitter, pitcher, park, form, and confidence signals." />
      </div>
    </div>
  );
}

const FUTURE_GRAPHS = [
  ['Last 15 games trend', 'Coming soon with Pro data feed.'],
  ['Batter vs pitcher history', 'Requires matchup history module.'],
  ['Pitch type matchup', 'Requires pitch-type module.'],
  ['Ballpark split chart', 'Requires ballpark split module.'],
  ['Hot/cold zone heatmap', 'Requires zone heatmap module.'],
  ['Weather impact graph', 'Requires weather impact module.'],
] as const;

export default function HrPlayerDrawer({ row, onClose }: { row: HrBoardRow | null; onClose: () => void }) {
  if (!row) return null;
  const topReasons = row.reasons?.slice(0, 5) ?? [];
  const topWarnings = row.warnings?.slice(0, 3) ?? [];
  const recentForm = row.recentForm;
  const breakdown = row.scoreBreakdown;
  const isPro = isProPlayerEdgeUnlocked();
  const finalScore = isFiniteNumber(breakdown?.finalScore) ? breakdown.finalScore : row.hrEdge;
  const recentPowerScore = isFiniteNumber(recentForm?.recentPowerScore)
    ? recentForm.recentPowerScore
    : breakdown?.recentForm;
  const j = row.judge ?? {
    approvalStatus: row.hrEdge >= 85 ? "Approved" : row.hrEdge >= 70 ? "Playable but risky" : "Needs more data",
    summary: "Auto-generated from HR board row data.",
    reasons: [],
    warnings: [],
  };
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md h-full bg-[#0b1120] border-l border-slate-800 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#0b1120]/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <img src={row.headshot} alt={row.playerName} referrerPolicy="no-referrer" className="w-11 h-11 rounded-xl object-cover bg-slate-900 border border-slate-800" />
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-500">#{row.rank ?? '-'}</span>
                {row.playerName}
                {row.hrEdge >= 75 && <Flame className="w-4 h-4 text-orange-400" />}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {row.team} vs {row.opponent} · {row.venue ?? 'Unknown venue'} · BAT {row.lineupSpot === null || row.lineupSpot === undefined ? 'N/A' : row.lineupSpot}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Verdict banner */}
          <div className="p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: (APPROVAL_COLOR[j.approvalStatus] ?? '#94a3b8') + '55', background: (APPROVAL_COLOR[j.approvalStatus] ?? '#94a3b8') + '12' }}>
            <div className="flex items-center gap-2">
              <GradeBadge grade={row.grade} />
              <span className="text-sm font-bold" style={{ color: APPROVAL_COLOR[j.approvalStatus] ?? '#e2e8f0' }}>{j.approvalStatus}</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ color: RISK_COLOR[row.riskLabel], background: RISK_COLOR[row.riskLabel] + '18' }}>{row.riskLabel}</span>
          </div>

          {/* Core metrics */}
          <div className="grid grid-cols-4 gap-2">
            <Metric label="HR Edge" value={`${row.hrEdge}%`} color={edgeColor(row.hrEdge)} />
            <Metric label="Vouch" value={String(row.vouchScore)} color="#34d399" />
            <Metric label="Risk" value={row.riskLabel} color={RISK_COLOR[row.riskLabel]} />
            <Metric label="Data" value={`${row.dataConfidence}%`} />
          </div>

          {row.lineupStatus === 'projected_unconfirmed' && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-xs text-amber-100">
              Official lineup not posted yet.
            </div>
          )}

          <Section icon={ShieldCheck} title="Why this pick?">
            <ul className="space-y-1">
              {topReasons.map((reason, index) => (
                <li key={`${row.playerId}-drawer-reason-${index}`} className="text-[11px] text-slate-300">
                  • {reason}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={TrendingUp} title="Matchup vs pitcher">
            <p className="text-xs text-slate-300">{row.opponentPitcherName ?? row.opposingPitcher} <span className="text-slate-500">({row.opposingPitcherTeam})</span></p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-slate-500 font-mono">Pitcher vulnerability</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${row.pitcherVulnerability}%`, background: edgeColor(row.pitcherVulnerability) }} />
              </div>
              <span className="text-[11px] font-mono font-bold" style={{ color: edgeColor(row.pitcherVulnerability) }}>{row.pitcherVulnerability}</span>
            </div>
          </Section>

          <Section icon={MapPin} title="Recent form">
            <div className="grid grid-cols-4 gap-2">
              <Metric label="L15" value={`${recentForm?.gamesChecked ?? 0} G`} />
              <Metric label="HR" value={String(recentForm?.homeRuns ?? 0)} />
              <Metric label="XBH" value={String(recentForm?.extraBaseHits ?? 0)} />
              <Metric label="SLG" value={typeof recentForm?.slugging === 'number' ? recentForm.slugging.toFixed(3) : 'N/A'} />
            </div>
          </Section>

          {isPro ? (
            <>
              <Section icon={BarChart3} title="Pro Player Edge Lab" tone="#38bdf8">
                <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-300">Score Breakdown Graph</h5>
                      <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-2 py-0.5 text-[10px] font-mono font-black text-orange-200">
                        HR Score {formatNumber(row.hrEdge)}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      <GraphBar label="Hitter Power" value={breakdown?.hitterPower} color="#fb923c" />
                      <GraphBar label="Pitcher Vulnerability" value={breakdown?.pitcherVulnerability} color="#38bdf8" />
                      <GraphBar label="Park Factor" value={breakdown?.parkFactor} max={120} color="#34d399" />
                      <GraphBar label="Recent Form" value={breakdown?.recentForm} color="#c084fc" />
                      <GraphBar label="Lineup Confidence" value={breakdown?.lineupConfidence} color="#facc15" />
                      <GraphBar label="Risk Penalty" value={breakdown?.riskPenalty} color="#f87171" />
                      <GraphBar label="Final Score" value={finalScore} color="#f97316" />
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-300">Recent Form Graph</h5>
                      <span className="text-[10px] font-mono text-slate-500">Last {recentForm?.gamesChecked ?? 15} games</span>
                    </div>
                    <div className="space-y-2.5">
                      <GraphBar label="Home Runs" value={recentForm?.homeRuns} max={10} color="#fb923c" />
                      <GraphBar label="Extra-Base Hits" value={recentForm?.extraBaseHits} max={15} color="#facc15" />
                      <GraphBar label="Hits" value={recentForm?.hits} max={25} color="#38bdf8" />
                      <GraphBar label="Total Bases" value={recentForm?.totalBases} max={60} color="#34d399" />
                      <GraphBar label="Recent Power Score" value={recentPowerScore} color="#c084fc" />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">
                      Recent 15-game stats: {recentForm?.homeRuns ?? 'N/A'} HR, {recentForm?.extraBaseHits ?? 'N/A'} XBH, {formatDecimal(recentForm?.slugging)} SLG.
                    </p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3">
                    <h5 className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-300">HR Signal Radar / Matrix</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <SignalTile label="Hitter Power" value={breakdown?.hitterPower} color="#fb923c" />
                      <SignalTile label="Pitcher Vuln" value={breakdown?.pitcherVulnerability} color="#38bdf8" />
                      <SignalTile label="Park Factor" value={isFiniteNumber(breakdown?.parkFactor) ? Math.min(100, breakdown.parkFactor) : undefined} color="#34d399" />
                      <SignalTile label="Recent Form" value={recentPowerScore} color="#c084fc" />
                      <SignalTile label="Data Confidence" value={row.dataConfidence} color="#22d3ee" />
                    </div>
                  </div>
                </div>
              </Section>

              <Section icon={Lock} title="Pro locked future graphs" tone="#94a3b8">
                <div className="grid gap-2">
                  {FUTURE_GRAPHS.map(([title, detail]) => (
                    <LockedGraphPlaceholder key={title} title={title} detail={detail} />
                  ))}
                </div>
              </Section>
            </>
          ) : (
            <Section icon={Lock} title="Pro graph previews" tone="#38bdf8">
              <ProLockedPanel />
            </Section>
          )}

          <Section icon={MapPin} title="Venue">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {row.venue ?? 'Unknown venue'}
            </p>
          </Section>

          {/* AI Judge note */}
          <Section icon={Gavel} title="AI Judge note">
            <p className="text-xs text-slate-300 leading-relaxed">{j.judgeNote}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1.5">Sportsbook odds unavailable — parlay price not counted</p>
          </Section>

          <Section icon={AlertTriangle} title="Warnings" tone="#fbbf24">
            <ul className="space-y-1">
              {(topWarnings.length ? topWarnings : j.whatCouldGoWrong?.length ? j.whatCouldGoWrong : ["Lineup changes, late scratches, and pitcher changes can alter the read."]).map((w, i) => <li key={i} className="text-[11px] text-slate-400">• {w}</li>)}
            </ul>
          </Section>

          {/* Safer alternative + verdict */}
          <Section icon={ShieldCheck} title="VouchEdge verdict" tone="#34d399">
            <p className="text-xs text-slate-300">{row.reasons?.[0] ?? 'Probability-based research only. Review lineup, pitcher, park, and weather context before using.'}</p>
            {(row.grade === 'D' || row.grade === 'F') && (
              <p className="text-[11px] text-emerald-400/90 mt-1.5">↪ Safer alternative: target a higher-graded bat in this game or a total-bases line instead of the HR.</p>
            )}
            <p className="text-[10px] text-slate-600 mt-2">{row.source} Data quality: source-based MLB board data {row.dataQuality}</p>
          </Section>

          <p className="text-[10px] text-slate-600 text-center pt-2">Probability-based research for entertainment — not betting advice. No guaranteed outcomes.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, tone = '#64748b', children }: { icon: any; title: string; tone?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: tone }} />
        <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400">{title}</h4>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}
