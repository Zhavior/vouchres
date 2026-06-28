export default function ProSignalBar({
  label,
  value,
  tone = 'cyan',
}: {
  label: string;
  value: number | null | undefined;
  tone?: 'cyan' | 'emerald' | 'amber';
}) {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
  const color = tone === 'emerald' ? 'bg-emerald-400' : tone === 'amber' ? 'bg-amber-300' : 'bg-cyan-300';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.16em]">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-200">{safeValue === null ? 'Locked' : Math.round(safeValue)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-900">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${safeValue ?? 0}%` }} />
      </div>
    </div>
  );
}
