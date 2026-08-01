import type { ReactNode } from "react";

export interface OverviewViewProps {
  children: ReactNode;
}

export default function OverviewView({
  children,
}: OverviewViewProps) {
  return (
    <section
      data-workspace="overview"
      className="relative flex flex-1 flex-col"
    >
      {children}
    </section>
  );
}
