import type { ReactNode } from "react";
import { AuroraMaxRankedWorkspace } from "../../../../../components/aurora-max/AuroraMaxPrimitives";

export interface OverviewViewProps {
  children: ReactNode;
}

export default function OverviewView({
  children,
}: OverviewViewProps) {
  return (
    <section data-workspace="overview" className="min-w-0">
      <AuroraMaxRankedWorkspace
        title="Research workspace"
        subtitle="Ranked HR candidates with explicit lineup, source, and research receipt states."
        className="hr-research-workspace relative flex flex-1 flex-col"
      >
        {children}
      </AuroraMaxRankedWorkspace>
    </section>
  );
}
