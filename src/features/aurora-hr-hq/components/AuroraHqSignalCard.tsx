import { BookmarkPlus, Check, Clock3, ScanSearch } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import type { AuroraMaxEvidenceItem, AuroraMaxTruthState } from '../../../components/aurora-max/AuroraMaxPrimitives';
import type { HrMaxDeskRow } from '../../hr-max/mapHrWatchToDesk';
import type { HrResult } from '../../hr/hooks/useHrBoardViewModel';
import { AuroraHqProGateBadge } from './AuroraHqProGateBadge';

/** Evidence items 0-2 (power, pitch, park/weather) contain Statcast detail — gate in Free mode. */
const STATCAST_GATED_INDICES = new Set([0, 1, 2]);

function TruthBadge({ state, children }: { state: AuroraMaxTruthState; children: React.ReactNode }) {
  return (
    <span className={`aurora-hq__truth aurora-hq__truth--${state}`}>
      {state === 'confirmed' ? <Check className="h-2.5 w-2.5" aria-hidden="true" /> : <Clock3 className="h-2.5 w-2.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

function FactorBar({ label, score }: { label: string; score: number | null }) {
  const pct = score == null ? 0 : Math.max(4, Math.min(100, score));
  const display = score == null ? '—' : `${score}`;
  return (
    <div className="aurora-hq__factor">
      <span className="aurora-hq__factor-label">{label}</span>
      <span className="aurora-hq__factor-value">{display}</span>
      <div className="aurora-hq__factor-bar-track">
        <div className="aurora-hq__factor-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EvidenceLadder({
  items,
  isProMode,
  truthState,
  confidence,
}: {
  items: readonly AuroraMaxEvidenceItem[];
  isProMode: boolean;
  truthState: AuroraMaxTruthState;
  confidence: string;
}) {
  return (
    <div className="aurora-hq__ladder">
      <div className="aurora-hq__ladder-head">
        <span className="aurora-hq__ladder-title">Evidence ladder</span>
        <TruthBadge state={truthState}>{confidence}</TruthBadge>
      </div>
      {items.map((item, i) => {
        const score        = item.score == null ? null : Math.max(0, Math.min(100, item.score));
        const isGated      = !isProMode && STATCAST_GATED_INDICES.has(i);
        const hasDetail    = Boolean(item.detail?.trim());
        return (
          <div key={`${item.label}-${i}`}>
            <div className="aurora-hq__ladder-row">
              <span className="aurora-hq__ladder-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="aurora-hq__ladder-label">{item.label}</span>
              <span className={`aurora-hq__ladder-value aurora-hq__ladder-value--${item.tone ?? 'neutral'}`}>
                {String(item.value)}
              </span>
            </div>
            {score != null ? (
              <div className="aurora-hq__ladder-track">
                <div className="aurora-hq__ladder-fill" style={{ width: `${Math.max(4, score)}%` }} />
              </div>
            ) : null}
            {isGated ? (
              <AuroraHqProGateBadge />
            ) : hasDetail ? (
              <p className="aurora-hq__ladder-detail">{item.detail}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function outcomeCopy(result: HrResult): string | null {
  if (result === 'hit')   return 'HR recorded';
  if (result === 'no-hr') return 'No HR';
  return null;
}

type Props = {
  row: HrMaxDeskRow;
  result: HrResult;
  isProMode: boolean;
  onResearch: () => void;
  onAddToSlip: () => void;
};

/**
 * AuroraHqSignalCard — glassmorphic signal tile.
 * New file, new CSS identifiers (.aurora-hq-*). Not IntelV2PlayerCard, not Z8 CompactPlayerCard.
 */
export function AuroraHqSignalCard({ row, result, isProMode, onResearch, onAddToSlip }: Props) {
  const outcome = outcomeCopy(result);

  return (
    <article
      className="aurora-hq__card aurora-hq-glass"
      aria-label={`${row.playerName} HR signal — HRPI ${row.score}`}
    >
      {/* ── Identity ── */}
      <header className="aurora-hq__identity">
        <PlayerHeadshot playerId={row.player.id} headshotUrl={row.player.headshot} size={38} />
        <div style={{ minWidth: 0 }}>
          <h3 className="aurora-hq__name">{row.playerName}</h3>
          <p className="aurora-hq__pitcher">{row.pitcherName}</p>
          <div style={{ marginTop: '0.35rem' }}>
            <TruthBadge state={row.truthState}>{row.lineupLabel}</TruthBadge>
          </div>
        </div>
        <div className="aurora-hq__hrpi">
          <span className="aurora-hq__hrpi-label">HRPI</span>
          <span className="aurora-hq__hrpi-score">{row.score}</span>
          {outcome ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.4375rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fdba74' }}>
              {outcome}
            </span>
          ) : null}
        </div>
      </header>

      {/* ── Strike line ── */}
      <div className="aurora-hq__strike">
        <p>{row.signal}</p>
        <p>{row.read}</p>
      </div>

      {/* ── Factor bars (Power / Pitcher / Park) ── */}
      <div className="aurora-hq__factors">
        <FactorBar label="Power"   score={row.evidence[0]?.score ?? null} />
        <FactorBar label="Pitcher" score={row.evidence[1]?.score ?? null} />
        <FactorBar label="Park"    score={row.evidence[2]?.score ?? null} />
      </div>

      {/* ── Evidence ladder ── */}
      <EvidenceLadder
        items={row.evidence}
        isProMode={isProMode}
        truthState={row.truthState}
        confidence={row.evidenceConfidence}
      />

      {/* ── Footer CTAs ── */}
      <footer className="aurora-hq__card-ops">
        <button type="button" className="aurora-hq__control" onClick={onResearch} aria-label={`Research ${row.playerName}`}>
          <ScanSearch className="h-3 w-3" aria-hidden="true" />
          Research
        </button>
        <button
          type="button"
          className="aurora-hq__control aurora-hq__control--primary"
          onClick={onAddToSlip}
          disabled={false}
          aria-label={`Add ${row.playerName} to slip`}
        >
          <BookmarkPlus className="h-3 w-3" aria-hidden="true" />
          Slip
        </button>
      </footer>
    </article>
  );
}
