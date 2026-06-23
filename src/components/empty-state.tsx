import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl",
        "border border-dashed border-electric-500/15",
        "bg-navy-900/30 backdrop-blur-sm",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-electric-500/5 blur-xl" />
        <Icon className="w-10 h-10 text-electric-500/50 relative" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
