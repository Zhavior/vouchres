/**
 * Player Intelligence — the canonical, domain-neutral component set for any
 * player decision surface (HR board, Player Edge Lab, Daily Players, Player
 * Research, Home, Live Games). HR is the first consumer, not the owner —
 * these components take plain props, never HrWatchRow or other sport-shaped
 * types directly.
 */
export { PlayerIdentityHeader } from './PlayerIdentityHeader';
export type { PlayerIdentityHeaderProps, PlayerIdentityChip } from './PlayerIdentityHeader';

export { MarketDecision } from './MarketDecision';
export type { MarketDecisionProps } from './MarketDecision';

export { ConfidenceSummary } from './ConfidenceSummary';
export type { ConfidenceSummaryProps, ConfidenceStat } from './ConfidenceSummary';

export { EvidenceStack } from './EvidenceStack';
export type { EvidenceStackProps, EvidenceItem, EvidenceTone } from './EvidenceStack';

export { RiskSummary } from './RiskSummary';
export type { RiskSummaryProps } from './RiskSummary';

export { PerformanceChart } from './PerformanceChart';
export type { PerformanceChartProps, PerformanceGameRow, PerformanceChartState } from './PerformanceChart';

export { MatchupBreakdown } from './MatchupBreakdown';
export type { MatchupBreakdownProps, MatchupStat, MatchupBreakdownState } from './MatchupBreakdown';

export { DataFreshness } from './DataFreshness';
export type { DataFreshnessProps, DataFreshnessTone } from './DataFreshness';

export { ProResearchGate } from './ProResearchGate';
export type { ProResearchGateProps } from './ProResearchGate';

export { StickyResearchAction } from './StickyResearchAction';
export type { StickyResearchActionProps } from './StickyResearchAction';
