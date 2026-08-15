import React from 'react';
import { Check } from 'lucide-react';
import { AuroraMaxFallback, AuroraMaxControl } from '../../../components/aurora-max/AuroraMaxPrimitives';
import HrMaxRouteSkeleton from '../HrMaxRouteSkeleton';

export interface HrMaxStatusBarProps {
  autoSwitchedToPreview: boolean;
  refreshError: string | null;
  exportStatus: string | null;
  loading: boolean;
  error: string | null;
  hasRows: boolean;
  confirmedOnly: boolean;
  onRetry: () => void;
  onShowAll: () => void;
}

export const HrMaxStatusBar = React.memo(function HrMaxStatusBar({
  autoSwitchedToPreview,
  refreshError,
  exportStatus,
  loading,
  error,
  hasRows,
  confirmedOnly,
  onRetry,
  onShowAll,
}: HrMaxStatusBarProps) {
  return (
    <>
      {autoSwitchedToPreview ? (
        <div className="hr-max-desk__status hr-max-desk__status--warning" role="status">
          Confirmed lineups are not posted yet. Showing projected research rows, labeled as projected.
        </div>
      ) : null}
      
      {refreshError ? (
        <div className="hr-max-desk__status hr-max-desk__status--warning" role="status">
          {refreshError}
        </div>
      ) : null}
      
      {exportStatus ? (
        <div className="hr-max-desk__status" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> {exportStatus}
        </div>
      ) : null}

      {loading && !hasRows ? <HrMaxRouteSkeleton /> : null}

      {error && !hasRows ? (
        <AuroraMaxFallback
          title="Board unavailable"
          detail={error}
          action={<AuroraMaxControl onClick={onRetry} className="mt-3">Retry board</AuroraMaxControl>}
        />
      ) : null}

      {!loading && !error && !hasRows ? (
        <AuroraMaxFallback
          title="No research rows"
          detail={confirmedOnly
            ? 'No confirmed-lineup rows are on this slate yet. Switch to all lineups to inspect projected research.'
            : 'The validated board returned no eligible rows for this date.'}
          action={confirmedOnly ? (
            <AuroraMaxControl onClick={onShowAll} className="mt-3">Show all lineups</AuroraMaxControl>
          ) : undefined}
        />
      ) : null}
    </>
  );
});
