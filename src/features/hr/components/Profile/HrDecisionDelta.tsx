import React, { useId } from 'react';

export interface HrDecisionDeltaProps {
  modelProbability: number | null | undefined;
  impliedProbability: number | null | undefined;
  bookOdds: number | null | undefined;
  dataConfidence: number | null | undefined;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function pct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function odds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value > 0 ? `+${value}` : `${value}`;
}

function deltaTier(delta: number | null) {
  if (delta == null) {
    return {
      label: 'Awaiting market',
      tone: 'missing',
      explanation: 'A market comparison will appear when both probabilities are available.',
    };
  }

  if (delta >= 0.05) {
    return {
      label: 'Strong positive delta',
      tone: 'strong',
      explanation: 'The model is materially above the market-implied probability.',
    };
  }

  if (delta >= 0.02) {
    return {
      label: 'Positive delta',
      tone: 'positive',
      explanation: 'The model is above market, but the advantage is still moderate.',
    };
  }

  if (delta <= -0.02) {
    return {
      label: 'Market resistance',
      tone: 'negative',
      explanation: 'The market is pricing a higher probability than the model.',
    };
  }

  return {
    label: 'No meaningful delta',
    tone: 'neutral',
    explanation: 'The model and market are broadly aligned.',
  };
}

export const HrDecisionDelta: React.FC<HrDecisionDeltaProps> = ({
  modelProbability,
  impliedProbability,
  bookOdds,
  dataConfidence,
}) => {
  const id = useId().replace(/:/g, '');

  const model =
    modelProbability == null || Number.isNaN(modelProbability)
      ? null
      : clamp(modelProbability * 100);

  const market =
    impliedProbability == null || Number.isNaN(impliedProbability)
      ? null
      : clamp(impliedProbability * 100);

  const delta =
    modelProbability != null &&
    impliedProbability != null &&
    !Number.isNaN(modelProbability) &&
    !Number.isNaN(impliedProbability)
      ? modelProbability - impliedProbability
      : null;

  const tier = deltaTier(delta);

  const confidence =
    dataConfidence == null || Number.isNaN(dataConfidence)
      ? null
      : clamp(dataConfidence);

  const uncertainty =
    confidence == null
      ? 6
      : Math.max(2, 10 - confidence * 0.08);

  const rangeStart =
    model == null ? 0 : clamp(model - uncertainty);

  const rangeEnd =
    model == null ? 0 : clamp(model + uncertainty);

  const deltaPoints =
    delta == null ? null : delta * 100;

  return (
    <section
      className={`ve-decision-delta ve-decision-delta--${tier.tone}`}
      aria-label="Model versus market probability comparison"
    >
      <header className="ve-decision-delta__header">
        <div>
          <p className="ve-decision-delta__eyebrow">
            VouchEdge decision delta
          </p>

          <h3 className="ve-decision-delta__title">
            Model versus market
          </h3>
        </div>

        <div className="ve-decision-delta__verdict">
          <strong>
            {deltaPoints == null
              ? '—'
              : `${deltaPoints >= 0 ? '+' : ''}${deltaPoints.toFixed(1)} pts`}
          </strong>
          <span>{tier.label}</span>
        </div>
      </header>

      <div className="ve-decision-delta__body">
        <div className="ve-decision-delta__chart">
          <div className="ve-decision-delta__scale">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

          <div className="ve-decision-delta__track">
            <div className="ve-decision-delta__grid" />

            {model != null && (
              <div
                className="ve-decision-delta__uncertainty"
                style={{
                  left: `${rangeStart}%`,
                  width: `${Math.max(0, rangeEnd - rangeStart)}%`,
                }}
                aria-label={`Estimated model uncertainty from ${rangeStart.toFixed(1)} to ${rangeEnd.toFixed(1)} percent`}
              />
            )}

            {model != null && market != null && (
              <div
                className="ve-decision-delta__bridge"
                style={{
                  left: `${Math.min(model, market)}%`,
                  width: `${Math.abs(model - market)}%`,
                }}
              />
            )}

            {market != null && (
              <div
                className="ve-decision-delta__marker ve-decision-delta__marker--market"
                style={{ left: `${market}%` }}
              >
                <i />
                <span>
                  Market
                  <strong>{pct(impliedProbability)}</strong>
                </span>
              </div>
            )}

            {model != null && (
              <div
                className="ve-decision-delta__marker ve-decision-delta__marker--model"
                style={{ left: `${model}%` }}
              >
                <i />
                <span>
                  Model
                  <strong>{pct(modelProbability)}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="ve-decision-delta__metrics">
          <div>
            <span>Model probability</span>
            <strong>{pct(modelProbability)}</strong>
            <small>
              {confidence == null
                ? 'Confidence unavailable'
                : `${Math.round(confidence)} confidence`}
            </small>
          </div>

          <div>
            <span>Market implied</span>
            <strong>{pct(impliedProbability)}</strong>
            <small>{odds(bookOdds)} listed odds</small>
          </div>

          <div>
            <span>Decision status</span>
            <strong>{tier.label}</strong>
            <small>{tier.explanation}</small>
          </div>
        </div>
      </div>

      <footer className="ve-decision-delta__footer">
        <span>
          <i className="ve-decision-delta__legend-model" />
          VouchEdge model
        </span>

        <span>
          <i className="ve-decision-delta__legend-market" />
          Market implied
        </span>

        <span>
          <i className="ve-decision-delta__legend-range" />
          Confidence range
        </span>
      </footer>

      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-delta`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(148,163,184,0.3)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0.9)" />
          </linearGradient>
        </defs>
      </svg>
    </section>
  );
};
