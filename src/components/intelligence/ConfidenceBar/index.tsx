type ConfidenceBarProps = {
  value: number;
};

export default function ConfidenceBar({
  value,
}: ConfidenceBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-white/50">
        <span>Confidence</span>
        <span>{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-ve-ion transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
