import { cn } from "@/lib/utils";
import { TrustBadge } from "./trust-badge";
import type { VouchLevel } from "@/types";

export interface UserTrustCardProps {
  username: string;
  avatarUrl?: string;
  trustScore: number;
  vouchLevel: VouchLevel;
  winRate?: number;
  verifiedPicks?: number;
  bestMarkets?: string[];
  className?: string;
}

export function UserTrustCard({
  username,
  avatarUrl,
  trustScore,
  vouchLevel,
  winRate,
  verifiedPicks,
  bestMarkets = [],
  className,
}: UserTrustCardProps) {
  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-navy-700 border border-electric-500/20 overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-electric-500/60 text-lg font-bold">
              {username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 truncate">@{username}</h3>
          </div>
          <div className="mt-1">
            <TrustBadge level={vouchLevel} score={trustScore} />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat
          label="WIN RATE"
          value={winRate !== undefined ? `${(winRate * 100).toFixed(1)}%` : "—"}
        />
        <Stat
          label="VERIFIED PICKS"
          value={verifiedPicks !== undefined ? String(verifiedPicks) : "—"}
        />
      </div>

      {bestMarkets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {bestMarkets.map((m) => (
            <span
              key={m}
              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-electric-500/10 text-electric-300 border border-electric-500/20"
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-navy-900/60 border border-navy-700 px-2 py-1.5">
      <div className="text-[9px] text-slate-500 font-mono tracking-wider">{label}</div>
      <div className="text-sm font-bold font-mono text-slate-100">{value}</div>
    </div>
  );
}
