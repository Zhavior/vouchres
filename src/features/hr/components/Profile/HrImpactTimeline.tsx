import React, { useId, useMemo } from 'react';
import type { RealGameLog } from '../../utils/realGameLogs';

export interface HrImpactTimelineProps {
  logs: RealGameLog[];
  variant?: 'full' | 'compact';
  title?: string;
}

interface ImpactPoint {
  x: number;
  y: number;
  impact: number;
  log: RealGameLog;
  outcome: 'hr' | 'hit' | 'out';
}

function shortDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function outcomeFor(log: RealGameLog): ImpactPoint['outcome'] {
  if (log.hrs > 0) return 'hr';
  if (log.hits > 0) return 'hit';
  return 'out';
}

function outcomeLabel(log: RealGameLog): string {
  if (log.hrs > 0) {
    return log.hrs === 1 ? 'Home run game' : `${log.hrs} home run game`;
  }

  if (log.totalBases >= 2) return 'Extra-base production';
  if (log.hits > 0) return 'Hit recorded';
  return 'No hit';
}

function markerRadius(point: ImpactPoint): number {
  if (point.outcome === 'hr') return 8;
  if (point.impact >= 2) return 6;
  if (point.outcome === 'hit') return 5;
  return 4;
}

export const HrImpactTimeline: React.FC<HrImpactTimelineProps> = ({
  logs,
  variant = 'full',
  title = 'Impact timeline',
}) => {
  const gradientId = useId().replace(/:/g, '');
  const chronological = useMemo(() => [...logs].reverse(), [logs]);

  const width = Math.max(620, chronological.length * 76);
  const height = variant === 'compact' ? 188 : 238;
  const chartTop = variant === 'compact' ? 30 : 40;
  const chartBottom = variant === 'compact' ? 132 : 164;
  const chartLeft = 38;
  const chartRight = width - 28;
  const maxImpact = Math.max(
    4,
    ...chronological.map((log) => Math.max(log.totalBases, log.hrs * 4)),
  );

  const points = useMemo<ImpactPoint[]>(() => {
    const count = Math.max(chronological.length - 1, 1);

    return chronological.map((log, index) => {
      const impact = Math.max(log.totalBases, log.hrs * 4);
      const x = chartLeft + ((chartRight - chartLeft) * index) / count;
      const normalized = Math.min(impact, maxImpact) / maxImpact;
      const y = chartBottom - normalized * (chartBottom - chartTop);

      return {
        x,
        y,
        impact,
        log,
        outcome: outcomeFor(log),
      };
    });
  }, [
    chronological,
    chartBottom,
    chartLeft,
    chartRight,
    chartTop,
    maxImpact,
  ]);

  if (!logs.length) return null;

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const hrGames = chronological.filter((log) => log.hrs > 0).length;
  const productiveGames = chronological.filter((log) => log.totalBases >= 2).length;
  const totalBases = chronological.reduce((sum, log) => sum + log.totalBases, 0);

  return (
    <section
      className={`ve-impact-timeline ve-impact-timeline--${variant}`}
      aria-label={`${title}: ${chronological.length} real game results`}
    >
      <header className="ve-impact-timeline__header">
        <div>
          <p className="ve-impact-timeline__eyebrow">VouchEdge performance telemetry</p>
          <h3 className="ve-impact-timeline__title">{title}</h3>
        </div>

        <div className="ve-impact-timeline__summary" aria-label="Timeline summary">
          <span>
            <strong>{hrGames}</strong>
            HR games
          </span>
          <span>
            <strong>{productiveGames}</strong>
            2+ TB games
          </span>
          <span>
            <strong>{totalBases}</strong>
            total bases
          </span>
        </div>
      </header>

      <div className="ve-impact-timeline__viewport">
        <svg
          className="ve-impact-timeline__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Game-by-game total-base production timeline"
          preserveAspectRatio="xMinYMid meet"
        >
          <defs>
            <linearGradient
              id={`${gradientId}-line`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="rgba(148, 163, 184, 0.32)" />
              <stop offset="58%" stopColor="rgba(52, 211, 153, 0.78)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0.95)" />
            </linearGradient>

            <linearGradient
              id={`${gradientId}-fill`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="rgba(52, 211, 153, 0.15)" />
              <stop offset="100%" stopColor="rgba(52, 211, 153, 0)" />
            </linearGradient>

            <filter id={`${gradientId}-glow`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            x={chartLeft}
            y={chartTop}
            width={chartRight - chartLeft}
            height={(chartBottom - chartTop) * 0.34}
            className="ve-impact-timeline__zone ve-impact-timeline__zone--high"
          />
          <rect
            x={chartLeft}
            y={chartTop + (chartBottom - chartTop) * 0.34}
            width={chartRight - chartLeft}
            height={(chartBottom - chartTop) * 0.33}
            className="ve-impact-timeline__zone ve-impact-timeline__zone--mid"
          />
          <rect
            x={chartLeft}
            y={chartTop + (chartBottom - chartTop) * 0.67}
            width={chartRight - chartLeft}
            height={(chartBottom - chartTop) * 0.33}
            className="ve-impact-timeline__zone ve-impact-timeline__zone--low"
          />

          {[0, 1, 2, 3].map((step) => {
            const y =
              chartTop + ((chartBottom - chartTop) * step) / 3;

            return (
              <line
                key={step}
                x1={chartLeft}
                x2={chartRight}
                y1={y}
                y2={y}
                className="ve-impact-timeline__grid"
              />
            );
          })}

          <text
            x={chartLeft}
            y={chartTop - 10}
            className="ve-impact-timeline__zone-label"
          >
            HIGH IMPACT
          </text>

          <text
            x={chartLeft}
            y={chartBottom + 24}
            className="ve-impact-timeline__zone-label"
          >
            GAME SEQUENCE
          </text>

          {points.length > 1 && (
            <>
              <path
                d={`${path} L ${points.at(-1)?.x ?? chartRight} ${chartBottom} L ${points[0].x} ${chartBottom} Z`}
                fill={`url(#${gradientId}-fill)`}
                className="ve-impact-timeline__area"
              />
              <path
                d={path}
                fill="none"
                stroke={`url(#${gradientId}-line)`}
                className="ve-impact-timeline__path"
              />
            </>
          )}

          {points.map((point, index) => {
            const radius = markerRadius(point);
            const markerClass = [
              've-impact-timeline__marker',
              `ve-impact-timeline__marker--${point.outcome}`,
            ].join(' ');

            return (
              <g
                key={`${point.log.date}-${point.log.opponentAbbr}-${index}`}
                className="ve-impact-timeline__event"
                tabIndex={0}
                role="button"
                aria-label={[
                  shortDate(point.log.date),
                  `versus ${point.log.opponentAbbr}`,
                  `${point.log.hits} hits in ${point.log.ab} at-bats`,
                  `${point.log.totalBases} total bases`,
                  `${point.log.hrs} home runs`,
                ].join(', ')}
              >
                <title>
                  {shortDate(point.log.date)} · vs {point.log.opponentAbbr}
                  {' · '}
                  {point.log.hits}-{point.log.ab}
                  {' · '}
                  {point.log.totalBases} TB
                  {point.log.hrs > 0 ? ` · ${point.log.hrs} HR` : ''}
                </title>

                <line
                  x1={point.x}
                  x2={point.x}
                  y1={point.y + radius}
                  y2={chartBottom}
                  className="ve-impact-timeline__stem"
                />

                {point.outcome === 'hr' && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={radius + 7}
                    className="ve-impact-timeline__pulse"
                    filter={`url(#${gradientId}-glow)`}
                  />
                )}

                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  className={markerClass}
                />

                {point.outcome === 'hr' && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={2.25}
                    className="ve-impact-timeline__marker-core"
                  />
                )}

                <g className="ve-impact-timeline__tooltip">
                  <rect
                    x={Math.max(8, Math.min(width - 174, point.x - 82))}
                    y={Math.max(4, point.y - 76)}
                    width={164}
                    height={58}
                    rx={9}
                    className="ve-impact-timeline__tooltip-panel"
                  />
                  <text
                    x={Math.max(18, Math.min(width - 164, point.x - 72))}
                    y={Math.max(22, point.y - 57)}
                    className="ve-impact-timeline__tooltip-title"
                  >
                    {shortDate(point.log.date)} · {point.log.opponentAbbr}
                  </text>
                  <text
                    x={Math.max(18, Math.min(width - 164, point.x - 72))}
                    y={Math.max(39, point.y - 40)}
                    className="ve-impact-timeline__tooltip-stat"
                  >
                    {point.log.hits}-{point.log.ab} · {point.log.totalBases} TB · {point.log.rbi} RBI
                  </text>
                  <text
                    x={Math.max(18, Math.min(width - 164, point.x - 72))}
                    y={Math.max(54, point.y - 25)}
                    className={`ve-impact-timeline__tooltip-result ve-impact-timeline__tooltip-result--${point.outcome}`}
                  >
                    {outcomeLabel(point.log)}
                  </text>
                </g>

                <text
                  x={point.x}
                  y={chartBottom + 18}
                  textAnchor="middle"
                  className="ve-impact-timeline__opponent"
                >
                  {point.log.opponentAbbr}
                </text>

                {variant === 'full' && (
                  <text
                    x={point.x}
                    y={chartBottom + 34}
                    textAnchor="middle"
                    className="ve-impact-timeline__date"
                  >
                    {shortDate(point.log.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <footer className="ve-impact-timeline__legend">
        <span>
          <i className="ve-impact-timeline__legend-dot ve-impact-timeline__legend-dot--hr" />
          Home run
        </span>
        <span>
          <i className="ve-impact-timeline__legend-dot ve-impact-timeline__legend-dot--hit" />
          Productive hit
        </span>
        <span>
          <i className="ve-impact-timeline__legend-dot ve-impact-timeline__legend-dot--out" />
          No hit
        </span>
        <span className="ve-impact-timeline__legend-note">
          Height represents total-base impact
        </span>
      </footer>
    </section>
  );
};
