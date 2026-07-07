/**
 * Thin React wrapper around Cytoscape.js. Unlike the d3-hierarchy hooks
 * (math-only, rendered via React/SVG), Cytoscape owns its own canvas and
 * simulation loop, so it's mounted imperatively into a container div and
 * torn down on unmount/prop change — the standard Cytoscape+React pattern.
 */
import React, { useEffect, useRef } from 'react';
import cytoscape, {
  type ElementDefinition,
  type StylesheetJson,
  type LayoutOptions,
  type Core,
  type NodeSingular,
} from 'cytoscape';

export interface CytoscapeGraphProps {
  elements: ElementDefinition[];
  stylesheet: StylesheetJson;
  layout?: LayoutOptions;
  height?: number | string;
  onNodeClick?: (id: string, data: Record<string, unknown>) => void;
  className?: string;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  elements,
  stylesheet,
  layout,
  height = 360,
  onNodeClick,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: stylesheet,
      layout: layout ?? { name: 'cose', animate: false, fit: true, padding: 28 },
      minZoom: 0.4,
      maxZoom: 2.5,
      wheelSensitivity: 0.25,
    });
    cyRef.current = cy;

    if (onNodeClick) {
      cy.on('tap', 'node', (evt) => {
        const node = evt.target as NodeSingular;
        onNodeClick(node.id(), node.data());
      });
    }

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, stylesheet, layout]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height }} />;
};

export default CytoscapeGraph;
