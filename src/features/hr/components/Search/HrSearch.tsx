import { Search } from 'lucide-react';

interface HrSearchProps {
  value: string;
  onChange: (next: string) => void;
}

export function HrSearch({ value, onChange }: HrSearchProps) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-3">
      <Search className="h-3.5 w-3.5 text-zinc-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search player, team, pitcher, park..."
        className="w-full bg-transparent font-mono text-xs text-slate-100 outline-none placeholder:text-zinc-600"
      />
    </label>
  );
}
