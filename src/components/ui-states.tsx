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

export function APIConfigError({ className }: { className?: string }) {
  return (
    <div className={cn("ve-card p-6 text-center", className)} style={{ borderColor: "rgba(250,204,21,0.2)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--ve-warning)" }}>Backend API not configured</p>
      <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>
        Add <code className="px-1 rounded bg-black/30 text-electric-300">VITE_API_URL</code> in your Vercel environment variables pointing to your deployed backend.
      </p>
    </div>
  );
}

export function BackendNotReady({ endpoint, className }: { endpoint: string; className?: string }) {
  return (
    <div className={cn("ve-card p-6 text-center", className)} style={{ borderColor: "rgba(250,204,21,0.2)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--ve-warning)" }}>Backend endpoint not ready</p>
      <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>
        <code className="px-1 rounded bg-black/30 text-electric-300">{endpoint}</code> is not available on the backend yet.
      </p>
    </div>
  );
}

export function DebugNote({ message, className }: { message: string; className?: string }) {
  if (import.meta.env.PROD) return null;
  return (
    <div className={cn("text-[10px] font-mono px-3 py-1.5 rounded-lg", className)} style={{ background: "rgba(250,204,21,0.05)", color: "var(--ve-warning)", border: "1px solid rgba(250,204,21,0.15)" }}>
      DEV: {message}
    </div>
  );
}
