import React from "react";

import {
  DataFreshness,
  MarketDecision,
  EvidenceStack,
  RiskSummary,
  StickyResearchAction,
} from "../../../../components/player-intelligence";

import { HrOverviewDossier } from "./HrOverviewDossier";

interface Props {
  player: any;
  decision: any;
  boardFreshness: "fresh" | "stale" | "unknown";
  evidenceItems: any[];
  formLogs: any[];
  realLogState: any;
  onAddToSlip: (player: any) => void;
}

export default function OverviewSection({
  player,
  decision,
  boardFreshness,
  evidenceItems,
  formLogs,
  realLogState,
  onAddToSlip,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      <DataFreshness
        label={decision.freshnessLabel}
        tone={
          boardFreshness === "fresh"
            ? "fresh"
            : boardFreshness === "stale"
            ? "unavailable"
            : "stale"
        }
        detail={decision.lineupLabel}
        className="self-start"
      />

      <MarketDecision
        eyebrow="Decision brief"
        title="The case, the risk, and what is confirmed."
        score={player.hrScore}
        statusItems={[
          decision.lineupLabel,
          `vs ${decision.pitcherLabel}`,
        ]}
        action={
          <StickyResearchAction
            eyebrow="Home run market"
            label="Choose HR prop"
            disabled={!decision.canAddToSlip}
            disabledReason={decision.addToSlipBlockReason}
            onClick={() => onAddToSlip(player)}
          />
        }
      />

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5">
        <EvidenceStack
          items={
            evidenceItems.length > 0
              ? evidenceItems
              : [
                  {
                    tone: "strongest",
                    text: decision.reason,
                  },
                ]
          }
        />
      </div>

      <RiskSummary
        risk={decision.risk}
        whatCouldChange={
          player.truthStatus !== "official"
            ? "Verify the lineup and market before saving."
            : null
        }
      />

      <HrOverviewDossier
        player={player}
        formLogs={formLogs}
        logState={realLogState}
        variant="full"
      />
    </div>
  );
}
