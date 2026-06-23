import { cn } from "@/lib/utils";
import type { PickResult } from "@/types";

const RESULT_STYLES: Record<PickResult, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-slate-700/40", text: "text-slate-300", label: "PENDING" },
  won: { bg: "bg-success/15", text: "text-success", label: "WON" },
  lost: { bg: "bg-danger/15", text: "text-danger", label: "LOST" },
  push: { bg: "bg-warning/15", text: "text-warning", label: "PUSH" },
  void: { bg: "bg-slate-700/40", text: "text-slate-400", label: "VOID" },
};

export function ResultBadge({
  result,
  className,
}: {
  result: PickResult;
  className?: string;
}) {
  const s = RESULT_STYLES[result];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider",
        s.bg, s.text, className
      )}
    >
      {s.label}
    </span>
  );
}
