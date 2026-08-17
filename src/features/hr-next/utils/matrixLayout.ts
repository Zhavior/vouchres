/**
 * Plot-space layout for the Projection Matrix scatter.
 *
 * Three problems that only exist once the data is on screen, kept out of the
 * component so they can be reasoned about — and tested — as plain geometry:
 *
 *   · coincident nodes — board layers are discrete, so rows land on the exact
 *     same pixel and read as one bubble
 *   · overlapping name labels — the strongest rows cluster, so their labels do
 *     too, and stacked text is worse than no text
 *   · hover in a dense band — a 3px circle is not a pointer target, so hit
 *     testing goes to the nearest node's Voronoi cell instead
 *
 * Nothing here changes a value. Displacement is bounded, reported back to the
 * caller so the legend can state it, and every readout still prints the true
 * measurement.
 */

export interface LayoutRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface LayoutNodeInput {
  id: string;
  cx: number;
  cy: number;
  r: number;
}

export interface LayoutNode extends LayoutNodeInput {
  /** True coordinate before any separation. */
  ox: number;
  oy: number;
  /** Pixels this node was moved to become visible. */
  shift: number;
}

export interface DispersalResult {
  nodes: LayoutNode[];
  /** Nodes that shared an exact coordinate with at least one other node. */
  coincident: number;
  /** Nodes actually moved. */
  displaced: number;
  maxShift: number;
}

/** Golden angle — successive spiral steps never line up into visible arms. */
const GOLDEN_ANGLE = 2.399963229728653;

