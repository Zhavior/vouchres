import { lazy, Suspense, useState } from "react";
import BrainEdgeShell, { type BrainEdgeView } from "./BrainEdgeShell";
import PickConfirmationBar from "./components/PickConfirmationBar";
import {
  PickSelectionProvider,
  usePickSelectionContext,
} from "./context/PickSelectionContext";
import "./brain-edge.css";

const IntelligenceWorkspace = lazy(
  () => import("../../components/MlbIntelligenceHubZ8")
);

const ProGraphsWorkspace = lazy(
  () => import("../../pages/pro/ProGraphsLabPageZ8")
);

type Props = {
  profile?: unknown;
  onSectionChange?: (section: string) => void;
};

function ModuleLoadingState() {
  return (
    <div
      className="brain-edge-loading rounded-2xl border border-white/10 bg-white/[0.025] p-6"
      role="status"
      aria-live="polite"
    >
      <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
      <p className="mt-3 text-xs text-white/45">
        Loading research workspace…
      </p>
    </div>
  );
}

function BrainEdgeContent({
  profile,
  onSectionChange,
}: Props) {
  const [activeView, setActiveView] =
    useState<BrainEdgeView>("intelligence");

  const { pick } = usePickSelectionContext();

  return (
    <BrainEdgeShell
      activeView={activeView}
      onViewChange={setActiveView}
      header={<PickConfirmationBar pick={pick} />}
    >
      <Suspense fallback={<ModuleLoadingState />}>
        {activeView === "intelligence" ? (
          <IntelligenceWorkspace
            profile={profile}
            onSectionChange={onSectionChange}
          />
        ) : (
          <ProGraphsWorkspace />
        )}
      </Suspense>
    </BrainEdgeShell>
  );
}

export default function BrainEdgeLabPage(props: Props) {
  return (
    <PickSelectionProvider>
      <BrainEdgeContent {...props} />
    </PickSelectionProvider>
  );
}
