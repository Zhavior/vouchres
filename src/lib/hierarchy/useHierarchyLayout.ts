/**
 * Thin React wrappers around d3-hierarchy's layout algorithms. These hooks
 * only ever compute numbers (x/y/r/depth) via useMemo — no DOM manipulation,
 * no d3-selection. Rendering stays 100% React/SVG so it composes normally
 * with the rest of the app (click handlers, Framer Motion, etc.).
 */
import { useMemo } from 'react';
import {
  hierarchy,
  treemap as d3Treemap,
  treemapSquarify,
  pack as d3Pack,
  tree as d3Tree,
  cluster as d3Cluster,
  type HierarchyNode,
  type HierarchyRectangularNode,
  type HierarchyCircularNode,
  type HierarchyPointNode,
} from 'd3-hierarchy';

export interface HierarchyDatum {
  name: string;
  value?: number;
  children?: HierarchyDatum[];
  [key: string]: unknown;
}

function buildRoot<T extends HierarchyDatum>(data: T): HierarchyNode<T> {
  return hierarchy(data, (d) => d.children as T[] | undefined)
    .sum((d) => d.value ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
}

export function useTreemapLayout<T extends HierarchyDatum>(
  data: T,
  width: number,
  height: number,
  paddingInner = 2,
): HierarchyRectangularNode<T> {
  return useMemo(() => {
    const root = buildRoot(data);
    d3Treemap<T>()
      .tile(treemapSquarify)
      .size([Math.max(1, width), Math.max(1, height)])
      .paddingInner(paddingInner)
      .round(true)(root);
    return root as HierarchyRectangularNode<T>;
  }, [data, width, height, paddingInner]);
}

export function usePackLayout<T extends HierarchyDatum>(
  data: T,
  width: number,
  height: number,
  padding = 4,
): HierarchyCircularNode<T> {
  return useMemo(() => {
    const root = buildRoot(data);
    d3Pack<T>()
      .size([Math.max(1, width), Math.max(1, height)])
      .padding(padding)(root);
    return root as HierarchyCircularNode<T>;
  }, [data, width, height, padding]);
}

export function useTreeLayout<T extends HierarchyDatum>(
  data: T,
  width: number,
  height: number,
  mode: 'tree' | 'cluster' = 'tree',
): HierarchyPointNode<T> {
  return useMemo(() => {
    const root = hierarchy(data, (d) => d.children as T[] | undefined);
    const layout = mode === 'cluster' ? d3Cluster<T>() : d3Tree<T>();
    layout.size([Math.max(1, height), Math.max(1, width)])(root);
    // d3's tree/cluster lay out (x=breadth, y=depth); swap so callers get a
    // left-to-right tree in normal SVG (x=depth, y=breadth) coordinates.
    root.each((node) => {
      const n = node as unknown as { x: number; y: number };
      const swapped = n.x;
      n.x = n.y;
      n.y = swapped;
    });
    return root as HierarchyPointNode<T>;
  }, [data, width, height, mode]);
}
