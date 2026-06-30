import type { ReactNode } from "react";

type CyberBadgeProps = {
  children: ReactNode;
  tone?: "default" | "good" | "risk" | "danger";
  className?: string;
};

export function CyberBadge({ children, tone = "default", className = "" }: CyberBadgeProps) {
  const toneClass =
    tone === "good"
      ? "ve-badge-good"
      : tone === "risk"
        ? "ve-badge-risk"
        : tone === "danger"
          ? "ve-badge-danger"
          : "";

  return <span className={`ve-badge ${toneClass} ${className}`}>{children}</span>;
}
