import React from 'react';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
import { HrMaxSpotlightDeck } from './HrMaxSpotlightDeck';
import { HrMaxSpotlight } from './HrMaxSpotlight';

export interface HrMaxSidecarProps {
  activeRow: HrMaxDeskRow | null;
  saved: boolean;
  onToggleSaved: () => void;
  rawRows: readonly HrWatchRow[];
  onSpotlightSelect: (row: HrWatchRow) => void;
  onAddToSlip: (row: HrWatchRow) => void;
  onDeskAddToSlip?: (row: HrMaxDeskRow) => void;
}

export const HrMaxSidecar = React.memo(function HrMaxSidecar({
  activeRow,
  saved,
  onToggleSaved,
  rawRows,
  onSpotlightSelect,
  onAddToSlip,
  onDeskAddToSlip,
}: HrMaxSidecarProps) {
  return (
    <>
      {rawRows.length > 0 ? (
        <HrMaxSpotlightDeck
          rows={rawRows}
          onSelect={onSpotlightSelect}
          onAddToSlip={onAddToSlip}
        />
      ) : null}
      
      {activeRow ? (
        <HrMaxSpotlight 
          row={activeRow} 
          saved={saved} 
          onToggleSaved={onToggleSaved} 
          onAddToSlip={onDeskAddToSlip}
        />
      ) : null}
    </>
  );
});
