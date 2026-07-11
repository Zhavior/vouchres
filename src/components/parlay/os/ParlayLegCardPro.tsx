import React from "react";
import type { Leg } from "../../../types";
import { projectSmartParlayLegFromLeg } from "../../../domain/parlay/smartParlayProject";
import SmartParlayLegCard from "./SmartParlayLegCard";

/** @deprecated Use SmartParlayLegCard / SmartParlayLegCardFromLeg instead. */
export default React.memo(function ParlayLegCardPro({
  leg,
  onRemove,
  onEdit,
  compact = false,
  isWeak = false,
}: {
  leg: Leg;
  onRemove?: () => void;
  onEdit?: () => void;
  compact?: boolean;
  isWeak?: boolean;
}) {
  return (
    <SmartParlayLegCard
      leg={projectSmartParlayLegFromLeg(leg)}
      odds={leg.odds}
      onEdit={onEdit}
      onRemove={onRemove}
      compact={compact}
      isWeak={isWeak}
    />
  );
});
