import { describe, expect, it } from 'vitest';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import {
  buildProjectionMatrix,
  matrixMetric,
  type MatrixMetricId,
} from '../src/features/hr-next/utils/projectionMatrix';
import {
  buildVoronoiCells,
  dispersePoints,
  placeLabels,
} from '../src/features/hr-next/utils/matrixLayout';

function row(overrides: Partial<HrWatchRow> & { stableId: string }): HrWatchRow {
  return {
    playerName: `Player ${overrides.stableId}`,
    playerId: overrides.stableId,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    gamePk: 1,
    gameTime: null,
    headshotUrl: null,
    rank: null,
    hrScore: 80,
    hitterPower: 100,
    pitcherVulnerability: 60,
    parkFactor: 100,
    recentForm: 50,
    vouchScore: 50,
    dataConfidence: 70,
    truthStatus: 'projected',
    riskTier: 'Core',
    oddsLabel: 'Odds TBD',
    reasons: [],
    warnings: [],
    sourceMode: 'curated',
    ...overrides,
  };
}

const BASE_OPTIONS = {
  xId: 'pitcherVulnerability' as MatrixMetricId,
  yId: 'hitterPower' as MatrixMetricId,
  sizeId: 'hrpi' as MatrixMetricId,
  thresholdMode: 'median' as const,
  rangeMode: 'fit' as const,
};

describe('projection matrix — quadrant thresholds', () => {
  const values = [10, 20, 30, 40, 50, 60, 70, 80];
  const rows = values.map((value, i) =>
    row({ stableId: `p${i}`, pitcherVulnerability: value, hitterPower: value }),
  );

  it('splits at the median of the plotted pool', () => {
    const model = buildProjectionMatrix(rows, { ...BASE_OPTIONS, thresholdMode: 'median' });
    expect(model.xScale.threshold).toBe(45);
    expect(model.quadrants[0].count).toBe(4);
  });

  it('splits at the upper quartile when asked, leaving the favourable 25%', () => {
    const model = buildProjectionMatrix(rows, { ...BASE_OPTIONS, thresholdMode: 'quartile' });
    expect(model.xScale.threshold).toBe(62.5);
    // Only the rows at or above the 75th percentile stay in the prime quadrant.
    expect(model.quadrants[0].count).toBe(2);
  });

  it('reads the quartile from the favourable side for a lower-is-better axis', () => {
    const priced = values.map((value, i) =>
      row({
        stableId: `q${i}`,
        // impliedProbability is stored 0–1 and read as a percentage.
        impliedProbability: value / 100,
        hrProbability: 0.2,
      }),
    );
    const model = buildProjectionMatrix(priced, {
      ...BASE_OPTIONS,
      xId: 'impliedProb',
      thresholdMode: 'quartile',
    });
    expect(matrixMetric('impliedProb').higherIsBetter).toBe(false);
    // 25th percentile of the raw values, because a shorter price is the good side.
    expect(model.xScale.threshold).toBeCloseTo(27.5, 5);
  });
});

