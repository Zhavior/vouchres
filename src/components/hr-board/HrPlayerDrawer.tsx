import React, { useState } from 'react';
import { X, Flame, AlertTriangle, Gavel, ShieldCheck, TrendingUp, MapPin, Lock, BarChart3, Share2, Copy } from 'lucide-react';
import type { HrBoardRow } from '../../types/hrBoard';
import { GradeBadge, edgeColor, RISK_COLOR } from './HrBoardRow';
import { apiUrl } from '../../lib/apiBase';

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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatNumber(value: unknown, fallback = 'N/A') {
  return isFiniteNumber(value) ? String(Math.round(value)) : fallback;
}

function formatDecimal(value: unknown, digits = 3, fallback = 'N/A') {
  return isFiniteNumber(value) ? value.toFixed(digits) : fallback;
}

function buildHrShareCardUrl(row: HrBoardRow) {
  const params = new URLSearchParams({
    playerId: String(row.playerId),
    format: 'svg',
    theme: 'dark',
  });

  const gamePk = row.gamePk ?? row.raw?.gamePk;
  if (gamePk !== undefined && gamePk !== null && String(gamePk).trim()) {
    params.set('gamePk', String(gamePk));
  }

  return apiUrl(`/api/share/hr-card?${params.toString()}`);
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

function ProLockedPanel({ onLockedFeature }: { onLockedFeature: (title: string) => void }) {
  const proCrossFeatures = [
    {
      title: "Player Edge Lab",
      detail: "Full player research profile with HR score, form, matchup, confidence, and AI notes.",
    },
    {
      title: "Matchup History",
      detail: "Team history vs hitter, recent opponent trends, and matchup context. No fake history shown.",
    },
    {
      title: "Batter vs Pitcher",
      detail: "Head-to-head history unlocks when the verified matchup module is connected.",
    },
    {
      title: "Vs Team Trends",
      detail: "Hits, RBIs, runs, HRs, and extra-base trends against today’s opponent.",
    },
    {
      title: "Recent Power Graphs",
      detail: "Last 7, 15, and 30 game power trend charts using verified player data.",
    },
    {
      title: "Park + Pitcher Vulnerability",
      detail: "Cross-checks hitter power with park factor and pitcher HR vulnerability signals.",
    },
    {
      title: "Batter Box / Zone Data",
      detail: "Future Pro zone module for swing zones, hot zones, and pitch-location signals.",
    },
  ];

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-slate-950/70 to-emerald-500/5 p-4 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-sky-300" />
            <h4 className="text-xs font-black uppercase tracking-wider text-sky-100">Pro Cross Features</h4>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Unlock deeper research tools that connect this HR pick to matchup history, player trends, pitcher weakness, and Pro graphs.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-200">
          Pro
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {proCrossFeatures.map((feature) => (
          <button
            type="button"
            key={feature.title}
            onClick={() => onLockedFeature(feature.title)}
            className="group w-full rounded-xl border border-slate-800/80 bg-slate-950/55 p-3 text-left transition-colors hover:border-sky-500/25 hover:bg-sky-500/5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-slate-500 group-hover:text-sky-300" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                  {feature.title}
                </span>
              </div>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500">
                Locked
              </span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
              {feature.detail}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
        <p className="text-[10px] leading-relaxed text-slate-500">
          Pro modules are locked until verified data feeds are connected. VouchEdge will not show fake batter-vs-pitcher, zone, or matchup-history stats.
        </p>
      </div>
    </div>
  );
}

const FUTURE_GRAPHS = [
  ['Last 15 games trend', 'Coming soon with Pro data feed.'],
  ['Player trend graphs', 'Coming soon with Pro data feed.'],
  ['Batter vs pitcher history', 'Requires matchup history module.'],
  ['Pitch type matchup', 'Requires pitch-type module.'],
  ['Ballpark split chart', 'Requires ballpark split module.'],
  ['Hot/cold zone heatmap', 'Requires zone heatmap module.'],
  ['Weather impact graph', 'Requires weather impact module.'],
] as const;

const PRO_TABS = ['Overview', 'Recent Form', 'Vs Team', 'Vs Pitcher', 'Bat Box', 'Graphs', 'AI Notes'] as const;
type ProTab = typeof PRO_TABS[number];


function SignalBar({ label, value, color }: { label: string; value: number; color: string }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold text-slate-400">{label}</span>
        <span className="text-[10px] font-black tabular-nums" style={{ color }}>{safeValue}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full" style={{ width: `${safeValue}%`, background: color }} />
      </div>
    </div>
  );
}

export default function HrPlayerDrawer({ row, onClose }: { row: HrBoardRow | null; onClose: () => void }) {
  const [activeProTab, setActiveProTab] = useState<ProTab>('Overview');
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const handleLockedProFeature = (title: string) => {
    setShareStatus(`${title} locked — Pro verified data feed required`);
    window.setTimeout(() => setShareStatus(null), 2200);
  };

  if (!row) return null;
  const isProUser = false;
  const topReasons = row.reasons?.slice(0, 5) ?? [];
  const topWarnings = row.warnings?.slice(0, 3) ?? [];
  const recentForm = row.recentForm;
  const breakdown = row.scoreBreakdown;
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
  const shareCardUrl = buildHrShareCardUrl(row);

  const handleOpenShareCard = () => {
    window.open(shareCardUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyShareCardUrl = async () => {
    try {
      await navigator.clipboard.writeText(new URL(shareCardUrl, window.location.origin).toString());
      setShareStatus('Image URL copied');
      window.setTimeout(() => setShareStatus(null), 1800);
    } catch {
      setShareStatus('Copy unavailable');
      window.setTimeout(() => setShareStatus(null), 1800);
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] flex ${isProUser ? 'items-end md:items-stretch md:justify-end' : 'justify-end'}`} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full bg-[#0b1120] border-slate-800 overflow-y-auto shadow-2xl ${
          isProUser
            ? 'h-[94vh] rounded-t-3xl border-t md:h-full md:max-w-6xl md:rounded-none md:border-l md:border-t-0'
            : 'max-w-md h-full border-l'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className={isProUser ? 'p-4 md:p-5 space-y-4' : 'p-4 space-y-4'}>
          {isProUser && (
            <div className="sticky top-[69px] z-[9] -mx-4 md:-mx-5 border-b border-slate-800 bg-[#0b1120]/95 px-4 md:px-5 py-2 backdrop-blur">
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {PRO_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveProTab(tab)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                      activeProTab === tab
                        ? 'border-sky-400/50 bg-sky-400/15 text-sky-100'
                        : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleOpenShareCard}
              className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-sky-100 transition-colors hover:border-sky-400/40 hover:bg-sky-500/15"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Image
            </button>
            <button
              type="button"
              onClick={handleCopyShareCardUrl}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy URL
            </button>
          </div>
          {shareStatus && (
            <p className="text-center text-[10px] font-bold uppercase tracking-wider text-sky-300">{shareStatus}</p>
          )}

          {row.lineupStatus === 'projected_unconfirmed' && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-xs text-amber-100">
              Official lineup not posted yet.
            </div>
          )}

          <Section icon={TrendingUp} title="HR Player Profile" tone="#22d3ee">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Today’s profile</p>
                    <p className="mt-1 text-sm font-black text-slate-100">{row.playerName}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {row.team} vs {row.opponent} · {row.venue ?? 'Unknown venue'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">HR Edge</p>
                    <p className="text-2xl font-black" style={{ color: edgeColor(row.hrEdge) }}>{row.hrEdge}%</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Opposing pitcher</p>
                  <p className="mt-1 text-xs font-bold text-slate-200">
                    {row.opponentPitcherName ?? row.opposingPitcher ?? 'TBD'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {row.opposingPitcherTeam ?? row.opponent ?? 'Opponent'} · P.VULN {row.pitcherVulnerability}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Data status</p>
                  <p className="mt-1 text-xs font-bold text-slate-200">
                    {row.lineupStatus === 'projected_unconfirmed' ? 'Projected preview' : 'Lineup checked'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Confidence {row.dataConfidence}% · Risk {row.riskLabel}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Metric label="Hitter" value={formatNumber(breakdown?.hitterPower)} color="#d6a64f" />
                <Metric label="P.Vuln" value={formatNumber(breakdown?.pitcherVulnerability)} color="#22d3ee" />
                <Metric label="Park" value={formatNumber(breakdown?.parkFactor)} color="#34d399" />
                <Metric label="Final" value={formatNumber(finalScore)} color="#f8fafc" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Profile read</p>
                  <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-sky-200">
                    HR research
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  This profile combines hitter power, pitcher vulnerability, park factor, recent form, lineup status, and data confidence from the active HR Engine row.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Signal stack</p>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-200">
                    live row
                  </span>
                </div>

                <div className="space-y-2.5">
                  <SignalBar label="Hitter power" value={Number(formatNumber(breakdown?.hitterPower)) || 0} color="#d6a64f" />
                  <SignalBar label="Pitcher vulnerability" value={Number(formatNumber(breakdown?.pitcherVulnerability)) || 0} color="#22d3ee" />
                  <SignalBar label="Park factor" value={Number(formatNumber(breakdown?.parkFactor)) || 0} color="#34d399" />
                  <SignalBar label="Recent form" value={Number(formatNumber(breakdown?.recentForm)) || 0} color="#818cf8" />
                  <SignalBar label="Data confidence" value={Number(row.dataConfidence) || 0} color="#f8fafc" />
                </div>
              </div>
            </div>
          </Section>

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

          {!isProUser && (
            <Section icon={BarChart3} title="Basic score breakdown" tone="#38bdf8">
              <div className="grid grid-cols-4 gap-2">
                <Metric label="Hitter" value={formatNumber(breakdown?.hitterPower)} color="#fb923c" />
                <Metric label="P.Vuln" value={formatNumber(breakdown?.pitcherVulnerability)} color="#22d3ee" />
                <Metric label="Park" value={formatNumber(breakdown?.parkFactor)} color="#34d399" />
                <Metric label="Recent" value={formatNumber(recentPowerScore)} color="#c084fc" />
              </div>
            </Section>
          )}

          {isProUser ? (
            <>
              <ProTabContent
                activeTab={activeProTab}
                row={row}
                breakdown={breakdown}
                recentForm={recentForm}
                finalScore={finalScore}
                recentPowerScore={recentPowerScore}
                topReasons={topReasons}
                topWarnings={topWarnings}
                judgeNote={j.judgeNote}
              />
            </>
          ) : (
            <Section icon={Lock} title="Player Edge Lab Pro" tone="#38bdf8">
              <ProLockedPanel onLockedFeature={handleLockedProFeature} />
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

function ProTabContent({
  activeTab,
  row,
  breakdown,
  recentForm,
  finalScore,
  recentPowerScore,
  topReasons,
  topWarnings,
  judgeNote,
}: {
  activeTab: ProTab;
  row: HrBoardRow;
  breakdown: HrBoardRow['scoreBreakdown'];
  recentForm: HrBoardRow['recentForm'];
  finalScore: number;
  recentPowerScore?: number;
  topReasons: string[];
  topWarnings: string[];
  judgeNote?: string;
}) {
  if (activeTab === 'Overview') {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Section icon={BarChart3} title="Score Breakdown Graph" tone="#38bdf8">
          <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Live HR Engine Pro v2 payload</span>
              <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-2 py-0.5 text-[10px] font-mono font-black text-orange-200">
                HR Score {formatNumber(row.hrEdge)}
              </span>
            </div>
            <GraphBar label="Hitter Power" value={breakdown?.hitterPower} color="#fb923c" />
            <GraphBar label="Pitcher Vulnerability" value={breakdown?.pitcherVulnerability} color="#38bdf8" />
            <GraphBar label="Park Factor" value={breakdown?.parkFactor} max={120} color="#34d399" />
            <GraphBar label="Recent Form" value={breakdown?.recentForm} color="#c084fc" />
            <GraphBar label="Lineup Confidence" value={breakdown?.lineupConfidence} color="#facc15" />
            <GraphBar label="Risk Penalty" value={breakdown?.riskPenalty} color="#f87171" />
            <GraphBar label="Final Score" value={finalScore} color="#f97316" />
          </div>
        </Section>

        <Section icon={Flame} title="HR Signal Radar / Matrix" tone="#fb923c">
          <div className="grid grid-cols-2 gap-2">
            <SignalTile label="Hitter Power" value={breakdown?.hitterPower} color="#fb923c" />
            <SignalTile label="Pitcher Vuln" value={breakdown?.pitcherVulnerability} color="#38bdf8" />
            <SignalTile label="Park Factor" value={isFiniteNumber(breakdown?.parkFactor) ? Math.min(100, breakdown.parkFactor) : undefined} color="#34d399" />
            <SignalTile label="Recent Form" value={recentPowerScore} color="#c084fc" />
            <SignalTile label="Data Confidence" value={row.dataConfidence} color="#22d3ee" />
          </div>
        </Section>
      </div>
    );
  }

  if (activeTab === 'Recent Form') {
    return (
      <Section icon={TrendingUp} title="Recent Form Graph" tone="#c084fc">
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Metric label="Last" value={`${recentForm?.gamesChecked ?? 15} G`} />
            <Metric label="HR" value={String(recentForm?.homeRuns ?? 'N/A')} color="#fb923c" />
            <Metric label="XBH" value={String(recentForm?.extraBaseHits ?? 'N/A')} color="#facc15" />
            <Metric label="Hits" value={String(recentForm?.hits ?? 'N/A')} color="#38bdf8" />
            <Metric label="SLG" value={formatDecimal(recentForm?.slugging)} color="#c084fc" />
          </div>
          <GraphBar label="Home Runs" value={recentForm?.homeRuns} max={10} color="#fb923c" />
          <GraphBar label="Extra-Base Hits" value={recentForm?.extraBaseHits} max={15} color="#facc15" />
          <GraphBar label="Hits" value={recentForm?.hits} max={25} color="#38bdf8" />
          <GraphBar label="Total Bases" value={recentForm?.totalBases} max={60} color="#34d399" />
          <GraphBar label="Recent Power Score" value={recentPowerScore} color="#c084fc" />
          <p className="text-[10px] text-slate-500">
            Recent 15-game stats: {recentForm?.homeRuns ?? 'N/A'} HR, {recentForm?.extraBaseHits ?? 'N/A'} XBH, {formatDecimal(recentForm?.slugging)} SLG.
          </p>
        </div>
      </Section>
    );
  }

  if (activeTab === 'Vs Team') {
    return (
      <Section icon={ShieldCheck} title={`Vs ${row.opponent} research`} tone="#34d399">
        <div className="grid gap-2 md:grid-cols-2">
          <LockedGraphPlaceholder title="Last 10 games vs current opponent team" detail="Coming soon: last 10 games vs team." />
          <LockedGraphPlaceholder title="Hits vs this team" detail="Requires Pro matchup history feed." />
          <LockedGraphPlaceholder title="RBIs vs this team" detail="Requires Pro matchup history feed." />
          <LockedGraphPlaceholder title="Runs vs this team" detail="Requires Pro matchup history feed." />
          <LockedGraphPlaceholder title="Stolen bases vs this team" detail="Requires Pro matchup history feed." />
          <LockedGraphPlaceholder title="Home runs vs this team" detail="Requires Pro matchup history feed." />
          <LockedGraphPlaceholder title="Doubles / extra-base hits" detail="Requires Pro matchup history feed." />
          <LockedGraphPlaceholder title="Strikeouts and walks" detail="Requires Pro matchup history feed." />
        </div>
      </Section>
    );
  }

  if (activeTab === 'Vs Pitcher') {
    return (
      <Section icon={TrendingUp} title="Batter vs Pitcher" tone="#38bdf8">
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3">
            <p className="text-xs text-slate-300">
              Current opposing pitcher: <span className="font-black text-slate-100">{row.opponentPitcherName ?? row.opposingPitcher}</span>
            </p>
            <div className="mt-3">
              <GraphBar label="Pitcher Vulnerability" value={breakdown?.pitcherVulnerability ?? row.pitcherVulnerability} color="#38bdf8" />
            </div>
          </div>
          <LockedGraphPlaceholder title="Batter vs pitcher history" detail="Requires Pro matchup history feed." />
          <LockedGraphPlaceholder title="Pitch type matchup" detail="Requires pitch-type module." />
        </div>
      </Section>
    );
  }

  if (activeTab === 'Bat Box') {
    return (
      <Section icon={MapPin} title="Bat Box" tone="#facc15">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-300">Batter box percentage</div>
            <GraphBar label="Hitter Power" value={breakdown?.hitterPower} color="#fb923c" />
            <p className="mt-2 text-[10px] text-slate-500">Current view uses HR Engine hitter power. Detailed box-location percentage requires zone feed.</p>
          </div>
          <LockedGraphPlaceholder title="Hot/cold zones" detail="Requires zone heatmap module." />
          <LockedGraphPlaceholder title="Team vulnerability" detail="Requires team vulnerability module." />
          <LockedGraphPlaceholder title="Park/weather impact" detail="Weather impact graph requires weather module. Park factor uses existing payload." />
        </div>
      </Section>
    );
  }

  if (activeTab === 'Graphs') {
    return (
      <Section icon={BarChart3} title="Graphs" tone="#38bdf8">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3">
            <h5 className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-300">Available now</h5>
            <GraphBar label="HR Score" value={row.hrEdge} color="#fb923c" />
            <GraphBar label="Pitcher Vulnerability" value={breakdown?.pitcherVulnerability} color="#38bdf8" />
            <GraphBar label="Park Factor" value={breakdown?.parkFactor} max={120} color="#34d399" />
            <GraphBar label="Recent Form" value={recentPowerScore} color="#c084fc" />
          </div>
          <div className="grid gap-2">
            {FUTURE_GRAPHS.map(([title, detail]) => (
              <LockedGraphPlaceholder key={title} title={title} detail={detail} />
            ))}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section icon={Gavel} title="AI Notes" tone="#a78bfa">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3">
          <p className="text-xs leading-relaxed text-slate-300">{judgeNote ?? 'No AI judge note available.'}</p>
          <div className="mt-3 space-y-1">
            {topReasons.map((reason, index) => (
              <p key={`${row.playerId}-pro-reason-${index}`} className="text-[11px] text-slate-400">• {reason}</p>
            ))}
          </div>
        </div>
      </Section>
      <Section icon={AlertTriangle} title="Warnings" tone="#fbbf24">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/35 p-3 space-y-1">
          {(topWarnings.length ? topWarnings : ['Lineup changes, late scratches, and pitcher changes can alter the read.']).map((warning, index) => (
            <p key={`${row.playerId}-pro-warning-${index}`} className="text-[11px] text-slate-400">• {warning}</p>
          ))}
        </div>
      </Section>
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
