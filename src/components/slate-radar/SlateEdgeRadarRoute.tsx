import { useMemo } from 'react';
import { useDailyHrBoard } from '../../features/hr/hooks/useDailyHrBoard';
import { buildBoard } from '../../features/hr/utils/normalizeHrWatch';
import { todayISO } from '../../hooks/queries/hrBoardQuery';
import { useDailyReport } from '../../hooks/queries/useDailyReport';
import { useMarketRadar } from '../../hooks/queries/useMarketRadar';
import { VouchEdgeHttpError } from '../../api/vouchedgeApi';
import SlateEdgeRadarPage from './SlateEdgeRadar';
import { buildSlateRadar } from './slateRadarModel';

export default function SlateEdgeRadarRoute({
  onSectionChange,
}: {
  onSectionChange: (section: string) => void;
}) {
  const dailyReportQuery = useDailyReport();
  const hrBoardQuery = useDailyHrBoard(todayISO());
  const marketRadarQuery = useMarketRadar(todayISO());
  const report = dailyReportQuery.data ?? null;
  const hrBoard = useMemo(
    () => (hrBoardQuery.data ? buildBoard(hrBoardQuery.data) : null),
    [hrBoardQuery.data],
  );
  const hrRows = useMemo(() => {
    if (!hrBoard) return [];
    if (hrBoard.confirmed.length > 0) return hrBoard.confirmed;
    if (hrBoard.curated.length > 0) return hrBoard.curated;
    return hrBoard.all;
  }, [hrBoard]);

  const summary = useMemo(
    () => buildSlateRadar({
      report,
      hrRows,
      loading: dailyReportQuery.isLoading || hrBoardQuery.loading,
      hasError: dailyReportQuery.isError || Boolean(hrBoardQuery.error) || report?.dataQuality === 'limited',
      marketRadar: marketRadarQuery.data ?? null,
      marketRadarLoading: marketRadarQuery.isLoading,
      marketRadarError: marketRadarQuery.error instanceof VouchEdgeHttpError
        ? `${marketRadarQuery.error.status} ${marketRadarQuery.error.code}${marketRadarQuery.error.requestId ? ` · request ${marketRadarQuery.error.requestId}` : ''}`
        : marketRadarQuery.error instanceof Error ? marketRadarQuery.error.message : null,
    }),
    [dailyReportQuery.isError, dailyReportQuery.isLoading, hrBoardQuery.error, hrBoardQuery.loading, hrRows, marketRadarQuery.data, marketRadarQuery.error, marketRadarQuery.isLoading, report],
  );

  return (
    <SlateEdgeRadarPage
      summary={summary}
      onSectionChange={onSectionChange}
      onBack={() => onSectionChange('today')}
    />
  );
}
