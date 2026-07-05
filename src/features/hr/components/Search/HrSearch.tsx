import { Search } from 'lucide-react';

interface HrSearchProps {
  value: string;
  onChange: (next: string) => void;
}

export function HrSearch({ value, onChange }: HrSearchProps) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:border-white/20">
      <Search className="h-4 w-4 text-slate-400" />
      <span className="sr-only">Search</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search player, team, pitcher, venue..."
        className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
      />
    </label>
  );
}
