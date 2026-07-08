import type { ReactNode } from "react";

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}
