import { HeroActions } from "./HeroActions";

interface HeroContentProps {
  onViewBoard?: () => void;
  onViewResults?: () => void;
}

export function HeroContent({
  onViewBoard,
  onViewResults,
}: HeroContentProps) {
  return (
    <div className="aurora-hero-content">
      <p className="aurora-eyebrow">Sports intelligence. Verified daily.</p>

      <h1 className="aurora-hero-title">
        Know the next
        <span> home run.</span>
      </h1>

      <p className="aurora-hero-copy">
        Research today’s strongest MLB opportunities, inspect the evidence,
        and follow every prediction through the Trust Ledger.
      </p>

      <HeroActions
        onPrimary={onViewBoard}
        onSecondary={onViewResults}
      />

      <div className="aurora-hero-proof">
        <span>Live board</span>
        <span aria-hidden="true">•</span>
        <span>Transparent evidence</span>
        <span aria-hidden="true">•</span>
        <span>Verified outcomes</span>
      </div>
    </div>
  );
}
