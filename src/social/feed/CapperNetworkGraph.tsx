import React, { Suspense, lazy, useMemo } from 'react';
import type { ElementDefinition, StylesheetJson } from 'cytoscape';

import type { FeedPost } from '../../types';
const CytoscapeGraph = lazy(() => import('../../lib/graph/CytoscapeGraph'));

interface CapperNetworkGraphProps {
  posts: FeedPost[];
  followingList: string[];
  onSelectCapper?: (username: string) => void;
}

const STYLESHEET: StylesheetJson = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      label: 'data(label)',
      color: '#f8fafc',
      'font-size': 10,
      'font-weight': 700,
      'text-valign': 'bottom',
      'text-margin-y': 6,
      width: 'data(size)',
      height: 'data(size)',
      'border-width': 2,
      'border-color': 'data(color)',
      'border-opacity': 0.6,
    },
  },
  {
    selector: 'node[kind = "you"]',
    style: {
      'background-color': '#00F0FF',
      'border-color': '#00F0FF',
      width: 46,
      height: 46,
      'font-size': 11,
    },
  },
  {
    selector: 'edge',
    style: {
      width: 1.5,
      'line-color': 'rgba(255,255,255,0.18)',
      'curve-style': 'bezier',
      'target-arrow-shape': 'none',
    },
  },
];

/**
 * Real capper-relationship graph: you at the center, each account you
 * actually follow/tail as a node, sized by their real total vouches across
 * posts already loaded in the feed. No synthetic edges or invented stats.
 */
export const CapperNetworkGraph: React.FC<CapperNetworkGraphProps> = ({ posts, followingList, onSelectCapper }) => {
  const elements = useMemo<ElementDefinition[]>(() => {
    const byUsername = new Map<string, { displayName: string; isVerified?: boolean; vouches: number; posts: number }>();
    for (const post of posts) {
      if (!followingList.includes(post.username)) continue;
      const existing = byUsername.get(post.username) ?? { displayName: post.displayName, isVerified: post.isVerified, vouches: 0, posts: 0 };
      existing.vouches += post.vouchesCount ?? 0;
      existing.posts += 1;
      existing.isVerified = existing.isVerified || post.isVerified;
      byUsername.set(post.username, existing);
    }

    const nodes: ElementDefinition[] = [{ data: { id: 'you', label: 'You', kind: 'you', color: '#00F0FF', size: 46 } }];
    const edges: ElementDefinition[] = [];

    for (const username of followingList) {
      const stats = byUsername.get(username);
      const size = 22 + Math.min(28, (stats?.vouches ?? 0) / 4);
      nodes.push({
        data: {
          id: username,
          label: `@${username}`,
          color: stats?.isVerified ? '#00FF94' : '#94a3b8',
          size,
        },
      });
      edges.push({ data: { id: `you-${username}`, source: 'you', target: username } });
    }

    return [...nodes, ...edges];
  }, [posts, followingList]);

  if (followingList.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-2">
      <div className="mb-1 flex items-center justify-between px-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        <span>Your network — node size = real vouches received</span>
        <span className="flex items-center gap-3 normal-case tracking-normal">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#00FF94' }} />Verified</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#94a3b8' }} />Unverified</span>
        </span>
      </div>
      <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/45">Loading graph...</div>}>
        <CytoscapeGraph
        elements={elements}
        stylesheet={STYLESHEET}
        layout={{ name: 'cose', animate: false, fit: true, padding: 28 } as any}
        height={320}
        onNodeClick={(id) => {
          if (id !== 'you') onSelectCapper?.(id);
        }}
      />
      </Suspense>
    </div>
  );
};

export default CapperNetworkGraph;
