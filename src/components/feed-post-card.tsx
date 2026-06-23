import { cn } from "@/lib/utils";
import { TrustBadge } from "./trust-badge";
import { ResultBadge } from "./result-badge";
import { timeAgo } from "@/lib/utils";
import { Heart, MessageSquare, Shield, Flag, Trophy, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { VouchLevel, PickResult } from "@/types";

export interface FeedPostCardProps {
  username: string;
  avatarUrl?: string;
  vouchLevel: VouchLevel;
  trustScore: number;
  type: "pick" | "parlay" | "reasoning" | "win" | "loss" | "screenshot";
  body: string;
  market?: string;
  pickResult?: PickResult;
  postedBeforeGame?: boolean;
  mediaUrls?: string[];
  timestamp: string;
  likes?: number;
  comments?: number;
  vouches?: number;
  className?: string;
}

export function FeedPostCard({
  username,
  avatarUrl,
  vouchLevel,
  trustScore,
  type,
  body,
  market,
  pickResult,
  postedBeforeGame,
  mediaUrls = [],
  timestamp,
  likes = 0,
  comments = 0,
  vouches = 0,
  className,
}: FeedPostCardProps) {
  const [liked, setLiked] = useState(false);
  const [vouched, setVouched] = useState(false);

  return (
    <div className={cn("glass-card glass-card-hover p-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-navy-700 border border-electric-500/20 overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-electric-500/60 font-bold">
              {username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-100">@{username}</span>
            {(vouchLevel === "gold" || vouchLevel === "platinum") && (
              <span className="verified-badge">
                <ShieldCheck className="w-2.5 h-2.5" />
                VERIFIED
              </span>
            )}
            <TrustBadge level={vouchLevel} score={trustScore} />
            {postedBeforeGame && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/30">
                ✓ PRE-GAME
              </span>
            )}
            <span className="text-[10px] text-slate-500 ml-auto">{timeAgo(timestamp)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
            <span className="font-mono uppercase tracking-wider text-electric-300">{type}</span>
            {market && <span className="font-mono">· {market}</span>}
            {pickResult && <ResultBadge result={pickResult} />}
          </div>
        </div>
      </div>

      {/* Body */}
      {body && (
        <p className="mt-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{body}</p>
      )}

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {mediaUrls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-navy-900 border border-navy-700 overflow-hidden"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Win banner */}
      {type === "win" && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30">
          <Trophy className="w-4 h-4 text-success" />
          <span className="text-xs font-semibold text-success">Verified Win</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-navy-700 flex items-center gap-4 text-xs">
        <button
          onClick={() => setLiked(!liked)}
          className={cn(
            "inline-flex items-center gap-1.5 transition-colors",
            liked ? "text-danger" : "text-slate-400 hover:text-danger"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
          <span className="font-mono">{likes + (liked ? 1 : 0)}</span>
        </button>
        <button className="inline-flex items-center gap-1.5 text-slate-400 hover:text-electric-300 transition-colors">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="font-mono">{comments}</span>
        </button>
        <button
          onClick={() => setVouched(!vouched)}
          className={cn(
            "inline-flex items-center gap-1.5 transition-colors font-semibold",
            vouched ? "text-electric-300" : "text-slate-400 hover:text-electric-300"
          )}
        >
          <Shield className={cn("w-3.5 h-3.5", vouched && "fill-current")} />
          <span className="font-mono">Vouch · {vouches + (vouched ? 1 : 0)}</span>
        </button>
        <button className="ml-auto text-slate-500 hover:text-danger transition-colors">
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
