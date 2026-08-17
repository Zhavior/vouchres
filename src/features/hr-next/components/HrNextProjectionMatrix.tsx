import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ChartScatter,
  Maximize2,
  Minus,
  Plus as PlusIcon,
  Crosshair,
  Info,
  Microscope,
  Plus,
  Search,
  Shuffle,
  Sigma,
  Star,
  TrendingUp,
  Trophy,
  Waypoints,
  X,
} from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { useLiveGames } from '../../../hooks/queries/useLiveGames';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import {
  GAME_LIVE_METHODOLOGY,
  GAME_SCORE_METHODOLOGY,
  buildGameScores,
  buildLiveIndex,
  liveScoreLabel,
  liveStatusLabel,
  type GameHrScore,
} from '../utils/gameScore';
import { formatGameTime } from '../utils/cardUtils';
import {
  MATRIX_COVERAGE_METHODOLOGY,
  MATRIX_FIT_METHODOLOGY,
  MATRIX_FRONTIER_METHODOLOGY,
  MATRIX_METRICS,
  MATRIX_METRIC_GROUPS,
  MATRIX_RESOLUTION_METHODOLOGY,
  MATRIX_SCORE_METHODOLOGY,
  MATRIX_THRESHOLD_METHODOLOGY,
  buildProjectionMatrix,
  type MatrixMetricId,
  type MatrixPoint,
  type MatrixQuadrantKey,
  type MatrixScale,
  type RangeMode,
  type ThresholdMode,
} from '../utils/projectionMatrix';
import {
  buildVoronoiCells,
  dispersePoints,
  placeLabels,
  type LayoutRect,
} from '../utils/matrixLayout';

/**
 * Projection Matrix — HR Next.
 *
 * A four-channel scatter of the live board: X, Y, bubble area and tier colour.
 * Everything drawn here comes from `buildProjectionMatrix`, which plots only rows
 * the pipeline published on both axes; the rest are named in the unplotted tray.
 *
 * The plot is a plain SVG measured in CSS pixels — a layout-effect ResizeObserver
 * fixes the viewBox before first paint, so the chart lands in one frame instead of
 * flashing an empty box and then reflowing.
 */

// `top` reserves a strip above the frame for the two upper quadrant captions —
// the top rows of a HR board sit at the ceiling of the Y layer, so a caption
// drawn inside the plot would always land in an occupied band.
const PAD = { left: 58, right: 22, top: 32, bottom: 48 } as const;
const R_MIN = 4.5;
const R_MAX = 15;
/** Node clip slack — largest bubble plus its frontier ring and stroke. */
const NODE_CLIP_PAD = R_MAX + 6;
/** Points annotated with a name label on the plot, by Matrix Score. */
const ANNOTATED = 9;
/** How far a node may be moved from its true coordinate to become visible. */
const MAX_NODE_SHIFT = 13;
/** Tightest the view may zoom, as a fraction of the full axis range. */
const MIN_VIEW_SPAN = 0.02;
/** Wheel notch -> zoom factor. */
const WHEEL_ZOOM = 0.0016;
/** Multiplier applied by the +/- buttons. */
const BUTTON_ZOOM = 1.45;