describe('projection matrix — Statcast resolution', () => {
  // Every row publishes the same saturated layer score; only Statcast separates them.
  const tied = [0.31, 0.42, 0.55, 0.61, 0.7, 0.79].map((xslg, i) =>
    row({
      stableId: `t${i}`,
      hitterPower: 100,
      xslg,
      barrelRate: 0.05 + i * 0.02,
      avgExitVelo: 86 + i,
    }),
  );

  it('leaves the published layer alone until resolution is asked for', () => {
    const model = buildProjectionMatrix(tied, BASE_OPTIONS);
    expect(new Set(model.points.map((point) => point.y)).size).toBe(1);
    expect(model.resolutions).toHaveLength(0);
  });

  it('breaks a multi-way tie into distinct continuous values', () => {
    const model = buildProjectionMatrix(tied, { ...BASE_OPTIONS, resolveWithStatcast: true });
    const ys = model.points.map((point) => point.y);
    expect(new Set(ys).size).toBe(tied.length);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(100);
    expect(model.distinctCoordinates).toBe(tied.length);

    const [resolution] = model.resolutions;
    expect(resolution.componentsUsed).toEqual(['xSLG', 'Barrel %', 'Avg exit velocity']);
    expect(resolution.componentsDropped).toEqual([]);
    expect(resolution.resolvedRows).toBe(tied.length);
  });

  it('drops a component the feed does not publish rather than inventing it', () => {
    const withoutExitVelo = tied.map((entry) => ({ ...entry, avgExitVelo: null }));
    const model = buildProjectionMatrix(withoutExitVelo, {
      ...BASE_OPTIONS,
      resolveWithStatcast: true,
    });
    expect(model.resolutions[0].componentsDropped).toEqual(['Avg exit velocity']);
    expect(model.resolutions[0].componentsUsed).toEqual(['xSLG', 'Barrel %']);
  });

  it('keeps the published layer when no component can be standardised', () => {
    const noStatcast = tied.map((entry) => ({
      ...entry,
      xslg: null,
      barrelRate: null,
      avgExitVelo: null,
    }));
    const model = buildProjectionMatrix(noStatcast, {
      ...BASE_OPTIONS,
      resolveWithStatcast: true,
    });
    expect(model.resolutions).toHaveLength(0);
    expect(model.points).toHaveLength(noStatcast.length);
    expect(model.points.every((point) => point.y === 100)).toBe(true);
  });

  it('holds a row out of the plot when the composite cannot resolve it', () => {
    const mixed = [
      ...tied,
      row({ stableId: 'blind', hitterPower: 100, xslg: null, barrelRate: null, avgExitVelo: null }),
    ];
    const model = buildProjectionMatrix(mixed, { ...BASE_OPTIONS, resolveWithStatcast: true });
    expect(model.points.map((point) => point.id)).not.toContain('blind');
    expect(model.excluded.map((entry) => entry.row.stableId)).toContain('blind');
    expect(model.resolutions[0].unresolvedRows).toBe(1);
  });
});

describe('projection matrix — coverage', () => {
  it('counts a metric the pipeline never publishes as zero', () => {
    const rows = [row({ stableId: 'a' }), row({ stableId: 'b' })];
    const model = buildProjectionMatrix(rows, BASE_OPTIONS);
    expect(model.coverage.weather).toBe(0);
    expect(model.coverage.impliedProb).toBe(0);
    expect(model.coverage.evEdge).toBe(0);
    expect(model.coverage.hitterPower).toBe(2);
  });
});

describe('matrix layout — node dispersal', () => {
  const rect = { x0: 0, y0: 0, x1: 400, y1: 300 };

  it('fans out nodes sharing a coordinate and leaves one on the true spot', () => {
    const stacked = Array.from({ length: 6 }, (_, i) => ({
      id: `n${i}`,
      cx: 200,
      cy: 150,
      r: 4,
    }));
    const result = dispersePoints(stacked, rect);

    expect(result.coincident).toBe(6);
    expect(result.displaced).toBe(5);
    expect(result.nodes[0].shift).toBe(0);

    const keys = new Set(result.nodes.map((node) => `${node.cx.toFixed(2)}|${node.cy.toFixed(2)}`));
    expect(keys.size).toBe(6);
  });

  it('never moves a node further than its budget, and keeps it in frame', () => {
    const stacked = Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, cx: 0, cy: 0, r: 5 }));
    const result = dispersePoints(stacked, rect, { maxShift: 10 });
    for (const node of result.nodes) {
      expect(node.shift).toBeLessThanOrEqual(10.001);
      expect(node.cx).toBeGreaterThanOrEqual(rect.x0);
      expect(node.cy).toBeGreaterThanOrEqual(rect.y0);
    }
  });

  it('leaves an isolated node exactly where its data puts it', () => {
    const result = dispersePoints(
      [
        { id: 'lonely', cx: 40, cy: 40, r: 4 },
        { id: 'far', cx: 300, cy: 250, r: 4 },
      ],
      rect,
    );
    expect(result.displaced).toBe(0);
    expect(result.nodes[0].cx).toBe(40);
    expect(result.nodes[0].cy).toBe(40);
  });

  it('reports the pile-up but moves nothing when separation is off', () => {
    const stacked = Array.from({ length: 4 }, (_, i) => ({ id: `n${i}`, cx: 10, cy: 10, r: 3 }));
    const result = dispersePoints(stacked, rect, { maxShift: 0 });
    expect(result.coincident).toBe(4);
    expect(result.displaced).toBe(0);
    expect(result.nodes.every((node) => node.cx === 10 && node.cy === 10)).toBe(true);
  });

  it('is deterministic across runs', () => {
    const build = () => Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, cx: 120, cy: 90, r: 4 }));
    const first = dispersePoints(build(), rect).nodes.map((node) => [node.cx, node.cy]);
    const second = dispersePoints(build(), rect).nodes.map((node) => [node.cx, node.cy]);
    expect(first).toEqual(second);
  });
});

