import { EmptyState } from "@/components/empty-state";
import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  phase,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Icon className="w-5 h-5 text-electric-400" />
          {title}
        </h1>
      </div>
      <EmptyState
        icon={Icon}
        title={`${title} — coming ${phase}`}
        description={description}
      />
    </div>
  );
}
