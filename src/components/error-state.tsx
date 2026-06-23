import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl",
        "border border-danger/20 bg-danger/5 backdrop-blur-sm",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-danger/5 blur-xl" />
        <AlertTriangle className="w-10 h-10 text-danger/80 relative" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-400 max-w-xs">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-electric-300 border border-electric-500/40 hover:bg-electric-500/10 hover:border-electric-500/60 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </button>
      )}
    </div>
  );
}
