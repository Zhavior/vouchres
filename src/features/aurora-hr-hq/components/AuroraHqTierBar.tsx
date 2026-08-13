import { INTEL_V2_TIERS, type IntelV2DisplayTier } from '../../hr/presentWatchRow';

const TIER_META: Record<IntelV2DisplayTier, { index: string; detail: string }> = {
  Elite:    { index: '01', detail: 'Top-resolution signal stacks' },
  Strong:   { index: '02', detail: 'Balanced multi-factor rows' },
  Watch:    { index: '03', detail: 'Context or confirmation needed' },
  Sleepers: { index: '04', detail: 'Deliberate investigation rows' },
};

type Props = {
  counts: Record<IntelV2DisplayTier, number>;
  selected: string[];
  onToggle: (tier: IntelV2DisplayTier) => void;
};

export function AuroraHqTierBar({ counts, selected, onToggle }: Props) {
  return (
    <div className="aurora-hq__tier-bar aurora-hq-glass" role="group" aria-label="Tier quick filters">
      {INTEL_V2_TIERS.map((tier) => {
        const active  = selected.includes(tier);
        const hasRows = counts[tier] > 0;
        const meta    = TIER_META[tier];
        return (
          <button
            key={tier}
            type="button"
            onClick={() => onToggle(tier)}
            aria-pressed={active}
            aria-label={`${tier} tier — ${counts[tier]} rows`}
            className={`aurora-hq__tier-pill ${active ? 'is-active' : 'is-off'}`}
          >
            {hasRows && active ? (
              <span className="aurora-hq__tier-dot" aria-hidden="true" />
            ) : null}
            <span className="aurora-hq__tier-label">{meta.index} · {tier}</span>
            <span className="aurora-hq__tier-count">{String(counts[tier]).padStart(2, '0')}</span>
            <span className="aurora-hq__tier-label" style={{ fontSize: '0.4rem', marginTop: '0.1rem' }}>{meta.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
