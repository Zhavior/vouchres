import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { Trophy, Bell, Shield, TrendingUp, AlertTriangle, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NotificationCardProps {
  type:
    | "pick_graded"
    | "hr_hit"
    | "parlay_won"
    | "parlay_lost"
    | "capper_posted"
    | "game_delayed"
    | "big_win"
    | "trust_up"
    | "subscriber_joined";
  title: string;
  body?: string;
  timestamp: string;
  read?: boolean;
  className?: string;
}

const TYPE_META: Record<NotificationCardProps["type"], { icon: LucideIcon; color: string }> = {
  pick_graded: { icon: Bell, color: "text-electric-300" },
  hr_hit: { icon: Trophy, color: "text-success" },
  parlay_won: { icon: Trophy, color: "text-success" },
  parlay_lost: { icon: AlertTriangle, color: "text-danger" },
  capper_posted: { icon: Users, color: "text-electric-300" },
  game_delayed: { icon: AlertTriangle, color: "text-warning" },
  big_win: { icon: Trophy, color: "text-success" },
  trust_up: { icon: Shield, color: "text-electric-300" },
  subscriber_joined: { icon: TrendingUp, color: "text-electric-300" },
};

export function NotificationCard({
  type,
  title,
  body,
  timestamp,
  read,
  className,
}: NotificationCardProps) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "glass-card p-3 flex items-start gap-3 transition-all",
        !read && "border-electric-500/40",
        className
      )}
    >
      <div className={cn("mt-0.5", meta.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">{title}</span>
          {!read && (
            <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-pulse" />
          )}
        </div>
        {body && <p className="mt-0.5 text-xs text-slate-400">{body}</p>}
        <span className="mt-1 inline-block text-[10px] text-slate-500 font-mono">
          {timeAgo(timestamp)}
        </span>
      </div>
    </div>
  );
}
