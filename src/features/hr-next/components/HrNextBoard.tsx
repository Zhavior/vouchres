import { useState, useMemo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import type { HrNextItem } from '../hooks/useHrNextData';
import { HrNextCard } from './HrNextCard';
import { HrNextVisualLayer } from './HrNextVisualLayer';
import type { GroupByMode } from '../hooks/useHrNextData';

interface HrNextBoardProps {
  items: HrNextItem[];
  savedMap: Record<string, true>;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: any) => void;
  is3DLayerEnabled: boolean;
  groupBy?: GroupByMode;
}

interface MatchupGroup {
  header: Extract<HrNextItem, { type: 'header' }>;
  awayTeam: string;
  homeTeam: string;
  away: Extract<HrNextItem, { type: 'row' }>[];
  home: Extract<HrNextItem, { type: 'row' }>[];
}

export function HrNextBoard({ items, savedMap, onToggleSaved, onAddToSlip, is3DLayerEnabled, groupBy }: HrNextBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openReceiptId, setOpenReceiptId] = useState<string | null>(null);

  const isMatchupMode = groupBy === 'matchup';

  const matchups = useMemo(() => {
    if (!isMatchupMode) return [];
    
    const result: MatchupGroup[] = [];
    let currentMatchup: MatchupGroup | null = null;
    
    for (const item of items) {
      if (item.type === 'header') {
        if (currentMatchup) result.push(currentMatchup);
        currentMatchup = { header: item, awayTeam: '', homeTeam: '', away: [], home: [] };
      } else if (item.type === 'row' && currentMatchup) {
        if (currentMatchup.away.length === 0 && currentMatchup.home.length === 0) {
          currentMatchup.awayTeam = item.row.team;
          currentMatchup.away.push(item);
        } else if (item.row.team === currentMatchup.awayTeam) {
          currentMatchup.away.push(item);
        } else {
          if (!currentMatchup.homeTeam) currentMatchup.homeTeam = item.row.team;
          currentMatchup.home.push(item);
        }
      }
    }
    if (currentMatchup) result.push(currentMatchup);
    return result;
  }, [items, isMatchupMode]);

  return (
    <LayoutGroup id="hrnext-board">
      {/* 3D Visual Layer (Phase 5) */}
      <HrNextVisualLayer isVisible={is3DLayerEnabled} />

      {isMatchupMode ? (
        matchups.map((matchup) => (
          <div key={matchup.header.id} className="bg-[#060a0a]/90 border border-white/10 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                {matchup.awayTeam || 'AWAY'} <span className="text-white/40">@</span> {matchup.homeTeam || 'HOME'}
              </h2>
              <span className="text-[10px] text-white/50">{matchup.away.length + matchup.home.length} ANALYZED</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Away */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-white/40 uppercase mb-2">Away ({matchup.awayTeam})</h3>
                {matchup.away.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    layoutId={`hrnext-card-${item.row.stableId}`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <HrNextCard
                      row={item.row}
                      compact={true}
                      active={activeId === item.row.stableId}
                      saved={Boolean(savedMap[item.row.stableId])}
                      isReceiptOpen={openReceiptId === item.row.stableId}
                      onSelect={(id) => setActiveId(id)}
                      onToggleSaved={onToggleSaved}
                      onToggleReceipt={(id) => setOpenReceiptId(prev => prev === id ? null : id)}
                      onAddToSlip={onAddToSlip}
                    />
                  </motion.div>
                ))}
              </div>
              {/* Home */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-white/40 uppercase mb-2">Home ({matchup.homeTeam})</h3>
                {matchup.home.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    layoutId={`hrnext-card-${item.row.stableId}`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <HrNextCard
                      row={item.row}
                      compact={true}
                      active={activeId === item.row.stableId}
                      saved={Boolean(savedMap[item.row.stableId])}
                      isReceiptOpen={openReceiptId === item.row.stableId}
                      onSelect={(id) => setActiveId(id)}
                      onToggleSaved={onToggleSaved}
                      onToggleReceipt={(id) => setOpenReceiptId(prev => prev === id ? null : id)}
                      onAddToSlip={onAddToSlip}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        items.map((item) => {
          if (item.type === 'header') {
            return (
              <motion.h2 
                key={item.id} 
                layout 
                className="text-sm font-black uppercase tracking-widest text-vouch-cyan mt-6 mb-2 first:mt-0"
              >
                {item.tier}
              </motion.h2>
            );
          }

          return (
            <motion.div 
              key={item.id} 
              className="w-full mb-3"
              layout
              layoutId={`hrnext-card-${item.row.stableId}`}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            >
              <HrNextCard
                row={item.row}
                compact={false}
                active={activeId === item.row.stableId}
                saved={Boolean(savedMap[item.row.stableId])}
                isReceiptOpen={openReceiptId === item.row.stableId}
                onSelect={(id) => setActiveId(id)}
                onToggleSaved={onToggleSaved}
                onToggleReceipt={(id) => setOpenReceiptId(prev => prev === id ? null : id)}
                onAddToSlip={onAddToSlip}
              />
            </motion.div>
          );
        })
      )}
    </LayoutGroup>
  );
}
