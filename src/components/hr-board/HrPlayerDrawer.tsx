import React from 'react';
import { X, Flame, AlertTriangle, Gavel, ShieldCheck, TrendingUp, CloudSun, MapPin } from 'lucide-react';
import type { HrBoardRow } from '../../types/hrBoard';
import { GradeBadge, edgeColor, FORM_COLOR, RISK_COLOR } from './HrBoardRow';

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

export default function HrPlayerDrawer({ row, onClose }: { row: HrBoardRow | null; onClose: () => void }) {
  if (!row) return null;
  const topReasons = row.reasons?.slice(0, 5) ?? [];
  const topWarnings = row.warnings?.slice(0, 3) ?? [];
  const recentForm = row.recentForm;
  const breakdown = row.scoreBreakdown;
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

          <Section icon={CloudSun} title="Score breakdown">
            <div className="grid grid-cols-4 gap-2">
              <Metric label="Hitter" value={String(Math.round(Number(breakdown?.hitterPower ?? 0)))} color="#fb923c" />
              <Metric label="Pitcher" value={String(Math.round(Number(breakdown?.pitcherVulnerability ?? 0)))} color="#22d3ee" />
              <Metric label="Park" value={String(Math.round(Number(breakdown?.parkFactor ?? 0)))} color="#34d399" />
              <Metric label="Recent" value={String(Math.round(Number(breakdown?.recentForm ?? 0)))} color="#c084fc" />
            </div>
          </Section>

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
