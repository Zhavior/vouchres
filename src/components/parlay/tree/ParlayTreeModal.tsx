import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { HierarchyPointNode } from 'd3-hierarchy';
import { useTreeLayout, type HierarchyDatum } from '../../../lib/hierarchy/useHierarchyLayout';
import type { PublicParlaySlip, PublicParlayLeg, PublicSlipStatus } from '../../../lib/parlayDisplay';

interface ParlayTreeModalProps {
  slip: PublicParlaySlip | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TreeDatum extends HierarchyDatum {
  leg?: PublicParlayLeg;
  isRoot?: boolean;
}

const STATUS_COLOR: Record<PublicSlipStatus, string> = {
  PENDING: 'rgba(255,255,255,0.4)',
  UPCOMING: 'rgba(255,255,255,0.4)',
  LIVE: '#00F0FF',
  WON: '#00FF94',
  LOST: '#fb7185',
  PUSH: 'rgba(255,255,255,0.4)',
  VOID: 'rgba(255,255,255,0.4)',
};

const STATUS_ICON: Record<PublicSlipStatus, string> = {
  PENDING: '…',
  UPCOMING: '…',
  LIVE: '▶',
  WON: '✓',
  LOST: '✕',
  PUSH: '–',
  VOID: '–',
};

const W = 880;
const NODE_H = 64;

export const ParlayTreeModal: React.FC<ParlayTreeModalProps> = ({ slip, isOpen, onClose }) => {
  const legs = useMemo(() => (Array.isArray(slip?.legs) ? slip!.legs : []), [slip]);

  const data = useMemo<TreeDatum>(() => ({
    name: slip?.title ?? 'Parlay',
    isRoot: true,
    children: legs.map((leg, i) => ({
      name: leg.playerName || leg.marketLabel || `Leg ${i + 1}`,
      value: 1,
      leg,
    })),
  }), [slip, legs]);

  const height = Math.max(180, legs.length * NODE_H + 40);
  const root = useTreeLayout(data, W - 260, height - 40, 'tree') as HierarchyPointNode<TreeDatum>;
  const nodes = root.descendants();
  const links = root.links();

  const slipStatus = (slip?.status ?? 'PENDING') as PublicSlipStatus;
  const slipColor = STATUS_COLOR[slipStatus] ?? STATUS_COLOR.PENDING;

  return (
    <AnimatePresence>
      {isOpen && slip && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[hsl(var(--ve-border)/0.5)] bg-[hsl(var(--ve-bg-panel))] shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[hsl(var(--ve-border)/0.4)] px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[hsl(var(--ve-text-primary))]">{slip.title || 'Parlay structure'}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: slipColor }}>
                  {STATUS_ICON[slipStatus]} {slip.statusLabel || slipStatus} · {legs.length} leg{legs.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[hsl(var(--ve-text-muted))] transition hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-4">
              {legs.length === 0 ? (
                <p className="py-10 text-center text-xs text-[hsl(var(--ve-text-muted))]">This slip has no legs yet.</p>
              ) : (
                <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: 'block' }} role="img" aria-label="Parlay leg structure">
                  {links.map((link, i) => {
                    const s = link.source as unknown as { x: number; y: number };
                    const t = link.target as unknown as { x: number; y: number };
                    const midX = (s.x + t.x) / 2;
                    return (
                      <path
                        key={i}
                        d={`M${s.x + 90},${s.y} C${midX + 90},${s.y} ${midX + 90},${t.y} ${t.x + 90},${t.y}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.16)"
                        strokeWidth={1.5}
                      />
                    );
                  })}
                  {nodes.map((node, i) => {
                    const n = node as unknown as { x: number; y: number };
                    const d = node.data as TreeDatum;
                    if (d.isRoot) {
                      return (
                        <g key={i} transform={`translate(${n.x + 90},${n.y})`}>
                          <circle r={22} fill="rgba(0,240,255,0.12)" stroke="#00F0FF" strokeWidth={1.5} />
                          <text x={0} y={4} textAnchor="middle" fontSize={16}>🎟️</text>
                        </g>
                      );
                    }
                    const leg = d.leg;
                    const legStatus = (leg?.status ?? 'PENDING') as PublicSlipStatus;
                    const color = STATUS_COLOR[legStatus] ?? STATUS_COLOR.PENDING;
                    return (
                      <g key={i} transform={`translate(${n.x + 90},${n.y})`}>
                        <rect x={0} y={-18} width={260} height={36} rx={10} fill="rgba(255,255,255,0.03)" stroke={color} strokeOpacity={0.5} />
                        <text x={10} y={-3} fontSize={11} fontWeight={700} fill="#f8fafc">
                          {(leg?.playerName || d.name || '').slice(0, 28)}
                        </text>
                        <text x={10} y={12} fontSize={10} fill="rgba(255,255,255,0.55)">
                          {leg?.marketLabel || '—'} {leg?.oddsLabel ? `· ${leg.oddsLabel}` : ''}
                        </text>
                        <text x={250} y={4} textAnchor="end" fontSize={13} fill={color}>{STATUS_ICON[legStatus]}</text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ParlayTreeModal;
