import { cn } from "@/lib/utils";
import type { VouchLevel } from "@/types";

const LEVEL_STYLES: Record<VouchLevel, { color: string; glow: string; symbol: string }> = {
  unverified: { color: "text-slate-500", glow: "", symbol: "○" },
  bronze: { color: "text-amber-600", glow: "shadow-[0_0_8px_rgba(217,119,6,0.4)]", symbol: "◆" },
  silver: { color: "text-slate-300", glow: "shadow-[0_0_8px_rgba(203,213,225,0.4)]", symbol: "◆" },
  gold: { color: "text-yellow-400", glow: "shadow-[0_0_12px_rgba(250,204,21,0.5)]", symbol: "★" },
  platinum: { color: "text-electric-300", glow: "shadow-glow", symbol: "✦" },
};

export function TrustBadge({
  level,
  score,
  className,
}: {
  level: VouchLevel;
  score?: number;
  className?: string;
}) {
  const s = LEVEL_STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-current/30",
        s.color, s.glow, className
      )}
    >
      <span>{s.symbol}</span>
      <span>{level}</span>
      {score !== undefined && (
        <span className="font-mono opacity-70">·{score}</span>
      )}
    </span>
  );
}
