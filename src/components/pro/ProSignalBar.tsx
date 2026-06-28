type ProSignalBarProps = {
  label: string;
  value: number | string | null | undefined;
  color?: string;
};

export function ProSignalBar({ label, value, color = '#22d3ee' }: ProSignalBarProps) {
  const numeric = typeof value === 'number' ? value : Number(value);
  const safeValue = Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold text-slate-400">{label}</span>
        <span className="text-[10px] font-black tabular-nums" style={{ color }}>
          {safeValue}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full" style={{ width: `${safeValue}%`, background: color }} />
      </div>
    </div>
  );
}

export default ProSignalBar;
