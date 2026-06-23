/**
 * Badge components — trust, confidence, risk, sport, status.
 */
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Clock, XCircle } from "lucide-react";

export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "var(--ve-success)" : pct >= 50 ? "var(--ve-accent)" : "var(--ve-warning)";
  return (
    <span className="ve-badge" style={{ color, borderColor: color + "40", background: color + "15" }}>
      {pct}% Conf
    </span>
  );
}

export function RiskTierBadge({ tier }: { tier: string }) {
  const styles: Record<string, { color: string; label: string }> = {
    low: { color: "var(--ve-success)", label: "LOW RISK" },
    medium: { color: "var(--ve-accent)", label: "MEDIUM" },
    high: { color: "var(--ve-warning)", label: "HIGH RISK" },
    lottery: { color: "var(--ve-danger)", label: "LOTTO" },
  };
  const s = styles[tier] || styles.medium;
  return (
    <span className="ve-badge" style={{ color: s.color, borderColor: s.color + "40", background: s.color + "15" }}>
      ● {s.label}
    </span>
  );
}

export function SportBadge({ sport }: { sport: string }) {
  const styles: Record<string, { icon: string; label: string }> = {
    mlb: { icon: "⚾", label: "MLB" },
    nba: { icon: "🏀", label: "NBA" },
    nfl: { icon: "🏈", label: "NFL" },
    nhl: { icon: "🏒", label: "NHL" },
  };
  const s = styles[sport?.toLowerCase()] || { icon: "🎮", label: sport?.toUpperCase() || "SPORT" };
  return <span className="ve-badge">{s.icon} {s.label}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { color: string; icon: any; label: string }> = {
    saved: { color: "var(--ve-accent)", icon: Clock, label: "SAVED" },
    locked: { color: "var(--ve-warning)", icon: Lock, label: "LOCKED" },
    grading: { color: "var(--ve-warning)", icon: Clock, label: "GRADING" },
    final: { color: "var(--ve-text-dim)", icon: CheckCircle2, label: "FINAL" },
    won: { color: "var(--ve-success)", icon: CheckCircle2, label: "WON" },
    lost: { color: "var(--ve-danger)", icon: XCircle, label: "LOST" },
    push: { color: "var(--ve-warning)", icon: AlertTriangle, label: "PUSH" },
    void: { color: "var(--ve-text-dim)", icon: XCircle, label: "VOID" },
    pending: { color: "var(--ve-accent)", icon: Clock, label: "PENDING" },
  };
  const s = styles[status] || styles.pending;
  const Icon = s.icon;
  return (
    <span className="ve-badge" style={{ color: s.color, borderColor: s.color + "40", background: s.color + "15" }}>
      <Icon className="w-2.5 h-2.5" /> {s.label}
    </span>
  );
}

import { Lock } from "lucide-react";

export function VerifiedBadge() {
  return (
    <span className="ve-badge" style={{ color: "var(--ve-success)", borderColor: "var(--ve-success)", background: "rgba(34,197,94,0.1)" }}>
      <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
    </span>
  );
}

export function PreGameBadge() {
  return (
    <span className="ve-badge" style={{ color: "var(--ve-success)", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.1)" }}>
      ✓ PRE-GAME
    </span>
  );
}
