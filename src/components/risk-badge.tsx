import { cn } from "@/lib/utils";
import type { RiskTier } from "@/types";

const TIER_STYLES: Record<RiskTier, { bg: string; text: string; border: string; label: string }> = {
  low: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/40",
    label: "LOW RISK",
  },
  medium: {
    bg: "bg-electric-500/10",
    text: "text-electric-300",
    border: "border-electric-500/40",
    label: "MEDIUM",
  },
  high: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/40",
    label: "HIGH RISK",
  },
  lottery: {
    bg: "bg-danger/10",
    text: "text-danger",
    border: "border-danger/40",
    label: "LOTTERY",
  },
};

export function RiskBadge({ tier, className }: { tier: RiskTier; className?: string }) {
  const s = TIER_STYLES[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider border",
        s.bg, s.text, s.border, className
      )}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