function clampToRect(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Separate nodes that share a coordinate, then ease apart what still overlaps.
 *
 * Exact ties fan out on a phyllotaxis spiral in a stable order, so the node
 * holding the true coordinate is the same one on every render. The relaxation
 * pass that follows only nudges — every node stays within `maxShift` of where
 * its data puts it, and a node with room around it never moves at all.
 */
export function dispersePoints(
  input: LayoutNodeInput[],
  rect: LayoutRect,
  options: { maxShift?: number; iterations?: number; gap?: number; occlusion?: number } = {},
): DispersalResult {
  const maxShift = options.maxShift ?? 14;
  const iterations = options.iterations ?? 4;
  const gap = options.gap ?? 1.5;
  // Only bubbles buried this far into each other are eased apart. Chasing full
  // separation on a 270-row slate would move most of the plot for no gain —
  // two circles that merely touch are already two readable, hoverable nodes.
  const occlusion = options.occlusion ?? 0.55;

  // A cluster's anchor holds the true coordinate through both passes, so the
  // reader can still point at where the shared value actually is.
  const pinned = new Set<string>();

  const nodes: LayoutNode[] = input.map((node) => ({
    ...node,
    ox: node.cx,
    oy: node.cy,
    shift: 0,
  }));

  if (nodes.length === 0) {
    return { nodes, coincident: 0, displaced: 0, maxShift: 0 };
  }

  // ── 1. Fan out exact coincidences ────────────────────────────────────────
  const buckets = new Map<string, LayoutNode[]>();
  for (const node of nodes) {
    // Quarter-pixel buckets: anything closer than this is one bubble on screen.
    const key = `${Math.round(node.cx * 4)}|${Math.round(node.cy * 4)}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(node);
    else buckets.set(key, [node]);
  }

  let coincident = 0;
  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue;
    coincident += bucket.length;
    // A zero budget still counts the pile-up for the legend to report; it just
    // declines to move anything.
    if (maxShift <= 0) continue;
    pinned.add(bucket[0].id);

    let spacing = 0;
    for (const node of bucket) spacing += node.r;
    spacing = (spacing / bucket.length) * 1.9 + gap;

    // Index 0 keeps the true coordinate; the rest spiral outward around it.
    for (let i = 1; i < bucket.length; i += 1) {
      const node = bucket[i];
      const angle = i * GOLDEN_ANGLE;
      const radius = Math.min(maxShift, spacing * Math.sqrt(i) * 0.62);
      node.cx = node.ox + Math.cos(angle) * radius;
      node.cy = node.oy + Math.sin(angle) * radius;
    }
  }

  // ── 2. Ease apart what still overlaps ────────────────────────────────────
  for (let pass = 0; maxShift > 0 && pass < iterations; pass += 1) {
    let moved = false;
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const minimum = a.r + b.r + gap;
        let dx = b.cx - a.cx;
        let dy = b.cy - a.cy;
        let distance = Math.hypot(dx, dy);
        if (distance >= minimum * occlusion) continue;

        if (distance === 0) {
          // Fallback for a pair the bucketing missed — split along a fixed axis
          // derived from the index so the result is still deterministic.
          const angle = (i + j) * GOLDEN_ANGLE;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }

        const aPinned = pinned.has(a.id);
        const bPinned = pinned.has(b.id);
        // Two anchors sitting close are two genuinely different readings — let
        // them overlap rather than move either off its true coordinate.
        if (aPinned && bPinned) continue;

        // Separate just far enough to clear the occlusion threshold, not to a
        // full gap — the aim is two visible nodes, not a tidy lattice.
        const overlap = minimum * occlusion - distance;
        const push = aPinned || bPinned ? overlap : overlap / 2;
        const ux = (dx / distance) * push;
        const uy = (dy / distance) * push;
        if (!aPinned) {
          a.cx -= ux;
          a.cy -= uy;
        }
        if (!bPinned) {
          b.cx += ux;
          b.cy += uy;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }

  // ── 3. Hold every node inside its budget and inside the frame ────────────
  let displaced = 0;
  let largest = 0;
  for (const node of nodes) {
    let dx = node.cx - node.ox;
    let dy = node.cy - node.oy;
    const distance = Math.hypot(dx, dy);
    if (distance > maxShift && distance > 0) {
      const scale = maxShift / distance;
      dx *= scale;
      dy *= scale;
    }
    // Centres stay inside the frame, exactly as an unmoved node's does — the
    // bubble may still overhang the edge, which is how a row sitting on a
    // domain boundary has always drawn.
    node.cx = clampToRect(node.ox + dx, rect.x0, rect.x1);
    node.cy = clampToRect(node.oy + dy, rect.y0, rect.y1);
    node.shift = Math.hypot(node.cx - node.ox, node.cy - node.oy);
    if (node.shift > 0.25) displaced += 1;
    if (node.shift > largest) largest = node.shift;
  }

  return { nodes, coincident, displaced, maxShift: Math.round(largest * 10) / 10 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────────────────────────────────────

export interface LabelCandidateInput {
  id: string;
  text: string;
  cx: number;
  cy: number;
  r: number;
}

export interface PlacedLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  /** Drawn when the label had to leave its node's side to find room. */
  leader: { x1: number; y1: number; x2: number; y2: number } | null;
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function overlaps(a: Box, b: Box, padX: number, padY: number): boolean {
  return a.x0 < b.x1 + padX && b.x0 < a.x1 + padX && a.y0 < b.y1 + padY && b.y0 < a.y1 + padY;
}

/** Ring offsets tried in order: the two side positions first, then outward. */
const LABEL_RINGS = [
  { distance: 0, angles: [0, Math.PI] },
  { distance: 0, angles: [-Math.PI / 2, Math.PI / 2] },
  { distance: 13, angles: [-0.55, Math.PI + 0.55, 0.55, Math.PI - 0.55] },
  { distance: 26, angles: [-0.9, Math.PI + 0.9, 0.9, Math.PI - 0.9, -Math.PI / 2, Math.PI / 2] },
] as const;

/**
 * Place as many name labels as will fit without overlapping each other, the
 * bubbles, or the frame — highest-priority candidate first. A label that had to
 * move off its node's flank gets a leader line back to the bubble, so a name is
 * never ambiguous about which point it belongs to.
 */
export function placeLabels(
  candidates: LabelCandidateInput[],
  nodes: { cx: number; cy: number; r: number }[],
  rect: LayoutRect,
  options: { limit?: number; charWidth?: number; lineHeight?: number } = {},
): PlacedLabel[] {
  const limit = options.limit ?? 8;
  const charWidth = options.charWidth ?? 5.45;
  const half = (options.lineHeight ?? 11) / 2;

  const placed: PlacedLabel[] = [];
  const boxes: Box[] = [];

  // Bubbles are obstacles too — a name reading across another row's node is as
  // unreadable as two names on top of each other.
  const nodeBoxes: Box[] = nodes.map((node) => ({
    x0: node.cx - node.r,
    y0: node.cy - node.r,
    x1: node.cx + node.r,
    y1: node.cy + node.r,
  }));

  for (const candidate of candidates) {
    if (placed.length >= limit) break;
    const width = candidate.text.length * charWidth;

    let chosen: PlacedLabel | null = null;

    for (const ring of LABEL_RINGS) {
      if (chosen) break;
      for (const angle of ring.angles) {
        const reach = candidate.r + 5 + ring.distance;
        const px = candidate.cx + Math.cos(angle) * reach;
        const py = candidate.cy + Math.sin(angle) * reach;

        // Anchor the text away from the node so it never crosses the bubble.
        const anchor: PlacedLabel['anchor'] =
          Math.abs(Math.cos(angle)) < 0.25 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
        const x0 = anchor === 'start' ? px : anchor === 'end' ? px - width : px - width / 2;
        const box: Box = { x0, y0: py - half, x1: x0 + width, y1: py + half };

        if (box.x0 < rect.x0 || box.x1 > rect.x1 || box.y0 < rect.y0 || box.y1 > rect.y1) continue;
        if (boxes.some((other) => overlaps(box, other, 5, 2))) continue;
        if (nodeBoxes.some((other) => overlaps(box, other, 1, 0))) continue;

        const needsLeader = ring.distance > 0;
        chosen = {
          id: candidate.id,
          text: candidate.text,
          x: px,
          y: py + 3,
          anchor,
          leader: needsLeader
            ? {
                x1: candidate.cx + Math.cos(angle) * (candidate.r + 1.5),
                y1: candidate.cy + Math.sin(angle) * (candidate.r + 1.5),
                x2: px - Math.cos(angle) * 3,
                y2: py - Math.sin(angle) * 3,
              }
            : null,
        };
        boxes.push(box);
        break;
      }
    }

    if (chosen) placed.push(chosen);
  }

  return placed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Voronoi
// ─────────────────────────────────────────────────────────────────────────────

export interface VoronoiCell {
  id: string;
  /** SVG path of the cell polygon. */
  path: string;
}

type Vertex = { x: number; y: number };

/** Sutherland–Hodgman clip of a convex polygon by the half-plane a·x + b·y ≤ c. */
function clipHalfPlane(polygon: Vertex[], a: number, b: number, c: number): Vertex[] {
  const output: Vertex[] = [];
  const count = polygon.length;
  for (let i = 0; i < count; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % count];
    const currentSide = a * current.x + b * current.y - c;
    const nextSide = a * next.x + b * next.y - c;
    const currentInside = currentSide <= 0;
    const nextInside = nextSide <= 0;

    if (currentInside) output.push(current);
    if (currentInside !== nextInside) {
      const t = currentSide / (currentSide - nextSide);
      output.push({
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t,
      });
    }
  }
  return output;
}

/**
 * Voronoi cells of the plotted nodes, clipped to the plot rect.
 *
 * Every position in a cell is closer to that cell's node than to any other, so
 * using the cells as the hover surface gives each row the whole area it owns —
 * a 3px bubble in a dense band becomes a target the pointer can actually hit.
 *
 * Direct half-plane clipping, O(n²) in the node count: at a few hundred rows it
 * costs a few milliseconds and only reruns when the placement changes. Returns
 * null past `maxSites`, where the caller falls back to hovering the bubbles.
 */
export function buildVoronoiCells(
  sites: { id: string; cx: number; cy: number }[],
  rect: LayoutRect,
  maxSites = 450,
): VoronoiCell[] | null {
  if (sites.length === 0) return [];
  if (sites.length > maxSites) return null;

  // Two nodes on one coordinate would each clip the other's cell to nothing.
  const unique: { id: string; cx: number; cy: number }[] = [];
  const seen = new Set<string>();
  for (const site of sites) {
    const key = `${Math.round(site.cx * 100)}|${Math.round(site.cy * 100)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(site);
  }

  const frame: Vertex[] = [
    { x: rect.x0, y: rect.y0 },
    { x: rect.x1, y: rect.y0 },
    { x: rect.x1, y: rect.y1 },
    { x: rect.x0, y: rect.y1 },
  ];

  const cells: VoronoiCell[] = [];
  for (const site of unique) {
    let polygon = frame;
    for (const other of unique) {
      if (other === site) continue;
      // Perpendicular bisector, keeping the half-plane nearer to `site`.
      const a = 2 * (other.cx - site.cx);
      const b = 2 * (other.cy - site.cy);
      const c = other.cx * other.cx + other.cy * other.cy - site.cx * site.cx - site.cy * site.cy;
      polygon = clipHalfPlane(polygon, a, b, c);
      if (polygon.length < 3) break;
    }
    if (polygon.length < 3) continue;
    cells.push({
      id: site.id,
      path: `M${polygon.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join('L')}Z`,
    });
  }

  return cells;
}
