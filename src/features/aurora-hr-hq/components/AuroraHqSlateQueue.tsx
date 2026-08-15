import { ChevronDown, FileCheck2, Shield, Star, X } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { AuroraMaxEyebrow } from '../../../components/aurora-max/AuroraMaxPrimitives';
import type { HrMaxDeskRow } from '../../hr-max/mapHrWatchToDesk';
import type { HrResult } from '../../hr/hooks/useHrBoardViewModel';

/** Slide-out research receipt rendered inline under each row. */
function AuroraHqReceiptDrawer({ row, onClose }: { row: HrMaxDeskRow; onClose: () => void }) {
  return (
    <div className="aurora-hq__receipt" role="region" aria-label={`${row.playerName} research receipt`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.65rem', minWidth: 0 }}>
          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#10b981' }} aria-hidden="true" />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.625rem', fontWeight: 600, color: '#e7e9e2' }}>
              Research receipt · {row.playerName}
            </p>
            <p style={{ marginTop: '0.2rem', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.35)' }}>
              {row.receipt.updated} · original conclusion preserved
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close receipt" style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Strike */}
      <div className="aurora-hq__strike" style={{ marginTop: '0.75rem' }}>
        <p>{row.signal}</p>
        <p>{row.read}</p>
      </div>

      <div className="aurora-hq__receipt-grid">
        {[
          { label: 'Original conclusion', text: row.reasoningSnapshot },
          { label: 'Main risk',           text: row.riskSnapshot },
          { label: 'Sources',             text: row.receipt.sources.join(' · ') },
          { label: 'Missing inputs',      text: row.receipt.missing },
          { label: 'Methodology',         text: row.receipt.methodology },
        ].map(({ label, text }) => (
          <div key={label} className="aurora-hq__receipt-section">
            <span className="aurora-hq__receipt-label">{label}</span>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  rows: HrMaxDeskRow[];
  activeId: string | null;
  savedIds: Set<string>;
  receiptId: string | null;
  results: (playerId: string | number | null) => HrResult;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt: (id: string) => void;
};

/**
 * AuroraHqSlateQueue — ranked matchup table.
 * Uses content-visibility:auto per row for first-paint performance without adding a library.
 * New markup, new CSS identifiers — not IntelV2Queue, not HrMaxSlateQueue.
 */
export function AuroraHqSlateQueue({
  rows,
  activeId,
  savedIds,
  receiptId,
  results,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
}: Props) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)' }} role="status">
        No ranked matchups — the active filters returned no eligible slate rows.
      </div>
    );
  }

  return (
    <div className="aurora-hq__workspace" role="list" aria-label="Ranked matchups">
      {/* Column headers — hidden on mobile, shown at sm */}
      <div className="aurora-hq__workspace-head-row" role="row" aria-hidden="true">
        <span>Matchup</span>
        <span>Research row</span>
        <span>HRPI</span>
        <span>Lineup</span>
        <span>Tier</span>
        <span style={{ textAlign: 'right' }}>Receipt</span>
      </div>

      {rows.map((row, index) => {
        const active      = row.id === activeId;
        const receiptOpen = receiptId === row.id;
        const saved       = savedIds.has(row.id);
        const result      = results(row.player.id);

        return (
          <div key={row.id} role="listitem">
            <div className={`aurora-hq__qrow ${active ? 'is-active' : ''}`}>
              {active ? <span className="aurora-hq__accent" aria-hidden="true" /> : null}

              {/* Main select button */}
              <button
                type="button"
                onClick={() => onSelect(row.id)}
                aria-pressed={active}
                className="aurora-hq__qselect"
              >
                {/* Matchup */}
                <span className="aurora-hq__qcell">
                  <span className={`aurora-hq__qindex${active ? ' is-active' : ''}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span className="aurora-hq__qmatch">{row.matchupLabel}</span>
                    <span className="aurora-hq__qmatch-time">{row.gameTimeLabel}</span>
                  </span>
                </span>

                <span className="aurora-hq__qcell">
                  <PlayerHeadshot playerId={row.player.id} headshotUrl={row.player.headshot} size={28} />
                  <span className="min-w-0">
                    <span className="aurora-hq__qplayer">{row.playerName}</span>
                    <span className="aurora-hq__qplayer-meta">
                      {row.team}
                      {result === 'hit' ? ' · HR recorded' : result === 'no-hr' ? ' · No HR' : ''}
                    </span>
                  </span>
                </span>

                <span className="aurora-hq__qscore">{row.score}</span>

                <span className={`aurora-hq__truth aurora-hq__truth--${row.truthState} overflow-hidden text-ellipsis whitespace-nowrap`}>
                  {row.confirmed ? 'Confirmed' : row.lineupLabel}
                </span>

                <span className="aurora-hq__qtier">{row.displayTier ?? '—'}</span>
              </button>

              {/* Action buttons */}
              <span className="aurora-hq__qactions">
                <button
                  type="button"
                  onClick={() => onToggleSaved(row.id)}
                  aria-label={`${saved ? 'Remove' : 'Queue'} ${row.playerName}`}
                  className={`aurora-hq__qicon ${saved ? 'is-saved' : ''}`}
                >
                  <Star className="h-3 w-3" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleReceipt(row.id)}
                  aria-expanded={receiptOpen}
                  aria-label={`${receiptOpen ? 'Close' : 'Open'} ${row.playerName} receipt`}
                  className="aurora-hq__receipt-btn"
                >
                  <FileCheck2 className="h-3 w-3" aria-hidden="true" />
                  <ChevronDown className={`h-2.5 w-2.5 transition-transform duration-200 ${receiptOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              </span>
            </div>

            {/* Inline receipt drawer */}
            {receiptOpen ? (
              <AuroraHqReceiptDrawer row={row} onClose={() => onToggleReceipt(row.id)} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
