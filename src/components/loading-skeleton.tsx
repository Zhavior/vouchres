import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-navy-700/60 animate-pulse"
          style={{ width: `${[100, 80, 60][i % 3]}%` }}
        />
      ))}
    </div>
  );
}
