import React, { Suspense, lazy } from 'react';
import type { ElementDefinition, StylesheetJson } from 'cytoscape';

import type { PublicParlaySlip } from '../../../lib/parlayDisplay';
const CytoscapeGraph = lazy(() => import('../../../lib/graph/CytoscapeGraph'));

interface ParlayCorrelationGraphProps {
  slips: PublicParlaySlip[];
}

const STYLESHEET: StylesheetJson = [
  {
    selector: 'node',
    style: {
      'background-color': '#00F0FF',
      'background-opacity': 0.85,
      label: 'data(label)',
      color: '#f8fafc',
      'font-size': 9,
      'font-weight': 700,
      'text-valign': 'bottom',
      'text-margin-y': 5,
      width: 'data(size)',
      height: 'data(size)',
      'border-width': 1.5,
      'border-color': '#00F0FF',
      'border-opacity': 0.5,
    },
  },
  {
    selector: 'edge',
    style: {
      width: 'data(width)',
      'line-color': 'rgba(0,255,148,0.35)',
      'curve-style': 'bezier',
      'target-arrow-shape': 'none',
    },
  },
];

/**
 * Which players/legs actually appear together across a user's own saved
 * slips — nodes = distinct legs (sized by how many slips they appear in),
 * edges = real co-occurrence counts. No invented correlation data.
 */
export const ParlayCorrelationGraph: React.FC<ParlayCorrelationGraphProps> = ({ slips }) => {
  const elements = useMemo<ElementDefinition[]>(() => {
    const legCount = new Map<string, number>();
    const pairCount = new Map<string, number>();

    for (const slip of slips) {
      const names = Array.from(new Set((slip.legs ?? []).map((l) => l.playerName).filter(Boolean)));
      for (const name of names) legCount.set(name, (legCount.get(name) ?? 0) + 1);
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const key = [names[i], names[j]].sort().join('__');
          pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
        }
      }
    }

    const nodes: ElementDefinition[] = Array.from(legCount.entries()).map(([name, count]) => ({
      data: { id: name, label: name, size: 18 + Math.min(30, count * 6) },
    }));
    const edges: ElementDefinition[] = Array.from(pairCount.entries()).map(([key, count]) => {
      const [source, target] = key.split('__');
      return { data: { id: key, source, target, width: 1 + Math.min(6, count * 1.5) } };
    });

    return [...nodes, ...edges];
  }, [slips]);

  const legTotal = useMemo(() => new Set(slips.flatMap((s) => (s.legs ?? []).map((l) => l.playerName))).size, [slips]);

  if (legTotal < 2) return null;

  return (
    <div className="rounded-2xl border border-[hsl(var(--ve-border)/0.5)] bg-[hsl(var(--ve-surface)/0.6)] p-2">
      <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))]">
        Legs that co-occur in your saved slips
      </p>
      <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/45">Loading graph...</div>}>
        <CytoscapeGraph
        elements={elements}
        stylesheet={STYLESHEET}
        layout={{ name: 'cose', animate: false, fit: true, padding: 24 } as any}
        height={260}
      />
      </Suspense>
    </div>
  );
};

export default ParlayCorrelationGraph;
