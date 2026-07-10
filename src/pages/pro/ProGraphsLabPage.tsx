import { useMemo } from 'react';
import {
  HrSignalGraphs,
  ProGraphShell,
  ProLockedCard,
  ProPageHeader,
  VerifiedDataNotice,
  VerifiedGraphEmptyState,
} from '../../components/pro';
import { buildPlayerPayload, useHrBoardProData } from './proLabData';

export default function ProGraphsLabPage() {
  const { topRow, loading, error, source } = useHrBoardProData();
  const playerPayload = useMemo(() => buildPlayerPayload(topRow), [topRow]);

  return (
    <main className="ve-page-shell min-h-screen px-3 py-4 text-[hsl(var(--ve-text-primary))] sm:px-4 lg:py-5">
      <div className="mx-auto max-w-7xl space-y-4">
        <ProPageHeader
          title="Pro Graphs Lab"
          subtitle="A visual analytics lab for players, teams, pitchers, HR pressure, run pressure, and trend signals."
          badge="Graph Pro"
        />

        <VerifiedDataNotice
          variant={source === 'network' ? 'coming-soon' : 'feed-required'}
          title={loading ? 'Loading verified HR board feed' : source === 'network' ? 'Verified HR graph feed' : 'Verified data feed required'}
          detail={error ? `${error}. No fake graph data shown.` : 'Graphs below use only fields returned by the production HR Board endpoint.'}
        />

        {playerPayload ? (
          <HrSignalGraphs payload={playerPayload} />
        ) : (
          <VerifiedGraphEmptyState
            variant="feed-required"
            title="Verified HR graph data required"
            detail="The Pro Graphs Lab needs a verified HR board row before rendering HrSignalGraphs."
          />
        )}

        <div className="grid gap-3 lg:grid-cols-3">
          <ProLockedCard
            title="Player Trend Graphs"
            description="Player-level HR, hits, RBI, runs, and power trend graphs require verified feeds."
          />
          <ProLockedCard
            title="Team Trend Graphs"
            description="Team run creation, hits, HRs, and strikeout trend graphs require verified feeds."
            onUpgrade={() => window.dispatchEvent(
              new CustomEvent("vouch:navigate", {
                detail: { section: "premium" },
              })
            )}
          />
          <ProLockedCard
            title="Pitcher Vulnerability Graphs"
            description="Pitcher HR weakness, contact risk, and strikeout volatility require verified feeds."
            onUpgrade={() => window.dispatchEvent(
              new CustomEvent("vouch:navigate", {
                detail: { section: "premium" },
              })
            )}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ProGraphShell
            title="Player Signal Comparison"
            description="Uses HrSignalGraphs when a verified HR board row is available."
          />
          <ProGraphShell
            title="Team Game Pressure"
            description="Run, hit, HR, and strikeout signal graphs remain locked until verified feeds exist."
          />
        </div>
      </div>
    </main>
  );
}
