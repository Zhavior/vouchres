import React from 'react';
import { Flame } from 'lucide-react';
import type { HrBoardRow as Row, Grade, FormTag, RiskLabel } from '../../types/hrBoard';

export const GRADE_COLOR: Record<Grade, string> = {
  'A+': '#34d399', A: '#4ade80', B: '#22d3ee', C: '#fbbf24', D: '#fb923c', F: '#f87171',
};
export const FORM_COLOR: Record<FormTag, string> = {
  Hot: '#fb7185', Average: '#94a3b8', Cold: '#60a5fa', Slump: '#64748b',
};
export const RISK_COLOR: Record<RiskLabel, string> = {
  Strong: '#34d399', Playable: '#22d3ee', Sneaky: '#a78bfa', Lotto: '#fb923c', Avoid: '#f87171',
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

export function Move({ pct }: { pct: number }) {
  const up = pct >= 0;
  return <span className="font-mono text-[11px] font-bold" style={{ color: up ? '#34d399' : '#f87171' }}>{up ? '+' : ''}{pct}%</span>;
}

const cell = 'px-2.5 py-2 text-[11px] whitespace-nowrap';

const HrBoardRow: React.FC<{ row: Row; onClick: () => void }> = ({ row, onClick }) => {
  const strong = row.hrEdge >= 75;
  return (
    <tr onClick={onClick} className="border-t border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors">
      <td className={`${cell} sticky left-0 bg-[#0b1120] group-hover:bg-slate-800/30`}>
        <div className="flex items-center gap-2 min-w-[150px]">
          <img src={row.headshot} alt={row.playerName} loading="lazy" referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-lg object-cover bg-slate-900 border border-slate-800 flex-shrink-0" />
          <span className="font-semibold text-slate-100 truncate">{row.playerName}</span>
          {strong && <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />}
        </div>
      </td>
      <td className={`${cell} text-slate-400 font-mono`}>{row.team}</td>
      <td className={`${cell} text-center`}><GradeBadge grade={row.grade} /></td>
      <td className={`${cell} text-center font-mono font-black`} style={{ color: edgeColor(row.hrEdge) }}>{row.hrEdge}%</td>
      <td className={`${cell} text-center font-mono text-slate-300`}>{row.impliedOdds}</td>
      <td className={`${cell} text-center font-mono font-bold text-emerald-400`}>{row.vouchScore}</td>
      <td className={cell}>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: FORM_COLOR[row.formTag] }} />
          <span style={{ color: FORM_COLOR[row.formTag] }}>{row.formTag}</span>
        </span>
      </td>
      <td className={`${cell} text-slate-300`}>{row.opposingPitcher}</td>
      <td className={`${cell} text-slate-500 font-mono`}>{row.opposingPitcherTeam}</td>
      <td className={`${cell} text-center font-mono`} style={{ color: edgeColor(row.pitcherVulnerability) }}>{row.pitcherVulnerability}</td>
      <td className={`${cell} text-center font-mono text-slate-400`}>{row.parkFactor}</td>
      <td className={`${cell} text-center font-mono text-slate-400`}>×{row.hrMultiplier}</td>
      <td className={`${cell} text-center font-mono text-slate-400`}>{row.dataConfidence}%</td>
      <td className={`${cell} text-center font-mono`} style={{ color: row.weatherBoost >= 0 ? '#34d399' : '#f87171' }}>{row.weatherBoost > 0 ? '+' : ''}{row.weatherBoost}%</td>
      <td className={`${cell} text-slate-400 font-mono`}>{row.gameStatus}</td>
      <td className={cell}>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">{row.projectionType}</span>
      </td>
      <td className={`${cell} text-center font-mono text-slate-400`}>{row.lineupSpot}</td>
      <td className={`${cell} text-center font-mono text-slate-300`}>{row.bestOdds}</td>
      <td className={`${cell} text-center`}><Move pct={row.lineMovement} /></td>
    </tr>
  );
};

export default HrBoardRow;
