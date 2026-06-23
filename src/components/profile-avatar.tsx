/**
 * ProfileAvatar — avatar with animated border ring.
 * Border type is determined by trust score, vouch level, or subscription.
 */
import { cn } from "@/lib/utils";

export type BorderType =
  | "default" | "nba" | "mlb" | "verified-capper" | "high-trust"
  | "hot-streak" | "parlay-winner" | "top-1pct" | "founder"
  | "premium" | "ai-analyst" | "community-vouched";

const BORDER_STYLES: Record<BorderType, { ring: string; glow: string }> = {
  "default": { ring: "border-[var(--ve-card-border)]", glow: "" },
  "nba": { ring: "border-2 border-purple-500/50", glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]" },
  "mlb": { ring: "border-2 border-emerald-500/50", glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]" },
  "verified-capper": { ring: "border-2 border-blue-400/60", glow: "shadow-[0_0_16px_rgba(59,130,246,0.35)]" },
  "high-trust": { ring: "border-2 border-cyan-400/60", glow: "shadow-[0_0_16px_rgba(34,211,238,0.35)]" },
  "hot-streak": { ring: "border-2 border-orange-400/60", glow: "shadow-[0_0_16px_rgba(251,146,60,0.35)]" },
  "parlay-winner": { ring: "border-2 border-amber-400/60", glow: "shadow-[0_0_16px_rgba(251,191,36,0.35)]" },
  "top-1pct": { ring: "border-2 border-yellow-400/70", glow: "shadow-[0_0_20px_rgba(250,204,21,0.4)]" },
  "founder": { ring: "border-2 border-pink-400/60", glow: "shadow-[0_0_16px_rgba(244,114,182,0.35)]" },
  "premium": { ring: "border-2 border-indigo-400/60", glow: "shadow-[0_0_16px_rgba(99,102,241,0.35)]" },
  "ai-analyst": { ring: "border-2 border-teal-400/60", glow: "shadow-[0_0_16px_rgba(20,184,166,0.35)]" },
  "community-vouched": { ring: "border-2 border-green-400/50", glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]" },
};

export function getBorderForUser(opts: {
  trustScore?: number;
  vouchLevel?: string;
  isFounder?: boolean;
  isPremium?: boolean;
  streak?: number;
}): BorderType {
  const { trustScore = 0, vouchLevel = "", isFounder, isPremium, streak = 0 } = opts;
  if (isFounder) return "founder";
  if (trustScore >= 800) return "top-1pct";
  if (streak >= 5) return "hot-streak";
  if (vouchLevel === "platinum" || vouchLevel === "gold") return "verified-capper";
  if (trustScore >= 600) return "high-trust";
  if (isPremium) return "premium";
  if (trustScore >= 300) return "community-vouched";
  return "default";
}

export function ProfileAvatar({
  username,
  avatarUrl,
  borderType = "default",
  size = "md",
  className,
}: {
  username: string;
  avatarUrl?: string | null;
  borderType?: BorderType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };
  const style = BORDER_STYLES[borderType] || BORDER_STYLES.default;

  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-[var(--ve-bg)]", sizes[size], style.ring, style.glow, className)}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover rounded-full" />
      ) : (
        <span style={{ color: "var(--ve-accent)" }}>{username.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export function TrustMiniBadge({ score, level }: { score: number; level?: string }) {
  const label = score >= 90 ? "Elite" : score >= 80 ? "Strong" : score >= 70 ? "Solid" : score >= 60 ? "Lean" : score >= 50 ? "Watch" : "Fade";
  const color = score >= 80 ? "var(--ve-success)" : score >= 60 ? "var(--ve-accent)" : score >= 50 ? "var(--ve-warning)" : "var(--ve-danger)";
  return (
    <span className="ve-badge" style={{ color, borderColor: color + "40", background: color + "15" }}>
      {score} · {label}
    </span>
  );
}
