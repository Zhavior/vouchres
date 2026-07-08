import type { ReactNode } from "react";

type CyberPanelProps = {
  children: ReactNode;
  className?: string;
  glow?: boolean;
};

export function CyberPanel({ children, className = "", glow = false }: CyberPanelProps) {
  return (
    <section className={`ve-panel ${glow ? "ve-panel-glow" : ""} ${className}`}>
      {children}
    </section>
  );
}
