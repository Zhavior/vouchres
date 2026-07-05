import type { HrWatchMode } from '../../types/hrWatch';

const VIEW_OPTIONS: Array<{ value: HrWatchMode; label: string }> = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'curated', label: 'Preview' },
  { value: 'all', label: 'All Projected' },
  { value: 'blocked', label: 'Blocked' },
];

const TIERS = [
  { key: 'Elite', label: 'Elite', color: 'text-[#FACC15]' },
  { key: 'Strong', label: 'Strong', color: 'text-[#22C55E]' },
  { key: 'Watch', label: 'Watch', color: 'text-[#3B82F6]' },
  { key: 'Sleepers', label: 'Sleepers', color: 'text-[#8B5CF6]' },
];

interface HrFiltersProps {
  mode: HrWatchMode;
  onModeChange: (mode: HrWatchMode) => void;
  selectedTiers: string[];
  onToggleTier: (tier: string) => void;
}

export function HrFilters({ mode, onModeChange, selectedTiers, onToggleTier }: HrFiltersProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Mode</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                mode === option.value
                  ? 'border-white/20 bg-white/10 text-slate-100'
                  : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tiers</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {TIERS.map((tier) => {
            const active = selectedTiers.includes(tier.key);
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => onToggleTier(tier.key)}
                className={`rounded-2xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.22em] transition ${
                  active
                    ? `border-white/20 bg-white/10 ${tier.color}`
                    : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {tier.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
