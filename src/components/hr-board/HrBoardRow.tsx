import React from 'react';
import { ChevronRight, Flame } from 'lucide-react';
import type { HrBoardRow as Row, Grade, FormTag, RiskLabel } from '../../types/hrBoard';

export const GRADE_COLOR: Record<Grade, string> = {
  'A+': '#34d399', A: '#4ade80', B: '#22d3ee', C: '#fbbf24', D: '#fb923c', F: '#f87171',
};
export const FORM_COLOR: Record<FormTag, string> = {
  Hot: '#fb7185', Average: '#94a3b8', Cold: '#60a5fa', Slump: '#64748b',
};
export const RISK_COLOR: Record<RiskLabel, string> = {
  Strong: '#34d399', Playable: '#22d3ee', Sneaky: '#a78bfa', Longshot: '#fb923c', Lotto: '#fb923c', Avoid: '#f87171',
};

export function edgeColor(edge: number): string {
  if (edge >= 75) return '#818cf8'; // indigo
  if (edge >= 60) return '#22d3ee'; // cyan
  if (edge >= 45) return '#fbbf24';
  return '#64748b';
}

export function GradeBadge({ grade }: { grade: Grade }) {
  const c = GRADE_COLOR[grade];
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] text-[11px] font-black font-mono px-1.5 py-0.5 rounded-md border"
      style={{ color: c, borderColor: c + '55', background: c + '18' }}>{grade}</span>
  );
}

export function Move({ pct }: { pct?: number | null }) {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) {
    return <span className="text-slate-500">N/A</span>;
  }

  if (pct > 0) return <span className="text-emerald-300">+{pct}%</span>;
  if (pct < 0) return <span className="text-rose-300">{pct}%</span>;

  return <span className="text-slate-500">N/A</span>;
}

const cell = 'px-4 py-3 text-[12px] align-middle';

function SignalPill({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <span
      className="inline-flex min-w-[58px] flex-col rounded-lg border px-2.5 py-1.5 text-center"
      style={{ color: tone, borderColor: `${tone}33`, background: `${tone}10` }}
    >
      <span className="text-[8px] font-mono font-bold uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-sm font-mono font-black leading-none">{value}</span>
    </span>
  );
}

function LineupStatus({ row }: { row: Row }) {
  const preview = row.lineupStatus === 'projected_unconfirmed';
  const confirmed = row.lineupStatus === 'confirmed';
  const color = confirmed ? '#34d399' : preview ? '#fbbf24' : '#94a3b8';
  const label = confirmed ? 'Confirmed' : preview ? 'Preview' : row.projectionType ?? 'Projected';

  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
      style={{ color, borderColor: `${color}44`, background: `${color}14` }}
    >
      {label}
    </span>
  );
}

const HrBoardRow: React.FC<{ row: Row; onClick: () => void }> = ({ row, onClick }) => {
  const strong = row.hrEdge >= 75;
  const pitcherName = row.opponentPitcherName ?? row.opposingPitcher;
  const parkDisplay =
    typeof row.parkFactor === 'number'
      ? `${row.parkFactor}`
      : row.parkFactor && row.parkFactor !== 'N/A'
        ? row.parkFactor
        : 'N/A';

  return (
    <tr onClick={onClick} className="group border-t border-slate-800/50 hover:bg-slate-800/25 cursor-pointer transition-colors">
      <td className={`${cell} sticky left-0 bg-[#0b1120] group-hover:bg-[#101827]`}>
        <div className="flex items-center gap-3 min-w-[250px]">
          <img src={row.headshot} alt={row.playerName} loading="lazy" referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-slate-700 flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">#{row.rank ?? '-'}</span>
              <span className="font-black text-slate-100 truncate">{row.playerName}</span>
              {strong && <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
              <span className="font-mono font-bold text-slate-300">{row.team}</span>
              <span>vs {row.opponent}</span>
              <span>·</span>
              <span>{pitcherName}</span>
            </div>
          </div>
        </div>
      </td>
      <td className={cell}>
        <div className="flex min-w-[150px] flex-col gap-1">
          <span className="text-xs font-semibold text-slate-200">{row.venue ?? 'Unknown venue'}</span>
          <span className="text-[10px] font-mono text-slate-500">{row.opposingPitcherTeam || 'Opponent'} pitcher matchup</span>
        </div>
      </td>
      <td className={`${cell} text-center`}>
        <div className="inline-flex items-center gap-2">
          <GradeBadge grade={row.grade} />
          <SignalPill label="HR" value={row.hrEdge} tone={edgeColor(row.hrEdge)} />
        </div>
      </td>
      <td className={cell}>
        <div className="flex flex-wrap justify-center gap-1.5">
          <SignalPill label="P.Vuln" value={row.pitcherVulnerability} tone={edgeColor(row.pitcherVulnerability)} />
          <SignalPill label="Form" value={row.formTag} tone={FORM_COLOR[row.formTag]} />
          <SignalPill label="Park" value={parkDisplay} tone="#34d399" />
        </div>
      </td>
      <td className={`${cell} text-center`}>
        <div className="inline-flex flex-col items-center gap-1">
          <span className="text-sm font-mono font-black text-emerald-300">{row.vouchScore}</span>
          <span className="text-[9px] font-mono uppercase tracking-wide text-slate-500">Vouch</span>
        </div>
      </td>
      <td className={`${cell} text-center`}>
        <div className="inline-flex flex-col items-center gap-1">
          <span className="text-sm font-mono font-black text-slate-200">{row.dataConfidence}%</span>
          <LineupStatus row={row} />
        </div>
      </td>
      <td className={`${cell} text-right`}>
        <ChevronRight className="ml-auto h-4 w-4 text-slate-600 transition-colors group-hover:text-sky-300" />
      </td>
    </tr>
  );
};

export default HrBoardRow;
