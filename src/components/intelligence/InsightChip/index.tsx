import { Check } from "lucide-react";

type InsightChipProps = {
  children: React.ReactNode;
};

export default function InsightChip({
  children,
}: InsightChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-ve-ion/20 bg-ve-surface-panel px-3 py-2 text-sm text-white/80">
      <Check className="h-3.5 w-3.5 text-ve-ion" />
      <span>{children}</span>
    </div>
  );
}
