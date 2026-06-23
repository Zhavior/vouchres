/**
 * Shared UI states — empty, loading, error.
 */
import { cn } from "@/lib/utils";

export function EmptyStateCard({ title, description, icon: Icon, action, className }: {
  title: string; description?: string; icon?: any; action?: React.ReactNode; className?: string;
}) {
  const I = Icon || null;
  return (
    <div className={cn("ve-card p-8 text-center flex flex-col items-center", className)}>
      {I && (
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full blur-xl" style={{ background: "var(--ve-badge-bg)" }} />
          <I className="w-10 h-10 relative" strokeWidth={1.5} style={{ color: "var(--ve-accent)", opacity: 0.5 }} />
        </div>
      )}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 text-xs max-w-xs" style={{ color: "var(--ve-text-muted)" }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("ve-card p-4 space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded animate-pulse" style={{ background: "var(--ve-card-border)", width: `${[100, 75, 50][i % 3]}%` }} />
      ))}
    </div>
  );
}

export function ErrorCard({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn("ve-card p-6 text-center", className)} style={{ borderColor: "rgba(239,68,68,0.2)" }}>
      <p className="text-sm" style={{ color: "var(--ve-danger)" }}>{message || "Something went wrong"}</p>
      {onRetry && <button onClick={onRetry} className="ve-button-ghost text-xs mt-3">Try again</button>}
    </div>
  );
}
