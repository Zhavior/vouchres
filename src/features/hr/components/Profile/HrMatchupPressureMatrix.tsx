import React, { useMemo, useState } from 'react';
import type { LayerChartRow } from './HrProfileCharts';

interface PressureLayer extends LayerChartRow {
  avg?: number;
  color?: string;
}

export interface HrMatchupPressureMatrixProps {
  layers: PressureLayer[];
  compositeScore: number;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function tierFor(value: number | null | undefined) {
  if (value == null) {
    return { label: 'Unavailable', tone: 'missing' };
  }

  if (value >= 80) {
    return { label: 'Dominant', tone: 'elite' };
  }

  if (value >= 65) {
    return { label: 'Positive', tone: 'positive' };
  }

  if (value >= 45) {
    return { label: 'Neutral', tone: 'neutral' };
  }

  return { label: 'Resistance', tone: 'risk' };
}

function contributionFor(layer: PressureLayer): number {
  if (layer.value == null || layer.weight <= 0) return 0;
  return (clamp(layer.value) * layer.weight) / 100;
}

function formatWeight(weight: number): string {
  return weight > 0 ? `${weight}% weight` : 'Validator';
}

const PressureRail: React.FC<{
  layer: PressureLayer;
  index: number;
  compact?: boolean;
}> = ({ layer, index, compact = false }) => {
  const value = layer.value == null ? null : clamp(layer.value);
  const average = layer.avg == null ? 50 : clamp(layer.avg);
  const tier = tierFor(value);
  const contribution = contributionFor(layer);

  const contributionWidth =
    layer.weight > 0
      ? clamp((contribution / Math.max(layer.weight, 1)) * 100)
      : value ?? 0;

  return (
    <article
      className={[
        've-pressure-rail',
        compact ? 've-pressure-rail--compact' : '',
        `ve-pressure-rail--${tier.tone}`,
      ].join(' ')}
    >
      <div className="ve-pressure-rail__identity">
        <span className="ve-pressure-rail__index">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div>
          <h4>{layer.label}</h4>
          <p>{formatWeight(layer.weight)}</p>
        </div>
      </div>

      <div className="ve-pressure-rail__graph">
        {!compact && (
          <div className="ve-pressure-rail__scale">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        )}

        <div className="ve-pressure-rail__track">
          <div
            className="ve-pressure-rail__average"
            style={{ left: `${average}%` }}
            aria-label={`League reference ${Math.round(average)}`}
          />

          {value != null ? (
            <>
              <div
                className="ve-pressure-rail__fill"
                style={{ width: `${value}%` }}
              />

              <div
                className="ve-pressure-rail__node"
                style={{ left: `${value}%` }}
              >
                <span />
              </div>
            </>
          ) : (
            <div className="ve-pressure-rail__missing">
              Awaiting confirmed data
            </div>
          )}
        </div>

        {!compact && (
          <div className="ve-pressure-rail__contribution">
            <span>Weighted influence</span>

            <div>
              <i style={{ width: `${contributionWidth}%` }} />
            </div>

            <strong>
              {layer.weight > 0 ? `+${contribution.toFixed(1)}` : 'Check'}
            </strong>
          </div>
        )}
      </div>

      <div className="ve-pressure-rail__score">
        <strong>{value == null ? '—' : Math.round(value)}</strong>
        <span>{tier.label}</span>
      </div>
    </article>
  );
};

export const HrMatchupPressureMatrix: React.FC<
  HrMatchupPressureMatrixProps
> = ({ layers, compositeScore }) => {
  const [showUnconfirmed, setShowUnconfirmed] = useState(false);

  const activeLayers = useMemo(
    () =>
      layers.filter(
        (layer) => layer.weight > 0 && layer.value != null,
      ),
    [layers],
  );

  const inactiveLayers = useMemo(
    () =>
      layers.filter(
        (layer) => layer.weight <= 0 || layer.value == null,
      ),
    [layers],
  );

  const strongest = useMemo(
    () =>
      [...activeLayers].sort(
        (a, b) => contributionFor(b) - contributionFor(a),
      )[0],
    [activeLayers],
  );

  const weakest = useMemo(
    () =>
      [...activeLayers].sort(
        (a, b) => (a.value ?? 100) - (b.value ?? 100),
      )[0],
    [activeLayers],
  );

  const confirmedWeight = activeLayers.reduce(
    (sum, layer) => sum + layer.weight,
    0,
  );

  const totalContribution = activeLayers.reduce(
    (sum, layer) => sum + contributionFor(layer),
    0,
  );

  const circumference = 2 * Math.PI * 52;
  const dashOffset =
    circumference - (clamp(compositeScore) / 100) * circumference;

  return (
    <section
      className="ve-pressure-matrix"
      aria-label="VouchEdge matchup pressure matrix"
    >
      <header className="ve-pressure-matrix__header">
        <div>
          <p className="ve-pressure-matrix__eyebrow">
            VouchEdge weighted intelligence
          </p>

          <h3 className="ve-pressure-matrix__title">
            Matchup Pressure Matrix
          </h3>

          <p className="ve-pressure-matrix__description">
            Confirmed signal strength, model weight, league reference,
            and contribution to the final HR score.
          </p>
        </div>

        <div className="ve-pressure-matrix__coverage">
          <span>Confirmed weight</span>
          <strong>{confirmedWeight}%</strong>
        </div>
      </header>

      <div className="ve-pressure-matrix__layout">
        <aside className="ve-pressure-core">
          <div className="ve-pressure-core__visual">
            <svg
              viewBox="0 0 132 132"
              role="img"
              aria-label={`Composite pressure score ${Math.round(compositeScore)}`}
            >
              <circle
                cx="66"
                cy="66"
                r="52"
                className="ve-pressure-core__track"
              />

              <circle
                cx="66"
                cy="66"
                r="52"
                className="ve-pressure-core__progress"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />

              <circle
                cx="66"
                cy="66"
                r="41"
                className="ve-pressure-core__inner"
              />
            </svg>

            <div className="ve-pressure-core__number">
              <strong>{Math.round(compositeScore)}</strong>
              <span>Pressure</span>
            </div>
          </div>

          <div className="ve-pressure-core__metrics">
            <div>
              <span>Confirmed signals</span>
              <strong>{activeLayers.length}</strong>
            </div>

            <div>
              <span>Unconfirmed</span>
              <strong>{inactiveLayers.length}</strong>
            </div>

            <div>
              <span>Weighted total</span>
              <strong>{totalContribution.toFixed(1)}</strong>
            </div>
          </div>

          <div className="ve-pressure-core__readout">
            <div>
              <span>Primary force</span>
              <strong>{strongest?.label ?? 'Unavailable'}</strong>
              <small>
                {strongest
                  ? `+${contributionFor(strongest).toFixed(1)} composite influence`
                  : 'No confirmed signal'}
              </small>
            </div>

            <div>
              <span>Main resistance</span>
              <strong>{weakest?.label ?? 'Unavailable'}</strong>
              <small>
                {weakest
                  ? `${Math.round(weakest.value ?? 0)} signal strength`
                  : 'No confirmed resistance'}
              </small>
            </div>
          </div>
        </aside>

        <div className="ve-pressure-matrix__rails">
          <div className="ve-pressure-matrix__group-head">
            <span>Confirmed weighted signals</span>
            <strong>{activeLayers.length}</strong>
          </div>

          {activeLayers.map((layer, index) => (
            <PressureRail
              key={layer.id}
              layer={layer}
              index={index}
            />
          ))}

          {inactiveLayers.length > 0 && (
            <div className="ve-pressure-matrix__unconfirmed">
              <button
                type="button"
                className="ve-pressure-matrix__unconfirmed-toggle"
                onClick={() => setShowUnconfirmed((current) => !current)}
                aria-expanded={showUnconfirmed}
              >
                <div>
                  <span>Unconfirmed signals</span>
                  <small>
                    Missing or validator-only inputs do not inflate the score
                  </small>
                </div>

                <strong>
                  {inactiveLayers.length}
                  <i>{showUnconfirmed ? '−' : '+'}</i>
                </strong>
              </button>

              {showUnconfirmed && (
                <div className="ve-pressure-matrix__unconfirmed-list">
                  {inactiveLayers.map((layer, index) => (
                    <PressureRail
                      key={layer.id}
                      layer={layer}
                      index={activeLayers.length + index}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="ve-pressure-matrix__legend">
        <span>
          <i className="ve-pressure-matrix__legend-average" />
          League reference
        </span>

        <span>
          <i className="ve-pressure-matrix__legend-node" />
          Player signal
        </span>

        <span>
          Only confirmed weighted inputs contribute to the composite
        </span>
      </footer>
    </section>
  );
};
