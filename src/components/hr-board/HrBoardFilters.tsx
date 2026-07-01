import React from 'react';
import { Search, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import type { HrBoardFilterState, SortKey } from '../../types/hrBoard';

const GRADES = ['ALL', 'A+', 'A', 'B', 'C', 'D', 'F'];
const RISKS = ['ALL', 'Strong', 'Playable', 'Sneaky', 'Longshot', 'Lotto', 'Avoid'];
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

const sel = 'rounded-xl border border-[hsl(var(--ve-border)/0.32)] bg-[hsl(var(--ve-surface-raised)/0.44)] px-2.5 py-2 text-xs text-[hsl(var(--ve-text-secondary))] outline-none transition focus:border-[hsl(var(--ve-accent-cyan)/0.56)]';

function Toggle({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition-all ${active ? 'border-[hsl(var(--ve-accent-cyan)/0.42)] bg-[hsl(var(--ve-accent-cyan)/0.14)] text-[hsl(var(--ve-accent-cyan))] shadow-md shadow-[hsl(var(--ve-shadow)/0.14)]' : 'border-[hsl(var(--ve-border)/0.32)] bg-[hsl(var(--ve-surface-raised)/0.44)] text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-secondary))]'}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

export default function HrBoardFilters({ date, onDateChange, teams, filters, onChange }: Props) {
  return (
    <div className="ve-premium-panel mb-3 rounded-2xl p-3">
      <div className="flex flex-wrap items-center gap-2">
      <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className={sel} />

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--ve-text-muted))]" />
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

      <Toggle active={filters.hotOnly} onClick={() => onChange({ hotOnly: !filters.hotOnly })} icon={Flame} label="Hot only" />
      <Toggle active={filters.sneakyOnly} onClick={() => onChange({ sneakyOnly: !filters.sneakyOnly })} icon={Sparkles} label="Sneaky" />
      <Toggle active={filters.confirmedOnly} onClick={() => onChange({ confirmedOnly: !filters.confirmedOnly })} icon={CheckCircle2} label="Confirmed" />

      <label className="flex items-center gap-2 px-2 text-[11px] font-mono text-[hsl(var(--ve-text-muted))]">
        P.Vuln ≥ {filters.minPitcherVuln}
        <input type="range" min={0} max={100} value={filters.minPitcherVuln}
          onChange={(e) => onChange({ minPitcherVuln: Number(e.target.value) })} className="w-24 accent-[hsl(var(--ve-accent-cyan))]" />
      </label>

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-[10px] font-mono uppercase text-[hsl(var(--ve-text-muted))]">Sort</span>
        <select value={filters.sortKey} onChange={(e) => onChange({ sortKey: e.target.value as SortKey })} className={sel}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      </div>
    </div>
  );
}
