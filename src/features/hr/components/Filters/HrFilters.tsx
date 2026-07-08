import type { HrWatchMode } from '../../types/hrWatch';

const MODES: Array<{ value: HrWatchMode; label: string }> = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'curated', label: 'Preview' },
  { value: 'all', label: 'All' },
  { value: 'blocked', label: 'Blocked' },
];

const TIERS = [
  { key: 'Elite', label: 'Elite', color: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
  { key: 'Strong', label: 'Strong', color: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' },
  { key: 'Watch', label: 'Watch', color: 'text-blue-300 border-blue-400/30 bg-blue-400/10' },
  { key: 'Sleepers', label: 'Sleepers', color: 'text-violet-300 border-violet-400/30 bg-violet-400/10' },
];

interface HrFiltersProps {
  mode: HrWatchMode;
  onModeChange: (mode: HrWatchMode) => void;
  selectedTiers: string[];
  onToggleTier: (tier: string) => void;
}

export function HrFilters({ mode, onModeChange, selectedTiers, onToggleTier }: HrFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={mode}
        onChange={(e) => onModeChange(e.target.value as HrWatchMode)}
        className="h-9 rounded-lg border border-white/[0.06] bg-[#0B0F18] px-3 font-mono text-[11px] uppercase text-zinc-300 outline-none"
      >
        {MODES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      {TIERS.map((tier) => {
        const active = (selectedTiers ?? []).includes(tier.key);
        return (
          <button
            key={tier.key}
            onClick={() => onToggleTier(tier.key)}
            className={`h-9 rounded-lg border px-3 font-mono text-[11px] font-bold uppercase transition ${
              active ? tier.color : 'border-white/[0.06] bg-white/[0.03] text-zinc-500'
            }`}
          >
            {tier.label}
          </button>
        );
      })}
    </div>
  );
}
