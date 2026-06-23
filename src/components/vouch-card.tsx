/**
 * VouchCard — proof-based vouch card with verified status.
 */
import { Shield, Heart, MessageSquare, Bookmark, Flag } from "lucide-react";
import { ProfileAvatar, getBorderForUser, TrustMiniBadge } from "@/components/profile-avatar";
import { StatusBadge, PreGameBadge, VerifiedBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

export interface VouchCardData {
  id: string;
  username: string;
  avatarUrl?: string | null;
  trustScore: number;
  vouchLevel: string;
  type: string;
  body: string;
  market?: string;
  pickResult?: string | null;
  postedBeforeGame?: boolean;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  vouchesCount: number;
  streak?: number;
  isPremium?: boolean;
}

export function VouchCard({ data, onVouch, onTail, className }: {
  data: VouchCardData;
  onVouch?: () => void;
  onTail?: () => void;
  className?: string;
}) {
  const borderType = getBorderForUser({
    trustScore: data.trustScore,
    vouchLevel: data.vouchLevel,
    isPremium: data.isPremium,
    streak: data.streak,
  });

  return (
    <div className={cn("ve-card ve-card-hover p-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <ProfileAvatar username={data.username} avatarUrl={data.avatarUrl} borderType={borderType} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">@{data.username}</span>
            {(data.vouchLevel === "gold" || data.vouchLevel === "platinum") && <VerifiedBadge />}
            <TrustMiniBadge score={data.trustScore} level={data.vouchLevel} />
            {data.postedBeforeGame && <PreGameBadge />}
            {data.pickResult && data.pickResult !== "pending" && <StatusBadge status={data.pickResult} />}
          </div>
          <div className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--ve-text-dim)" }}>
            {data.type.toUpperCase()}{data.market ? ` · ${data.market.toUpperCase()}` : ""} · {timeAgo(data.timestamp)}
          </div>
        </div>
      </div>

      {/* Body */}
      {data.body && <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ve-text)" }}>{data.body}</p>}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t flex items-center gap-4" style={{ borderColor: "var(--ve-card-border)" }}>
        <button className="flex items-center gap-1 text-xs transition-colors" style={{ color: "var(--ve-text-muted)" }}
          onClick={onVouch}>
          <Shield className="w-3.5 h-3.5" /> Vouch · {data.vouchesCount}
        </button>
        <button className="flex items-center gap-1 text-xs" style={{ color: "var(--ve-text-muted)" }} onClick={onTail}>
          <Bookmark className="w-3.5 h-3.5" /> Tail
        </button>
        <button className="flex items-center gap-1 text-xs" style={{ color: "var(--ve-text-muted)" }}>
          <MessageSquare className="w-3.5 h-3.5" /> {data.commentsCount}
        </button>
        <button className="ml-auto text-xs" style={{ color: "var(--ve-text-dim)" }}>
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}