describe('matrix layout — labels', () => {
  const rect = { x0: 0, y0: 0, x1: 400, y1: 300 };

  it('never places two labels on top of each other', () => {
    const nodes = Array.from({ length: 8 }, (_, i) => ({ cx: 60 + i * 3, cy: 150 + i * 2, r: 4 }));
    const candidates = nodes.map((node, i) => ({
      id: `n${i}`,
      text: 'Guerrero',
      cx: node.cx,
      cy: node.cy,
      r: node.r,
    }));
    const placed = placeLabels(candidates, nodes, rect, { limit: 8 });

    const boxes = placed.map((label) => {
      const width = label.text.length * 5.45;
      const x0 = label.anchor === 'start' ? label.x : label.anchor === 'end' ? label.x - width : label.x - width / 2;
      return { x0, x1: x0 + width, y0: label.y - 3 - 5.5, y1: label.y - 3 + 5.5 };
    });

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
        expect(overlap).toBe(false);
      }
    }
  });

  it('keeps every label inside the plot frame', () => {
    const nodes = [{ cx: 396, cy: 4, r: 4 }];
    const placed = placeLabels(
      [{ id: 'edge', text: 'Guerrero', cx: 396, cy: 4, r: 4 }],
      nodes,
      rect,
      { limit: 1 },
    );
    for (const label of placed) {
      const width = label.text.length * 5.45;
      const x0 = label.anchor === 'start' ? label.x : label.anchor === 'end' ? label.x - width : label.x - width / 2;
      expect(x0).toBeGreaterThanOrEqual(rect.x0);
      expect(x0 + width).toBeLessThanOrEqual(rect.x1);
    }
  });

  it('draws a leader line only when the label leaves its node flank', () => {
    const nodes = [{ cx: 200, cy: 150, r: 4 }];
    const [label] = placeLabels(
      [{ id: 'solo', text: 'Judge', cx: 200, cy: 150, r: 4 }],
      nodes,
      rect,
      { limit: 1 },
    );
    expect(label.leader).toBeNull();
  });
});

describe('matrix layout — Voronoi hover layer', () => {
  const rect = { x0: 0, y0: 0, x1: 100, y1: 100 };

  it('gives every distinct node a cell', () => {
    const cells = buildVoronoiCells(
      [
        { id: 'a', cx: 25, cy: 25 },
        { id: 'b', cx: 75, cy: 25 },
        { id: 'c', cx: 25, cy: 75 },
        { id: 'd', cx: 75, cy: 75 },
      ],
      rect,
    );
    expect(cells).not.toBeNull();
    expect(cells!.map((cell) => cell.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    for (const cell of cells!) expect(cell.path.startsWith('M')).toBe(true);
  });

  it('collapses duplicate coordinates instead of emitting empty cells', () => {
    const cells = buildVoronoiCells(
      [
        { id: 'a', cx: 50, cy: 50 },
        { id: 'b', cx: 50, cy: 50 },
      ],
      rect,
    );
    expect(cells).toHaveLength(1);
  });

  it('declines past the site cap so the caller can fall back', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, cx: i, cy: i }));
    expect(buildVoronoiCells(many, rect, 10)).toBeNull();
  });
});
