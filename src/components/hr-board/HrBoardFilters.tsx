import React from 'react';
import { Search, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import type { HrBoardFilterState, SortKey } from '../../types/hrBoard';

const GRADES = ['ALL', 'A+', 'A', 'B', 'C', 'D', 'F'];
const RISKS = ['ALL', 'Strong', 'Playable', 'Sneaky', 'Lotto', 'Avoid'];
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'hrEdge', label: 'HR Edge' },
  { key: 'vouchScore', label: 'Vouch Score' },
  { key: 'grade', label: 'Grade' },
  { key: 'pitcherVulnerability', label: 'Pitcher Vuln' },
  { key: 'bestOdds', label: 'Best Odds' },
  { key: 'dataConfidence', label: 'Data Confidence' },
  { key: 'lineupSpot', label: 'Lineup Spot' },
  { key: 'weatherBoost', label: 'Weather Boost' },
];

interface Props {
  date: string;
  onDateChange: (d: string) => void;
  teams: string[];
  filters: HrBoardFilterState;
  onChange: (next: Partial<HrBoardFilterState>) => void;
}

const sel = 'bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 px-2.5 py-2 focus:border-emerald-500/60 outline-none';

function Toggle({ active, onClick, icon: Icon, label, color }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; color: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-2 rounded-lg border transition-all ${active ? 'text-slate-950' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
      style={active ? { background: color, borderColor: color } : undefined}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

export default function HrBoardFilters({ date, onDateChange, teams, filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className={sel} />

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={filters.search} onChange={(e) => onChange({ search: e.target.value })} placeholder="Search player…"
          className={`${sel} pl-8 w-44`} />
      </div>

      <select value={filters.team} onChange={(e) => onChange({ team: e.target.value })} className={sel}>
        {teams.map((t) => <option key={t} value={t}>{t === 'ALL' ? 'All teams' : t}</option>)}
      </select>

      <select value={filters.grade} onChange={(e) => onChange({ grade: e.target.value })} className={sel}>
        {GRADES.map((g) => <option key={g} value={g}>{g === 'ALL' ? 'All grades' : `Grade ${g}`}</option>)}
      </select>

      <select value={filters.risk} onChange={(e) => onChange({ risk: e.target.value })} className={sel}>
        {RISKS.map((r) => <option key={r} value={r}>{r === 'ALL' ? 'All risk' : r}</option>)}
      </select>

      <Toggle active={filters.hotOnly} onClick={() => onChange({ hotOnly: !filters.hotOnly })} icon={Flame} label="Hot only" color="#fb7185" />
      <Toggle active={filters.sneakyOnly} onClick={() => onChange({ sneakyOnly: !filters.sneakyOnly })} icon={Sparkles} label="Sneaky" color="#a78bfa" />
      <Toggle active={filters.confirmedOnly} onClick={() => onChange({ confirmedOnly: !filters.confirmedOnly })} icon={CheckCircle2} label="Confirmed" color="#34d399" />

      <label className="flex items-center gap-2 text-[11px] text-slate-400 font-mono px-2">
        P.Vuln ≥ {filters.minPitcherVuln}
        <input type="range" min={0} max={100} value={filters.minPitcherVuln}
          onChange={(e) => onChange({ minPitcherVuln: Number(e.target.value) })} className="w-24 accent-emerald-500" />
      </label>

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-[10px] text-slate-500 font-mono uppercase">Sort</span>
        <select value={filters.sortKey} onChange={(e) => onChange({ sortKey: e.target.value as SortKey })} className={sel}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}
