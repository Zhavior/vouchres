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
  const j = row.judge;
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md h-full bg-[#0b1120] border-l border-slate-800 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#0b1120]/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <img src={row.headshot} alt={row.playerName} referrerPolicy="no-referrer" className="w-11 h-11 rounded-xl object-cover bg-slate-900 border border-slate-800" />
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-1.5">{row.playerName}{row.hrEdge >= 75 && <Flame className="w-4 h-4 text-orange-400" />}</h3>
              <p className="text-[11px] text-slate-500 font-mono">{row.team} · {row.projectionType} · spot {row.lineupSpot}</p>
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
            <Metric label="Implied" value={row.impliedOdds} />
            <Metric label="Conf" value={`${row.dataConfidence}%`} />
          </div>

          {/* Matchup vs pitcher */}
          <Section icon={TrendingUp} title="Matchup vs pitcher">
            <p className="text-xs text-slate-300">{row.opposingPitcher} <span className="text-slate-500">({row.opposingPitcherTeam})</span></p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-slate-500 font-mono">Pitcher vulnerability</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${row.pitcherVulnerability}%`, background: edgeColor(row.pitcherVulnerability) }} />
              </div>
              <span className="text-[11px] font-mono font-bold" style={{ color: edgeColor(row.pitcherVulnerability) }}>{row.pitcherVulnerability}</span>
            </div>
          </Section>

          {/* Form + park + weather */}
          <Section icon={MapPin} title="Form, park & weather">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: FORM_COLOR[row.formTag] }} />
              <span className="text-xs" style={{ color: FORM_COLOR[row.formTag] }}>{row.formTag} form</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Park factor {row.parkFactor} (×{row.hrMultiplier} HR)</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1"><CloudSun className="w-3 h-3" /> Weather data unavailable — not factored</p>
          </Section>

          {/* AI Judge note */}
          <Section icon={Gavel} title="AI Judge note">
            <p className="text-xs text-slate-300 leading-relaxed">{j.judgeNote}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1.5">Parlay allowed: {j.parlayAllowed ? 'Yes' : 'No'}</p>
          </Section>

          {/* What could go wrong */}
          <Section icon={AlertTriangle} title="What could go wrong" tone="#fbbf24">
            <ul className="space-y-1">
              {j.whatCouldGoWrong.map((w, i) => <li key={i} className="text-[11px] text-slate-400">• {w}</li>)}
            </ul>
          </Section>

          {/* Safer alternative + verdict */}
          <Section icon={ShieldCheck} title="VouchEdge verdict" tone="#34d399">
            <p className="text-xs text-slate-300">{row.reasons[0]}</p>
            {(row.grade === 'D' || row.grade === 'F') && (
              <p className="text-[11px] text-emerald-400/90 mt-1.5">↪ Safer alternative: target a higher-graded bat in this game or a total-bases line instead of the HR.</p>
            )}
            <p className="text-[10px] text-slate-600 mt-2">{row.source} · data quality: {row.dataQuality}</p>
          </Section>

          <p className="text-[10px] text-slate-600 text-center pt-2">Probability-based research for entertainment — not betting advice. No guaranteed outcomes.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, tone = '#64748b', children }: { icon: React.ComponentType<{ className?: string }>; title: string; tone?: string; children: React.ReactNode }) {
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
