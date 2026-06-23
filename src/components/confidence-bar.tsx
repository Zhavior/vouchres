import { cn } from "@/lib/utils";

export function ConfidenceBar({
  value,
  className,
}: {
  value: number; // 0..1
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const color = pct >= 70 ? "bg-success" : pct >= 50 ? "bg-electric-500" : "bg-warning";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-navy-700 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%`, boxShadow: `0 0 8px currentColor` }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
