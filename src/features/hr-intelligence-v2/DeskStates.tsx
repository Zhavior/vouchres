import { AuroraMaxControl, AuroraMaxFallback } from '../../components/aurora-max/AuroraMaxPrimitives';

export function BoardLoadingState() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading Home Run Intelligence">
      <div className="hr-intel-v2-pulse h-16" />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="hr-intel-v2-pulse min-h-[22rem]" />
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="hr-intel-v2-pulse h-12" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BoardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <AuroraMaxFallback
      title="Home Run Intelligence could not load"
      detail={message}
      action={<AuroraMaxControl className="mt-4" onClick={onRetry}>Retry</AuroraMaxControl>}
    />
  );
}

export function BoardEmptyState({
  noConfirmed,
  previewCount,
  onShowPreview,
  onRetry,
}: {
  noConfirmed: boolean;
  previewCount: number;
  onShowPreview: () => void;
  onRetry: () => void;
}) {
  return (
    <AuroraMaxFallback
      title={noConfirmed ? 'No confirmed lineups posted yet' : 'No players to show'}
      detail={
        noConfirmed
          ? `Official batting orders are not posted. ${previewCount} preview candidates are scored from projected lineups. Confirmed is never invented.`
          : 'There are no Home Run Intelligence candidates for the current filters or slate.'
      }
      action={
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {noConfirmed && previewCount > 0 ? (
            <AuroraMaxControl tone="primary" onClick={onShowPreview}>
              Show preview candidates ({previewCount})
            </AuroraMaxControl>
          ) : null}
          <AuroraMaxControl onClick={onRetry}>Refresh</AuroraMaxControl>
        </div>
      }
    />
  );
}