/** Visible window over both axes, in normalised 0-1 units of the axis scale. */
interface ViewWindow {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const FULL_VIEW: ViewWindow = { x0: 0, x1: 1, y0: 0, y1: 1 };

/** Keep a window inside the axis, no tighter than MIN_VIEW_SPAN and no wider than full. */
function clampView(next: ViewWindow): ViewWindow {
  const fit = (lo: number, hi: number): [number, number] => {
    let span = Math.min(1, Math.max(MIN_VIEW_SPAN, hi - lo));
    let start = lo;
    if (start < 0) start = 0;
    if (start + span > 1) start = 1 - span;
    return [start, start + span];
  };
  const [x0, x1] = fit(next.x0, next.x1);
  const [y0, y1] = fit(next.y0, next.y1);
  return { x0, x1, y0, y1 };
}

/** Pure zoom of a window about a normalised anchor. */
function zoomWindow(prev: ViewWindow, factor: number, ax: number, ay: number): ViewWindow {
  const sx = Math.max(MIN_VIEW_SPAN, prev.x1 - prev.x0) / factor;
  const sy = Math.max(MIN_VIEW_SPAN, prev.y1 - prev.y0) / factor;
  const fx = (ax - prev.x0) / (prev.x1 - prev.x0 || 1);
  const fy = (ay - prev.y0) / (prev.y1 - prev.y0 || 1);
  return clampView({
    x0: ax - fx * sx,
    x1: ax + (1 - fx) * sx,
    y0: ay - fy * sy,
    y1: ay + (1 - fy) * sy,
  });
}

function isFullView(view: ViewWindow): boolean {
  return view.x0 <= 0.0001 && view.x1 >= 0.9999 && view.y0 <= 0.0001 && view.y1 >= 0.9999;
}

/** Rows shown in the ranked list before the expander appears. */
const LIST_PAGE = 12;

const THRESHOLD_MODES: readonly { id: ThresholdMode; label: string; word: string; title: string }[] = [
  {
    id: 'median',
    label: 'Median split',
    word: 'median',
    title: 'Split each axis at the median of the plotted rows',
  },
  {
    id: 'quartile',
    label: 'Upper quartile',
    word: 'upper quartile',
    title:
      'Split each axis at its favourable upper quartile — the top 25% of the plotted rows, or the bottom 25% where a lower reading is the better one',
  },
  {
    id: 'midpoint',
    label: 'Fixed split',
    word: 'midpoint',
    title: 'Split each axis at the midpoint of its display range',
  },
];

const NAME_SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv']);

/** Surname for a plot label — "Vladimir Guerrero Jr." has to read "Guerrero". */
function plotLabelName(playerName: string): string {
  const parts = playerName.trim().split(/\s+/).filter(Boolean);
  while (parts.length > 1 && NAME_SUFFIXES.has(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
  }
  return parts[parts.length - 1] ?? playerName;
}

interface HrNextProjectionMatrixProps {
  rows: HrWatchRow[];
  /** What the matrix covers — the full slate or one selected game. */
  scopeLabel: string;
  savedMap: Record<string, true>;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
  onOpenResearch: (player: { id: string | number; name: string }) => void;
  onClose: () => void;
  /**
   * Statcast resolution is a query-level choice, so the control rail owns the
   * flag and the matrix renders it. Keeping it here as local state meant the
   * setting was lost every time the reader left the Matrix view and came back.
   */
  resolveStatcast: boolean;
  onToggleStatcast: () => void;
}

interface Brush {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function MetricSelect({
  id,
  label,
  accent,
  value,
  coverage,
  poolSize,
  onChange,
}: {
  id: string;
  label: string;
  accent: string;
  value: MatrixMetricId;
  coverage: Record<MatrixMetricId, number>;
  poolSize: number;
  onChange: (next: MatrixMetricId) => void;
}) {
  // A metric the pipeline publishes for nobody cannot be plotted — offering it
  // as a live choice just empties the canvas and reads as a broken chart. It
  // stays listed, disabled and labelled, so the gap is legible as a feed gap.
  const emptyMetrics = MATRIX_METRICS.filter((metric) => (coverage[metric.id] ?? 0) === 0);
  const activeIsEmpty = (coverage[value] ?? 0) === 0;

  return (
    <label htmlFor={id} className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[210px]">
      <span
        className="font-mono text-[8.5px] font-bold uppercase tracking-[0.18em]"
        style={{ color: accent }}
      >
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as MatrixMetricId)}
        className={`w-full min-w-0 truncate rounded-lg border bg-[#060a0a] px-2.5 py-2 font-mono text-[11px] font-bold outline-none transition-colors focus:ring-1 focus:ring-[#10B981]/40 ${
          activeIsEmpty
            ? 'border-[#F59E0B]/50 text-[#F59E0B]'
            : 'border-white/[0.07] text-white hover:border-white/20 focus:border-[#10B981]'
        }`}
      >
        {MATRIX_METRIC_GROUPS.map((group) => {
          const options = MATRIX_METRICS.filter((metric) => metric.group === group);
          if (options.length === 0) return null;
          return (
            <optgroup key={group} label={group}>
              {options.map((metric) => {
                const published = coverage[metric.id] ?? 0;
                const unavailable = published === 0;
                return (
                  <option
                    key={metric.id}
                    value={metric.id}
                    disabled={unavailable}
                    className="bg-[#060a0a]"
                    style={unavailable ? { color: 'rgba(255,255,255,0.35)' } : undefined}
                  >
                    {unavailable ? '⃠ ' : ''}
                    {metric.label} · {published}/{poolSize}
                    {unavailable ? ' — not published' : ''}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
      {emptyMetrics.length > 0 ? (
        <span
          className="truncate font-mono text-[8.5px] font-semibold text-[#F59E0B]/60"
          title={`No published value on this slate: ${emptyMetrics.map((metric) => metric.label).join(', ')}.`}
        >
          {emptyMetrics.length} metric{emptyMetrics.length === 1 ? '' : 's'} unavailable on this feed
        </span>
      ) : null}
    </label>
  );
}

function Toggle({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[9.5px] font-black uppercase tracking-[0.12em] transition-colors ${
        active
          ? 'border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981]'
          : 'border-white/[0.07] bg-[#060a0a] text-white/40 hover:border-white/20 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * One matchup on the game ladder: derived HR score on the left, real runs on the
 * right. The status line always renders — it holds first-pitch time before the
 * feed lands and upgrades in place to a score, so nothing shifts underneath.
 */
function GameCard({
  game,
  leaderScore,
  active,
  onToggle,
}: {
  game: GameHrScore;
  leaderScore: number;
  active: boolean;
  onToggle: () => void;
}) {
  const accent = game.rank === 1 ? '#10B981' : game.rank <= 3 ? '#6EE7B7' : '#64748B';
  const barPct = leaderScore > 0 ? Math.max(6, Math.round((game.score / leaderScore) * 100)) : 0;
  const runs = liveScoreLabel(game.live);
  const status = liveStatusLabel(game.live);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={`${game.matchupLabel} — Game HR Score ${game.score}. ${GAME_SCORE_METHODOLOGY}`}
      className="min-w-0 rounded-xl border bg-[#060a0a] p-3 text-left transition-colors"
      style={{
        borderColor: active ? `${accent}80` : 'rgba(255,255,255,0.07)',
        backgroundColor: active ? `${accent}14` : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className="font-mono text-[8.5px] font-black uppercase tracking-[0.16em]"
            style={{ color: accent }}
          >
            #{game.rank} Game
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-black leading-tight text-white">
            {game.matchupLabel}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-white/35">
            Game Score
          </span>
          <strong
            className="block font-mono text-xl font-black leading-none tabular-nums"
            style={{ color: accent }}
          >
            {game.score}
          </strong>
        </div>
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${barPct}%`, backgroundColor: accent }}
        />
      </div>

      {/* Live line — runs when the game is under way, its status otherwise. */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-2">
        {runs ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${game.live?.isLive ? 'bg-[#EF4444]' : 'bg-white/30'}`}
            />
            <strong className="font-mono text-[12px] font-black tabular-nums text-white">{runs}</strong>
            <span className="truncate font-mono text-[9px] font-semibold text-white/40">{status}</span>
          </span>
        ) : (
          <span className="min-w-0 truncate font-mono text-[9px] font-semibold text-white/35">
            {status ?? formatGameTime(game.gameTime)}
          </span>
        )}
        <span className="shrink-0 font-mono text-[9px] font-semibold text-white/35 tabular-nums">
          {game.batters} bats
        </span>
      </div>
    </button>
  );
}

function Stat({ label, value, accent = '#FFFFFF', hint }: {
  label: string;
  value: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/[0.07] bg-[#060a0a] px-2.5 py-2">
      <span className="block truncate font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
      <strong
        className="mt-1 block truncate font-mono text-sm font-black leading-none tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </strong>
      {hint ? (
        <span className="mt-1 block truncate font-mono text-[8.5px] font-semibold text-white/30">{hint}</span>
      ) : null}
    </div>
  );
}

export const HrNextProjectionMatrix = React.memo(function HrNextProjectionMatrix({
  rows,
  scopeLabel,
  savedMap,
  onToggleSaved,
  onAddToSlip,
  onOpenResearch,
  onClose,
  resolveStatcast,
  onToggleStatcast,
}: HrNextProjectionMatrixProps) {
  const [xId, setXId] = useState<MatrixMetricId>('pitcherVulnerability');
  const [yId, setYId] = useState<MatrixMetricId>('hitterPower');
  const [sizeId, setSizeId] = useState<MatrixMetricId>('hrpi');
  const [thresholdMode, setThresholdMode] = useState<ThresholdMode>('median');
  const [rangeMode, setRangeMode] = useState<RangeMode>('fit');
  const [showTrend, setShowTrend] = useState(true);
  const [showFrontier, setShowFrontier] = useState(true);
  const [separateNodes, setSeparateNodes] = useState(true);
  const [view, setView] = useState<ViewWindow>(FULL_VIEW);
  const [dragMode, setDragMode] = useState<'brush' | 'pan'>('brush');
  const [quadrantFilter, setQuadrantFilter] = useState<MatrixQuadrantKey | 'all'>('all');
  const [gameFilter, setGameFilter] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [brush, setBrush] = useState<Brush | null>(null);
  const [brushIds, setBrushIds] = useState<Set<string> | null>(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [exclusionsOpen, setExclusionsOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  // The component early-returns before the plot exists (empty pool), so a
  // mount-once layout effect would run against a null ref and never re-run. The
  // node is tracked in state instead, so every measuring effect re-attaches the
  // moment the wrapper actually appears.
  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null);
  const attachWrap = useCallback((node: HTMLDivElement | null) => {
    wrapRef.current = node;
    setWrapEl(node);
  }, []);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const panningRef = useRef(false);
  const panOriginRef = useRef<ViewWindow | null>(null);
  // Seeded so the very first paint already has a real plot rather than a 0×0 box.
  const [size, setSize] = useState({ width: 880, height: 460 });

  useLayoutEffect(() => {
    const node = wrapEl;
    if (!node) return;
    let frame = 0;

    const apply = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;
      setSize((prev) =>
        Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5
          ? prev
          : { width: rect.width, height: rect.height },
      );
      return true;
    };

    // The wrapper can still measure zero on the first layout pass — a pane that
    // has not been given its width yet, or a collapsed ancestor. Keep retrying on
    // animation frames until it reports a real box, otherwise the plot would stay
    // pinned to its seed size and render scaled through the viewBox.
    const settle = () => {
      if (!apply()) frame = requestAnimationFrame(settle);
    };
    settle();

    const observer = new ResizeObserver(() => { apply(); });
    observer.observe(node);
    // Belt and braces: some embedded panes resize the viewport without the
    // observer delivering an entry for an already-observed node.
    const onResize = () => { apply(); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [wrapEl]);

  // Live runs join the board on gamePk. The query is shared with the rest of the
  // app, so this is a cache read rather than a second poll, and the matrix works
  // unchanged when the feed is absent — game scores come from the board alone.
  const { data: livePayload } = useLiveGames();
  const liveIndex = useMemo(() => buildLiveIndex(livePayload?.games), [livePayload?.games]);
  const gameIndex = useMemo(() => buildGameScores(rows, liveIndex), [rows, liveIndex]);

  const matrixContext = useMemo(
    () => ({ gameScoreByRowId: gameIndex.byRowId }),
    [gameIndex],
  );

  const model = useMemo(
    () =>
      buildProjectionMatrix(rows, {
        xId,
        yId,
        sizeId,
        thresholdMode,
        rangeMode,
        resolveWithStatcast: resolveStatcast,
        context: matrixContext,
      }),
    [rows, xId, yId, sizeId, thresholdMode, rangeMode, resolveStatcast, matrixContext],
  );

  const { width, height } = size;
  const plotW = Math.max(80, width - PAD.left - PAD.right);
  const plotH = Math.max(80, height - PAD.top - PAD.bottom);

  // Visible window over the axis scale, in normalised 0–1 units. Every screen
  // coordinate in the plot runs through toPx/toPy, so zooming and panning here
  // moves the nodes, the brush hit-testing, the labels and the hover cells
  // together — there is no second copy of the projection to keep in step.
  const xSpan = Math.max(MIN_VIEW_SPAN, view.x1 - view.x0);
  const ySpan = Math.max(MIN_VIEW_SPAN, view.y1 - view.y0);
  const toPx = useCallback(
    (nx: number) => PAD.left + ((nx - view.x0) / xSpan) * plotW,
    [plotW, view.x0, xSpan],
  );
  const toPy = useCallback(
    (ny: number) => PAD.top + (1 - (ny - view.y0) / ySpan) * plotH,
    [plotH, view.y0, ySpan],
  );
  /** Zoom about a normalised anchor so the point under the cursor stays put. */
  const zoomAround = useCallback(
    (factor: number, ax: number, ay: number) =>
      setView((prev) => zoomWindow(prev, factor, ax, ay)),
    [],
  );

  const zoomCentre = useCallback(
    (factor: number) =>
      setView((prev) =>
        zoomWindow(prev, factor, (prev.x0 + prev.x1) / 2, (prev.y0 + prev.y1) / 2),
      ),
    [],
  );

  const resetView = useCallback(() => setView(FULL_VIEW), []);

  /** Five ticks across the visible window on each axis, in metric units. */
  const viewTicks = useMemo(() => {
    const axis = (scale: MatrixScale, lo: number, hi: number) => {
      const span = scale.max - scale.min;
      return Array.from({ length: 5 }, (_, i) => {
        const n = lo + (hi - lo) * (i / 4);
        return { n, value: scale.min + span * n };
      });
    };
    return {
      x: axis(model.xScale, view.x0, view.x1),
      y: axis(model.yScale, view.y0, view.y1),
    };
  }, [model.xScale, model.yScale, view]);

  /** Screen pixel back to a normalised axis position — zoom anchors need this. */
  const fromPx = useCallback(
    (px: number) => view.x0 + ((px - PAD.left) / plotW) * xSpan,
    [plotW, view.x0, xSpan],
  );
  const fromPy = useCallback(
    (py: number) => view.y0 + (1 - (py - PAD.top) / plotH) * ySpan,
    [plotH, view.y0, ySpan],
  );

  // Board scores are integers, so a full slate stacks many rows on identical
  // coordinates. Shrink the bubbles as the pool grows or the dense bands turn
  // into unreadable mud.
  const [rMin, rMax] = model.points.length > 150
    ? [2.75, 8.5]
    : model.points.length > 70
      ? [3.5, 11]
      : [R_MIN, R_MAX];

  const plotRect = useMemo<LayoutRect>(
    () => ({ x0: PAD.left, y0: PAD.top, x1: PAD.left + plotW, y1: PAD.top + plotH }),
    [plotW, plotH],
  );

  const trueCoordinates = useMemo(
    () =>
      model.points.map((point) => ({
        point,
        cx: toPx(point.nx),
        cy: toPy(point.ny),
        r: rMin + (rMax - rMin) * Math.sqrt(point.nSize),
      })),
    [model.points, toPx, toPy, rMin, rMax],
  );

  /**
   * Rows landing on one coordinate are fanned apart so each is its own target.
   * The displacement is capped at `MAX_NODE_SHIFT` px and reported back for the
   * legend to state — every readout still prints the true measurement, and the
   * separation can be switched off to see the raw pile-up.
   */
  const dispersal = useMemo(
    () =>
      dispersePoints(
        trueCoordinates.map((entry) => ({
          id: entry.point.id,
          cx: entry.cx,
          cy: entry.cy,
          r: entry.r,
        })),
        plotRect,
        { maxShift: separateNodes ? MAX_NODE_SHIFT : 0 },
      ),
    [trueCoordinates, plotRect, separateNodes],
  );

  const placed = useMemo(() => {
    const byId = new Map(dispersal.nodes.map((node) => [node.id, node]));
    return trueCoordinates.map((entry) => {
      const node = byId.get(entry.point.id);
      return node
        ? { ...entry, cx: node.cx, cy: node.cy, shift: node.shift }
        : { ...entry, shift: 0 };
    });
  }, [trueCoordinates, dispersal]);

  // Frontier and hovered nodes paint last so they are never buried in a cluster.
  const paintOrder = useMemo(
    () =>
      [...placed].sort((left, right) => {
        const weight = (entry: typeof left) =>
          (entry.point.id === hoveredId ? 2 : 0) + (entry.point.onFrontier ? 1 : 0);
        return weight(left) - weight(right);
      }),
    [placed, hoveredId],
  );

  /** True when a point survives every active filter — drives the list and dimming. */
  const passesFilters = useCallback(
    (point: MatrixPoint) => {
      if (quadrantFilter !== 'all' && point.quadrant !== quadrantFilter) return false;
      if (brushIds && !brushIds.has(point.id)) return false;
      if (gameFilter && gameIndex.byRowId.get(point.row.stableId)?.key !== gameFilter) return false;
      return true;
    },
    [quadrantFilter, brushIds, gameFilter, gameIndex],
  );

  const visible = useMemo(
    () => model.points.filter(passesFilters).sort((left, right) => right.matrixScore - left.matrixScore),
    [model.points, passesFilters],
  );

  /**
   * Name the strongest visible rows, searching outward from each bubble for a
   * box that clears the frame, the other labels and every other node. A name
   * that had to leave its bubble's flank keeps a leader line back to it, so the
   * text is never ambiguous about which point it belongs to.
   */
  const labels = useMemo(() => {
    const ranked = placed
      .filter((entry) => passesFilters(entry.point))
      .sort((left, right) => right.point.matrixScore - left.point.matrixScore);

    return placeLabels(
      ranked.map((entry) => ({
        id: entry.point.id,
        text: plotLabelName(entry.point.row.playerName),
        cx: entry.cx,
        cy: entry.cy,
        r: entry.r,
      })),
      placed.map((entry) => ({ cx: entry.cx, cy: entry.cy, r: entry.r })),
      { x0: plotRect.x0 + 2, y0: plotRect.y0 + 2, x1: plotRect.x1 - 2, y1: plotRect.y1 - 2 },
      { limit: ANNOTATED },
    );
  }, [placed, passesFilters, plotRect]);

  /**
   * Hover catchment. Each node owns the region of the plot closer to it than to
   * any other, so a 3px bubble inside a dense band is still reachable — the
   * pointer only has to be nearer to it than to its neighbours.
   */
  const voronoiCells = useMemo(
    () =>
      buildVoronoiCells(
        placed.map((entry) => ({ id: entry.point.id, cx: entry.cx, cy: entry.cy })),
        plotRect,
      ),
    [placed, plotRect],
  );

  const hovered = hoveredId ? model.points.find((point) => point.id === hoveredId) ?? null : null;
  const hoveredPlacement = hovered ? placed.find((entry) => entry.point.id === hovered.id) ?? null : null;

  // ── Brushing ──────────────────────────────────────────────────────────────
  const localPoint = useCallback((event: React.PointerEvent<SVGElement>) => {
    const node = wrapRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<SVGGraphicsElement>) => {
    const local = localPoint(event);
    if (!local) return;
    // Capture keeps the drag alive past the plot edge. It throws for a pointer id
    // the browser has no active record of, which must not abort the drag.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* drag still tracks through the element's own move events */
    }
    dragRef.current = local;
    // Shift is the pan override, so the view can be moved without leaving brush
    // mode — and middle-drag pans too, matching the usual map convention.
    panningRef.current = dragMode === 'pan' || event.shiftKey || event.button === 1;
    panOriginRef.current = panningRef.current ? { ...view } : null;
    if (!panningRef.current) {
      setBrush({ x0: local.x, y0: local.y, x1: local.x, y1: local.y });
    }
  }, [localPoint, dragMode, view]);

  const handlePointerMove = useCallback((event: React.PointerEvent<SVGGraphicsElement>) => {
    const origin = dragRef.current;
    if (!origin) return;
    const local = localPoint(event);
    if (!local) return;

    if (panningRef.current) {
      const start = panOriginRef.current;
      if (!start) return;
      // Drag the data under the cursor 1:1 — a point grabbed stays under the pointer.
      const dx = ((local.x - origin.x) / plotW) * (start.x1 - start.x0);
      const dy = ((local.y - origin.y) / plotH) * (start.y1 - start.y0);
      setView(clampView({
        x0: start.x0 - dx,
        x1: start.x1 - dx,
        y0: start.y0 + dy,
        y1: start.y1 + dy,
      }));
      return;
    }

    setBrush({ x0: origin.x, y0: origin.y, x1: local.x, y1: local.y });
  }, [localPoint, plotW, plotH]);

  const handlePointerUp = useCallback((event: React.PointerEvent<SVGGraphicsElement>) => {
    const origin = dragRef.current;
    dragRef.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* nothing to release */
    }
    if (panningRef.current) {
      panningRef.current = false;
      panOriginRef.current = null;
      setBrush(null);
      return;
    }
    const local = localPoint(event);
    if (!origin || !local) {
      setBrush(null);
      return;
    }
    const minX = Math.min(origin.x, local.x);
    const maxX = Math.max(origin.x, local.x);
    const minY = Math.min(origin.y, local.y);
    const maxY = Math.max(origin.y, local.y);
    setBrush(null);
    // A click rather than a drag — clear the selection instead of selecting one pixel.
    if (maxX - minX < 6 || maxY - minY < 6) {
      setBrushIds(null);
      return;
    }
    const hits = new Set(
      placed
        .filter((entry) => entry.cx >= minX && entry.cx <= maxX && entry.cy >= minY && entry.cy <= maxY)
        .map((entry) => entry.point.id),
    );
    setBrushIds(hits.size > 0 ? hits : null);
  }, [localPoint, placed]);

  // Ctrl/Cmd + wheel zooms about the cursor; a bare wheel is left alone so the
  // page still scrolls normally over the plot. React's onWheel is passive, so the
  // listener is attached directly to allow preventDefault.
  useLayoutEffect(() => {
    const node = wrapEl;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      zoomAround(Math.exp(-event.deltaY * WHEEL_ZOOM), fromPx(px), fromPy(py));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [wrapEl, zoomAround, fromPx, fromPy]);

  const resetSelection = useCallback(() => {
    setBrushIds(null);
    setQuadrantFilter('all');
    setGameFilter(null);
  }, []);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#0a1010] px-6 py-12 text-center font-mono text-xs text-white/40">
        No rows to plot under the active filters.
      </div>
    );
  }

  const { xMetric, yMetric, sizeMetric, xScale, yScale, fit } = model;
  const splitX = toPx(xScale.thresholdNorm);
  const splitY = toPy(yScale.thresholdNorm);
  const plotRight = PAD.left + plotW;
  const plotBottom = PAD.top + plotH;
  const thresholdWord =
    THRESHOLD_MODES.find((mode) => mode.id === thresholdMode)?.word ?? 'median';
  const resolvable = MATRIX_METRICS.some(
    (metric) => metric.resolver != null && (metric.id === xId || metric.id === yId),
  );
  // On a phone-width plot the two upper captions would run into each other, so
  // they drop to bare counts — the quadrant cards below carry the full wording.
  const compactCaptions = plotW < 430;

  // Least-squares endpoints in metric units, then projected onto the plot and
  // clipped to the plot rect by the clipPath below.
  const trend = fit
    ? {
        x1: toPx(0),
        y1: toPy(normaliseFor(fit.intercept + fit.slope * xScale.min, yScale)),
        x2: toPx(1),
        y2: toPy(normaliseFor(fit.intercept + fit.slope * xScale.max, yScale)),
      }
    : null;

  const frontierPath = model.frontier
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${toPx(point.nx).toFixed(1)} ${toPy(point.ny).toFixed(1)}`)
    .join(' ');

  const selectedGame = gameFilter ? gameIndex.games.find((game) => game.key === gameFilter) ?? null : null;
  const selectionLabel = brushIds
    ? `${brushIds.size} brushed`
    : selectedGame
      ? selectedGame.matchupLabel
      : quadrantFilter !== 'all'
        ? model.quadrants.find((quadrant) => quadrant.key === quadrantFilter)?.label ?? null
        : null;

  const listRows = listExpanded ? visible : visible.slice(0, LIST_PAGE);

  return (
    <section aria-label="Home run projection matrix" className="space-y-4">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0a1010] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/35 bg-[#10B981]/15 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#10B981]">
                <ChartScatter className="h-3 w-3" />
                Projection Matrix
              </span>
              <span className="font-mono text-[10px] font-semibold text-white/40">{scopeLabel}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {yMetric.short} against {xMetric.short}
            </h2>
            <p className="max-w-2xl font-mono text-[10.5px] leading-relaxed text-white/45">
              Four channels at once — X, Y, bubble area ({sizeMetric.short}) and tier colour. Quadrants split at
              the plotted {thresholdWord}: {xMetric.short} {xMetric.format(xScale.threshold)} · {yMetric.short}{' '}
              {yMetric.format(yScale.threshold)}. {MATRIX_COVERAGE_METHODOLOGY}
            </p>
          </div>

          <div className="flex shrink-0 items-start gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-[#060a0a] px-4 py-3 text-center">
              <span className="block font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                Plotted
              </span>
              <strong className="mt-1 block font-mono text-2xl font-black leading-none tabular-nums text-[#10B981]">
                {model.points.length}
              </strong>
              <span className="mt-0.5 block font-mono text-[9px] font-semibold text-white/40">
                of {model.totalRows} rows
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Back to the board"
              aria-label="Back to the board"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] bg-[#060a0a] text-white/45 transition-colors hover:border-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Axis + encoding controls ───────────────────────────────────── */}
        <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.07] pt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <MetricSelect
              id="hr-matrix-y"
              label="Y axis ▲"
              accent="#10B981"
              value={yId}
              coverage={model.coverage}
              poolSize={model.totalRows}
              onChange={setYId}
            />
            <MetricSelect
              id="hr-matrix-x"
              label="X axis ►"
              accent="#F59E0B"
              value={xId}
              coverage={model.coverage}
              poolSize={model.totalRows}
              onChange={setXId}
            />
            <MetricSelect
              id="hr-matrix-size"
              label="Bubble area ●"
              accent="#A855F7"
              value={sizeId}
              coverage={model.coverage}
              poolSize={model.totalRows}
              onChange={setSizeId}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-[#060a0a] p-1">
              {THRESHOLD_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setThresholdMode(mode.id)}
                  aria-pressed={thresholdMode === mode.id}
                  title={mode.title}
                  className={`rounded-md px-2.5 py-1 font-mono text-[9.5px] font-black uppercase tracking-[0.12em] transition-colors ${
                    thresholdMode === mode.id ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-[#060a0a] p-1">
              {(['fit', 'full'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRangeMode(mode)}
                  aria-pressed={rangeMode === mode}
                  title={
                    mode === 'fit'
                      ? 'Scale each axis to the plotted rows so the pool fills the canvas'
                      : 'Keep each metric\'s declared range (0–100 for board layers) so axes stay comparable'
                  }
                  className={`rounded-md px-2.5 py-1 font-mono text-[9.5px] font-black uppercase tracking-[0.12em] transition-colors ${
                    rangeMode === mode ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {mode === 'fit' ? 'Fit data' : 'Full scale'}
                </button>
              ))}
            </div>

            {/* View controls — zoom the axes and choose what a drag does. */}
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-[#060a0a] p-1">
              {(['brush', 'pan'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDragMode(mode)}
                  aria-pressed={dragMode === mode}
                  title={
                    mode === 'brush'
                      ? 'Drag selects a region. Hold Shift to pan without leaving this mode.'
                      : 'Drag moves the view around the axes.'
                  }
                  className={`rounded-md px-2 py-1 font-mono text-[9.5px] font-black uppercase tracking-[0.12em] transition-colors ${
                    dragMode === mode ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {mode === 'brush' ? 'Brush' : 'Pan'}
                </button>
              ))}
              <span className="mx-0.5 h-4 w-px bg-white/10" />
              <button
                type="button"
                onClick={() => zoomCentre(1 / BUTTON_ZOOM)}
                disabled={isFullView(view)}
                title="Zoom out"
                aria-label="Zoom out"
                className="grid h-6 w-6 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-white/15 disabled:hover:bg-transparent"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => zoomCentre(BUTTON_ZOOM)}
                title="Zoom in (or Ctrl/⌘ + scroll over the plot)"
                aria-label="Zoom in"
                className="grid h-6 w-6 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={resetView}
                disabled={isFullView(view)}
                title="Reset to the whole axis"
                aria-label="Reset view"
                className="grid h-6 w-6 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-white/15 disabled:hover:bg-transparent"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>

            <Toggle
              active={showTrend}
              onClick={() => setShowTrend((prev) => !prev)}
              title="Least-squares fit of Y on X across the plotted rows"
            >
              <TrendingUp className="h-3 w-3" />
              Trend
            </Toggle>

            <Toggle
              active={showFrontier}
              onClick={() => setShowFrontier((prev) => !prev)}
              title={MATRIX_FRONTIER_METHODOLOGY}
            >
              <Waypoints className="h-3 w-3" />
              Frontier ({model.frontier.length})
            </Toggle>

            <Toggle
              active={separateNodes}
              onClick={() => setSeparateNodes((prev) => !prev)}
              title={`Fan rows sharing a coordinate apart, and ease apart what still buries a bubble, by up to ${MAX_NODE_SHIFT}px each — so every row is its own hover target. Printed values stay the true readings.`}
            >
              <Shuffle className="h-3 w-3" />
              Separate ({separateNodes ? dispersal.displaced : dispersal.coincident})
            </Toggle>

            {/* Statcast resolve is a query-level utility and lives in the
                control rail. It stays out of this toolbar so there is one
                control for the flag rather than two that have to agree. */}
            {resolvable && resolveStatcast ? (
              <span
                title={MATRIX_RESOLUTION_METHODOLOGY}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#10B981]/40 bg-[#10B981]/12 px-2.5 py-1.5 font-mono text-[9.5px] font-black uppercase tracking-[0.12em] text-[#10B981]"
              >
                <Microscope className="h-3 w-3" />
                Statcast resolved
              </span>
            ) : null}

            {selectionLabel ? (
              <button
                type="button"
                onClick={resetSelection}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#10B981]/50 bg-[#10B981]/15 px-2.5 py-1.5 font-mono text-[9.5px] font-black uppercase tracking-[0.12em] text-[#10B981] transition-colors hover:bg-[#10B981]/25"
              >
                <X className="h-3 w-3" />
                {selectionLabel} — clear
              </button>
            ) : (
              <span className="font-mono text-[9.5px] font-semibold text-white/30">
                Drag on the plot to brush a region
              </span>
            )}
          </div>

          {/* Tie + resolution status — the plot cannot show a difference the
              feed does not publish, so it says how much resolution it has. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] font-semibold text-white/35">
            <span>
              {model.distinctCoordinates} distinct coordinate
              {model.distinctCoordinates === 1 ? '' : 's'} across {model.points.length} plotted row
              {model.points.length === 1 ? '' : 's'}
            </span>
            {model.resolutions.map((resolution) => (
              <span key={resolution.metricId} className="text-[#10B981]/70">
                {resolution.label}: {resolution.componentsUsed.join(' + ')} over {resolution.resolvedRows} rows
                {resolution.componentsDropped.length > 0
                  ? ` · ${resolution.componentsDropped.join(', ')} not published`
                  : ''}
                {resolution.unresolvedRows > 0
                  ? ` · ${resolution.unresolvedRows} row${resolution.unresolvedRows === 1 ? '' : 's'} dropped from the plot`
                  : ''}
              </span>
            ))}
            {resolveStatcast && model.resolutions.length === 0 ? (
              <span className="text-[#F59E0B]/70">
                Statcast resolve unavailable — no component on this axis has enough published rows to standardise
              </span>
            ) : null}
          </div>
        </div>

        {/* ── Fit + coverage readouts ────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-4 sm:grid-cols-4">
          <Stat
            label="Correlation r"
            value={fit ? fit.r.toFixed(3) : 'N/A'}
            accent={fit ? (fit.direction === 'positive' ? '#10B981' : '#F59E0B') : '#FFFFFF'}
            hint={fit ? `${fit.strength} ${fit.direction} · n=${fit.n}` : 'Needs 4+ plotted rows'}
          />
          <Stat
            label="Prime quadrant"
            value={String(model.quadrants[0].count)}
            accent="#10B981"
            hint={model.quadrants[0].meanHrpi != null ? `Mean HRPI ${model.quadrants[0].meanHrpi}` : 'No rows'}
          />
          <Stat
            label="Frontier rows"
            value={String(model.frontier.length)}
            accent="#6EE7B7"
            hint="Pareto-optimal on both axes"
          />
          <Stat
            label="Unplotted"
            value={String(model.excluded.length)}
            accent={model.excluded.length > 0 ? '#F59E0B' : '#FFFFFF'}
            hint={model.excluded.length > 0 ? 'Axis value not published' : 'Full axis coverage'}
          />
        </div>
      </div>

      {/* ── Game ladder ──────────────────────────────────────────────────── */}
      {gameIndex.games.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0a1010] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
              <Trophy className="h-3 w-3" />
              Overall game score ({gameIndex.games.length})
            </span>
            <span className="font-mono text-[9px] font-semibold text-white/30">
              {gameIndex.liveMatched > 0
                ? `${gameIndex.liveMatched}/${gameIndex.games.length} joined to the live feed`
                : 'Live feed unavailable — scores are the board projection only'}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {gameIndex.games.map((game) => (
              <GameCard
                key={game.key}
                game={game}
                leaderScore={gameIndex.games[0].score}
                active={gameFilter === game.key}
                onToggle={() => setGameFilter((prev) => (prev === game.key ? null : game.key))}
              />
            ))}
          </div>

          <p className="mt-3 flex items-start gap-1.5 border-t border-white/[0.07] pt-2.5 font-mono text-[9px] leading-relaxed text-white/30">
            <Info className="mt-px h-3 w-3 shrink-0" />
            {GAME_SCORE_METHODOLOGY}
          </p>
        </div>
      )}

      {/* ── Plot ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0a1010] p-3 sm:p-4">
        <div
          ref={attachWrap}
          onMouseLeave={() => setHoveredId(null)}
          className="relative h-[380px] w-full touch-none select-none sm:h-[460px] xl:h-[540px]"
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Scatter plot of ${yMetric.label} against ${xMetric.label} for ${model.points.length} rows`}
          >
            <defs>
              {/* Tight clip for the fitted line and the frontier path. */}
              <clipPath id="hr-matrix-plot-clip">
                <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} />
              </clipPath>
              {/* Nodes get a clip padded by the largest bubble, so a row sitting
                  exactly on a domain edge draws as a whole circle instead of a
                  half-disc cut off by the frame. */}
              <clipPath id="hr-matrix-node-clip">
                <rect
                  x={PAD.left - NODE_CLIP_PAD}
                  y={PAD.top - NODE_CLIP_PAD}
                  width={plotW + NODE_CLIP_PAD * 2}
                  height={plotH + NODE_CLIP_PAD * 2}
                />
              </clipPath>
            </defs>

            {/* Quadrant fills */}
            <rect
              x={splitX} y={PAD.top} width={Math.max(0, plotRight - splitX)} height={Math.max(0, splitY - PAD.top)}
              fill="#10B981" opacity={0.07}
            />
            <rect
              x={PAD.left} y={PAD.top} width={Math.max(0, splitX - PAD.left)} height={Math.max(0, splitY - PAD.top)}
              fill="#6EE7B7" opacity={0.04}
            />
            <rect
              x={splitX} y={splitY} width={Math.max(0, plotRight - splitX)} height={Math.max(0, plotBottom - splitY)}
              fill="#F59E0B" opacity={0.04}
            />

            {/* Gridlines + tick values — spaced across the visible window, so a
                zoomed axis prints the range actually on screen. */}
            {viewTicks.x.map((tick, i) => {
              const x = toPx(tick.n);
              return (
                <g key={`xt-${i}`}>
                  <line x1={x} y1={PAD.top} x2={x} y2={plotBottom} stroke="#FFFFFF" strokeOpacity={0.05} />
                  <text
                    x={x} y={plotBottom + 15} textAnchor="middle"
                    className="font-mono" fontSize={9} fill="#FFFFFF" fillOpacity={0.35}
                  >
                    {xMetric.format(tick.value)}
                  </text>
                </g>
              );
            })}
            {viewTicks.y.map((tick, i) => {
              const y = toPy(tick.n);
              return (
                <g key={`yt-${i}`}>
                  <line x1={PAD.left} y1={y} x2={plotRight} y2={y} stroke="#FFFFFF" strokeOpacity={0.05} />
                  <text
                    x={PAD.left - 8} y={y + 3} textAnchor="end"
                    className="font-mono" fontSize={9} fill="#FFFFFF" fillOpacity={0.35}
                  >
                    {yMetric.format(tick.value)}
                  </text>
                </g>
              );
            })}

            {/* Plot frame */}
            <rect
              x={PAD.left} y={PAD.top} width={plotW} height={plotH}
              fill="none" stroke="#FFFFFF" strokeOpacity={0.1}
            />

            {/* Threshold crosshair */}
            <line
              x1={splitX} y1={PAD.top} x2={splitX} y2={plotBottom}
              stroke="#FFFFFF" strokeOpacity={0.28} strokeDasharray="4 4"
            />
            <line
              x1={PAD.left} y1={splitY} x2={plotRight} y2={splitY}
              stroke="#FFFFFF" strokeOpacity={0.28} strokeDasharray="4 4"
            />

            {/* Brush capture surface. Declared before the nodes so the nodes sit
                above it and keep their own hover and click — a drag started on
                empty plot area still lands here and brushes a region. */}
            <rect
              x={PAD.left} y={PAD.top} width={plotW} height={plotH}
              fill="transparent"
              style={{ cursor: dragMode === 'pan' ? 'grab' : 'crosshair' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            {/* Voronoi hover surface. Each transparent cell is the region of the
                plot nearest to one node, so hovering anywhere inside it selects
                that row — the only way a 3px bubble in a dense band is a usable
                target. The cells carry the brush handlers too, so dragging still
                works across the whole plot. */}
            {voronoiCells ? (
              <g clipPath="url(#hr-matrix-plot-clip)">
                {voronoiCells.map((cell) => (
                  <path
                    key={`cell-${cell.id}`}
                    d={cell.path}
                    fill="transparent"
                    style={{ cursor: 'crosshair' }}
                    onMouseEnter={() => setHoveredId(cell.id)}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  />
                ))}
              </g>
            ) : null}

            <g clipPath="url(#hr-matrix-plot-clip)" pointerEvents="none">
              {/* Least-squares fit */}
              {showTrend && trend ? (
                <line
                  x1={trend.x1} y1={trend.y1} x2={trend.x2} y2={trend.y2}
                  stroke="#38BDF8" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="7 5"
                />
              ) : null}

              {/* Pareto frontier */}
              {showFrontier && model.frontier.length > 1 ? (
                <path
                  d={frontierPath}
                  fill="none" stroke="#6EE7B7" strokeOpacity={0.45}
                  strokeWidth={1.25} strokeDasharray="2 4"
                />
              ) : null}
            </g>

            {/* Nodes */}
            <g clipPath="url(#hr-matrix-node-clip)">
              {paintOrder.map(({ point, cx, cy, r }) => {
                const isHovered = point.id === hoveredId;
                const dimmed = !passesFilters(point);
                const accent = point.tier.accent;
                return (
                  <g
                    key={point.id}
                    opacity={dimmed ? 0.16 : 1}
                    onMouseEnter={() => setHoveredId(point.id)}
                    onMouseLeave={() => setHoveredId((prev) => (prev === point.id ? null : prev))}
                    onClick={() => onOpenResearch({ id: point.row.playerId || point.row.stableId, name: point.row.playerName })}
                    style={{ cursor: 'pointer' }}
                  >
                    {showFrontier && point.onFrontier ? (
                      <circle cx={cx} cy={cy} r={r + 3.5} fill="none" stroke={accent} strokeOpacity={0.5} strokeWidth={1} />
                    ) : null}
                    <circle
                      cx={cx} cy={cy} r={isHovered ? r + 2 : r}
                      fill={accent} fillOpacity={isHovered ? 0.5 : 0.22}
                      stroke={accent} strokeOpacity={isHovered ? 1 : 0.75} strokeWidth={isHovered ? 2 : 1.25}
                    />
                    {point.row.truthStatus === 'official' ? (
                      <circle cx={cx} cy={cy} r={1.6} fill={accent} />
                    ) : null}
                  </g>
                );
              })}
            </g>

            {/* Name labels — their own layer above every bubble, so a label is
                never buried by a node painted after it. */}
            <g pointerEvents="none">
              {labels.map((label) => (
                <g key={`label-${label.id}`}>
                  {label.leader ? (
                    <line
                      x1={label.leader.x1}
                      y1={label.leader.y1}
                      x2={label.leader.x2}
                      y2={label.leader.y2}
                      stroke="#FFFFFF"
                      strokeOpacity={0.35}
                      strokeWidth={0.75}
                    />
                  ) : null}
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor={label.anchor}
                    className="font-mono" fontSize={9} fontWeight={800}
                    fill="#FFFFFF" fillOpacity={0.82}
                    stroke="#060a0a" strokeWidth={3} strokeLinejoin="round" paintOrder="stroke"
                  >
                    {label.text}
                  </text>
                </g>
              ))}
            </g>

            {/* Brush rectangle */}
            <g clipPath="url(#hr-matrix-plot-clip)">
              {brush ? (
                <rect
                  x={Math.min(brush.x0, brush.x1)}
                  y={Math.min(brush.y0, brush.y1)}
                  width={Math.abs(brush.x1 - brush.x0)}
                  height={Math.abs(brush.y1 - brush.y0)}
                  fill="#10B981" fillOpacity={0.1}
                  stroke="#10B981" strokeOpacity={0.7} strokeDasharray="4 3"
                />
              ) : null}
            </g>

            {/* Quadrant captions — painted after the nodes and haloed against
                the plot ground, so a dense band never swallows them. */}
            <g
              className="font-mono"
              fontSize={9.5}
              fontWeight={800}
              stroke="#060a0a"
              strokeWidth={3.5}
              strokeLinejoin="round"
              paintOrder="stroke"
              pointerEvents="none"
            >
              <text x={plotRight} y={PAD.top - 11} textAnchor="end" fill="#10B981">
                {compactCaptions
                  ? model.quadrants[0].count
                  : `${model.quadrants[0].detail.toUpperCase()} · ${model.quadrants[0].count}`}
              </text>
              <text x={PAD.left} y={PAD.top - 11} fill="#6EE7B7" fillOpacity={0.75}>
                {compactCaptions
                  ? model.quadrants[1].count
                  : `${model.quadrants[1].detail.toUpperCase()} · ${model.quadrants[1].count}`}
              </text>
              <text x={plotRight - 8} y={plotBottom - 8} textAnchor="end" fill="#F59E0B" fillOpacity={0.75}>
                {model.quadrants[2].count}
              </text>
              <text x={PAD.left + 8} y={plotBottom - 8} fill="#FFFFFF" fillOpacity={0.4}>
                {model.quadrants[3].count}
              </text>
            </g>

            {/* Axis titles */}
            <text
              x={PAD.left + plotW / 2} y={height - 8} textAnchor="middle"
              className="font-mono" fontSize={10} fontWeight={800} fill="#F59E0B" fillOpacity={0.8}
            >
              {xMetric.label.toUpperCase()} ►
            </text>
            <text
              x={-(PAD.top + plotH / 2)} y={13} textAnchor="middle" transform="rotate(-90)"
              className="font-mono" fontSize={10} fontWeight={800} fill="#10B981" fillOpacity={0.8}
            >
              ▲ {yMetric.label.toUpperCase()}
            </text>
          </svg>

          {/* Hover card — HTML so the type stays crisp and the layout is flow-based */}
          {hovered && hoveredPlacement ? (
            <div
              className="pointer-events-none absolute z-20 w-56 rounded-xl border bg-[#060a0a]/97 p-3 shadow-2xl"
              style={{
                borderColor: `${hovered.tier.accent}59`,
                left: Math.min(Math.max(hoveredPlacement.cx + 14, 4), Math.max(4, width - 232)),
                top: Math.min(Math.max(hoveredPlacement.cy - 60, 4), Math.max(4, height - 170)),
              }}
            >
              <div className="flex items-center gap-2">
                <PlayerHeadshot
                  name={hovered.row.playerName}
                  playerId={hovered.row.playerId}
                  headshotUrl={hovered.row.headshotUrl}
                  size={30}
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold leading-tight text-white">
                    {hovered.row.playerName}
                  </span>
                  <span className="block truncate font-mono text-[9px] text-white/45">
                    {hovered.row.team} vs {hovered.row.opponent || 'TBD'}
                  </span>
                </div>
                <strong
                  className="shrink-0 font-mono text-base font-black leading-none tabular-nums"
                  style={{ color: hovered.tier.accent }}
                >
                  {hovered.hrpi}
                </strong>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <div className="rounded border border-white/[0.07] bg-[#0a1010] px-1.5 py-1">
                  <span className="block truncate font-mono text-[8px] uppercase tracking-[0.12em] text-[#10B981]">
                    {yMetric.short}
                  </span>
                  <strong className="font-mono text-[11px] font-black tabular-nums text-white">
                    {yMetric.format(hovered.y)}
                  </strong>
                </div>
                <div className="rounded border border-white/[0.07] bg-[#0a1010] px-1.5 py-1">
                  <span className="block truncate font-mono text-[8px] uppercase tracking-[0.12em] text-[#F59E0B]">
                    {xMetric.short}
                  </span>
                  <strong className="font-mono text-[11px] font-black tabular-nums text-white">
                    {xMetric.format(hovered.x)}
                  </strong>
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-1.5 font-mono text-[9px]">
                <span className="text-white/40">
                  Matrix <strong className="text-white/80 tabular-nums">{hovered.matrixScore}</strong>
                </span>
                <span className="text-white/40">
                  Resid{' '}
                  <strong className="tabular-nums text-white/80">
                    {hovered.residualZ != null ? `${hovered.residualZ > 0 ? '+' : ''}${hovered.residualZ.toFixed(2)}σ` : 'N/A'}
                  </strong>
                </span>
              </div>
              <span className="mt-1 block truncate font-mono text-[8.5px] text-white/30">
                {sizeMetric.short}: {hovered.size != null ? sizeMetric.format(hovered.size) : 'unavailable'}
              </span>

              {(() => {
                const game = gameIndex.byRowId.get(hovered.row.stableId);
                if (!game) return null;
                const runs = liveScoreLabel(game.live);
                const status = liveStatusLabel(game.live);
                return (
                  <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-1.5 font-mono text-[9px]">
                    <span className="truncate text-white/40">
                      Game <strong className="text-white/80 tabular-nums">{game.score}</strong>
                      <span className="text-white/25"> #{game.rank}</span>
                    </span>
                    <span className="shrink-0 truncate text-white/40">
                      {runs ? (
                        <>
                          <strong className="tabular-nums text-white/85">{runs}</strong>
                          {status ? <span className="text-white/30"> {status}</span> : null}
                        </>
                      ) : (
                        status ?? formatGameTime(game.gameTime)
                      )}
                    </span>
                  </div>
                );
              })()}
            </div>
          ) : null}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.07] pt-3 font-mono text-[9px] text-white/35">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-[#10B981] bg-[#10B981]/25" /> Tier colour = HRPI band
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" /> Filled centre = lineup confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-5 border-t border-dashed border-[#38BDF8]" /> Least-squares fit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-5 border-t border-dotted border-[#6EE7B7]" /> Pareto frontier
          </span>
          {model.unsizedRows > 0 ? (
            <span className="text-[#F59E0B]/70">
              {model.unsizedRows} row{model.unsizedRows === 1 ? '' : 's'} carry no {sizeMetric.short} — drawn at minimum radius
            </span>
          ) : null}
          {dispersal.displaced > 0 ? (
            <span className="text-white/45">
              {dispersal.displaced} row{dispersal.displaced === 1 ? '' : 's'} nudged by up to {dispersal.maxShift}px to
              stay separable
              {dispersal.coincident > 0
                ? ` (${dispersal.coincident} shared an exact coordinate)`
                : ''}{' '}
              — every printed value is still the true reading
            </span>
          ) : dispersal.coincident > 0 ? (
            <span className="text-[#F59E0B]/70">
              {dispersal.coincident} rows share a coordinate and draw as one bubble — turn Separate on to split them
            </span>
          ) : null}
          {voronoiCells === null ? (
            <span className="text-white/30">
              Pool too large for the Voronoi hover layer — hover the bubbles directly
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Quadrant aggregates ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {model.quadrants.map((quadrant) => {
          const active = quadrantFilter === quadrant.key;
          return (
            <button
              key={quadrant.key}
              type="button"
              onClick={() => setQuadrantFilter(active ? 'all' : quadrant.key)}
              aria-pressed={active}
              className="min-w-0 rounded-2xl border bg-[#0a1010] p-3 text-left transition-colors"
              style={{
                borderColor: active ? `${quadrant.accent}80` : 'rgba(255,255,255,0.07)',
                backgroundColor: active ? `${quadrant.accent}14` : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="truncate font-mono text-[9px] font-black uppercase tracking-[0.14em]"
                  style={{ color: quadrant.accent }}
                >
                  {quadrant.label}
                </span>
                <strong
                  className="shrink-0 font-mono text-lg font-black leading-none tabular-nums"
                  style={{ color: quadrant.accent }}
                >
                  {quadrant.count}
                </strong>
              </div>
              <span className="mt-1 block truncate font-mono text-[9px] font-semibold text-white/40">
                {quadrant.detail}
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-white/[0.07] pt-2 font-mono text-[9px] text-white/40">
                <span>
                  Mean HRPI{' '}
                  <strong className="tabular-nums text-white/75">{quadrant.meanHrpi ?? 'N/A'}</strong>
                </span>
                <span>
                  Mean EV{' '}
                  <strong className="tabular-nums text-white/75">
                    {quadrant.meanEvPct != null ? `${quadrant.meanEvPct > 0 ? '+' : ''}${quadrant.meanEvPct}%` : 'N/A'}
                  </strong>
                </span>
                <span>
                  Confirmed <strong className="tabular-nums text-white/75">{quadrant.confirmed}</strong>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Ranked list ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0a1010] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
            <Sigma className="h-3 w-3" />
            Ranked by Matrix Score ({visible.length})
          </span>
          <span className="font-mono text-[9px] font-semibold text-white/30">
            {selectionLabel ? `Filtered · ${selectionLabel}` : 'Whole plotted pool'}
          </span>
        </div>

        {visible.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center font-mono text-[10.5px] text-white/35">
            No plotted rows in this selection.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {listRows.map((point, i) => {
              const saved = Boolean(savedMap[point.row.stableId]);
              const isHovered = hoveredId === point.id;
              return (
                <div
                  key={point.id}
                  onMouseEnter={() => setHoveredId(point.id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === point.id ? null : prev))}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border bg-[#060a0a] px-3 py-2.5 transition-colors ${
                    isHovered ? 'border-white/25' : 'border-white/[0.07] hover:border-white/15'
                  }`}
                >
                  <span className="w-5 shrink-0 font-mono text-[10px] font-bold tabular-nums text-white/25">
                    {i + 1}
                  </span>
                  <PlayerHeadshot
                    name={point.row.playerName}
                    playerId={point.row.playerId}
                    headshotUrl={point.row.headshotUrl}
                    size={34}
                  />

                  <div className="min-w-0 flex-1 basis-40">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-bold leading-tight text-white">
                        {point.row.playerName}
                      </span>
                      {point.row.truthStatus === 'official' && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" title="Lineup confirmed" />
                      )}
                      {point.onFrontier && (
                        <span
                          className="inline-flex shrink-0 items-center gap-0.5 rounded border px-1 font-mono text-[8px] font-black uppercase"
                          style={{ color: '#6EE7B7', borderColor: '#6EE7B759', backgroundColor: '#6EE7B71F' }}
                          title={MATRIX_FRONTIER_METHODOLOGY}
                        >
                          Frontier
                        </span>
                      )}
                    </div>
                    {(() => {
                      const game = gameIndex.byRowId.get(point.row.stableId);
                      const runs = game ? liveScoreLabel(game.live) : null;
                      const status = game ? liveStatusLabel(game.live) : null;
                      return (
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[9.5px] font-semibold text-white/40">
                          <span className="truncate">
                            {point.row.team} vs {point.row.opponent || 'TBD'}
                            {point.evEdgePct != null ? ` · EV ${point.evEdgePct > 0 ? '+' : ''}${point.evEdgePct}%` : ''}
                          </span>
                          {game && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 rounded border border-white/10 bg-[#0a1010] px-1 text-white/50"
                              title={`${game.matchupLabel} — Game HR Score ${game.score}, ranked #${game.rank} on the slate`}
                            >
                              GAME <strong className="tabular-nums text-white/80">{game.score}</strong>
                            </span>
                          )}
                          {runs && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 rounded border px-1"
                              style={{
                                color: game?.live?.isLive ? '#EF4444' : '#FFFFFF80',
                                borderColor: game?.live?.isLive ? '#EF444459' : 'rgba(255,255,255,0.1)',
                              }}
                              title={GAME_LIVE_METHODOLOGY}
                            >
                              <strong className="tabular-nums">{runs}</strong>
                              {status ? <span className="opacity-70">{status}</span> : null}
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <div className="w-14 text-right">
                      <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#10B981]/70">
                        {yMetric.short}
                      </span>
                      <strong className="block font-mono text-[12px] font-black leading-none tabular-nums text-white">
                        {yMetric.format(point.y)}
                      </strong>
                    </div>
                    <div className="w-14 text-right">
                      <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#F59E0B]/70">
                        {xMetric.short}
                      </span>
                      <strong className="block font-mono text-[12px] font-black leading-none tabular-nums text-white">
                        {xMetric.format(point.x)}
                      </strong>
                    </div>
                    <div className="w-12 text-right" title={MATRIX_FIT_METHODOLOGY}>
                      <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
                        Resid
                      </span>
                      <strong
                        className="block font-mono text-[12px] font-black leading-none tabular-nums"
                        style={{
                          color:
                            point.residualZ == null ? '#FFFFFF66' : point.residualZ >= 0 ? '#10B981' : '#F59E0B',
                        }}
                      >
                        {point.residualZ != null
                          ? `${point.residualZ > 0 ? '+' : ''}${point.residualZ.toFixed(1)}σ`
                          : 'N/A'}
                      </strong>
                    </div>
                    <div className="w-12 text-right" title={MATRIX_SCORE_METHODOLOGY}>
                      <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
                        Matrix
                      </span>
                      <strong
                        className="block font-mono text-sm font-black leading-none tabular-nums"
                        style={{ color: point.tier.accent }}
                      >
                        {point.matrixScore}
                      </strong>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenResearch({ id: point.row.playerId || point.row.stableId, name: point.row.playerName })}
                      title={`Research ${point.row.playerName}`}
                      aria-label={`Research ${point.row.playerName}`}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-[#0a1010] text-white/45 transition-colors hover:border-white/20 hover:text-white"
                    >
                      <Search className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSaved(point.row.stableId)}
                      aria-pressed={saved}
                      title={saved ? 'Remove from saved' : 'Save row'}
                      aria-label={saved ? `Remove ${point.row.playerName} from saved` : `Save ${point.row.playerName}`}
                      className={`grid h-7 w-7 place-items-center rounded-lg border transition-colors ${
                        saved
                          ? 'border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#F59E0B]'
                          : 'border-white/[0.07] bg-[#0a1010] text-white/45 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToSlip(point.row)}
                      title={`Add ${point.row.playerName} to slip`}
                      aria-label={`Add ${point.row.playerName} to slip`}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-[#10B981]/35 bg-[#10B981]/15 text-[#10B981] transition-colors hover:bg-[#10B981]/25"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {visible.length > LIST_PAGE && (
              <button
                type="button"
                onClick={() => setListExpanded((prev) => !prev)}
                aria-expanded={listExpanded}
                className="w-full rounded-lg border border-white/[0.07] bg-[#060a0a] px-3 py-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50 transition-colors hover:border-white/20 hover:text-white"
              >
                {listExpanded ? `Show top ${LIST_PAGE}` : `Show all ${visible.length} plotted rows`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Unplotted tray ───────────────────────────────────────────────── */}
      {model.excluded.length > 0 && (
        <div className="rounded-2xl border border-[#F59E0B]/25 bg-[#0a1010] p-4">
          <button
            type="button"
            onClick={() => setExclusionsOpen((prev) => !prev)}
            aria-expanded={exclusionsOpen}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="flex min-w-0 items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#F59E0B]">
              <Crosshair className="h-3 w-3 shrink-0" />
              {model.excluded.length} row{model.excluded.length === 1 ? '' : 's'} not plotted
            </span>
            <span className="shrink-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/40">
              {exclusionsOpen ? 'Hide' : 'Show'}
            </span>
          </button>
          <p className="mt-2 font-mono text-[9.5px] leading-relaxed text-white/40">
            The pipeline published no value on at least one selected axis for these rows. They are held out of the
            plot, the fit, the frontier and every quadrant aggregate rather than being placed at a midpoint.
          </p>
          {exclusionsOpen && (
            <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-white/[0.07] pt-3 sm:grid-cols-2">
              {model.excluded.map(({ row, missing }) => (
                <div
                  key={row.stableId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-[#060a0a] px-2.5 py-1.5"
                >
                  <span className="min-w-0 truncate font-mono text-[10px] font-bold text-white/70">
                    {row.playerName}
                    <span className="text-white/30"> · {row.team}</span>
                  </span>
                  <span className="shrink-0 truncate font-mono text-[9px] text-[#F59E0B]/70">
                    {missing.join(' + ')} unavailable
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Methodology ──────────────────────────────────────────────────── */}
      <div className="space-y-1.5 rounded-2xl border border-white/[0.07] bg-[#0a1010] p-4">
        <span className="flex items-center gap-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35">
          <Info className="h-3 w-3" />
          Methodology
        </span>
        {[
          `${yMetric.short} (Y): ${yMetric.source}`,
          `${xMetric.short} (X): ${xMetric.source}`,
          `${sizeMetric.short} (bubble area): ${sizeMetric.source}`,
          MATRIX_SCORE_METHODOLOGY,
          MATRIX_THRESHOLD_METHODOLOGY,
          MATRIX_FIT_METHODOLOGY,
          MATRIX_FRONTIER_METHODOLOGY,
          MATRIX_COVERAGE_METHODOLOGY,
          MATRIX_RESOLUTION_METHODOLOGY,
          `Node separation: rows the plot would draw on one pixel are fanned apart by at most ${MAX_NODE_SHIFT}px so each keeps its own hover target. Position within a cluster is a drawing artefact — every number printed for a row is its published value.`,
          GAME_SCORE_METHODOLOGY,
          GAME_LIVE_METHODOLOGY,
        ].map((line) => (
          <p key={line} className="font-mono text-[9px] leading-relaxed text-white/30">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
});

/** Normalise a metric value onto a scale without clamping surprises at the edges. */
function normaliseFor(value: number, scale: MatrixScale): number {
  const span = scale.max - scale.min;
  if (span <= 0) return 0.5;
  return (value - scale.min) / span;
}

export default HrNextProjectionMatrix;
