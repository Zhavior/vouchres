interface JudgeMeterProps {
  score: number;
}

export default function JudgeMeter({
  score,
}: JudgeMeterProps) {
  const width = Math.max(0, Math.min(100, score));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/60">
          Judge Score
        </span>

        <span className="text-sm font-semibold text-white">
          {score}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-vouch-cyan transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
