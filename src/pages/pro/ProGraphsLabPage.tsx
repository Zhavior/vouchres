import {
  ProGraphShell,
  ProLockedCard,
  ProPageHeader,
  VerifiedDataNotice,
} from '../../components/pro';

export default function ProGraphsLabPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-5">
        <ProPageHeader
          title="Pro Graphs Lab"
          subtitle="A visual analytics lab for players, teams, pitchers, HR pressure, run pressure, and trend signals."
          badge="Graph Pro"
        />

        <VerifiedDataNotice />

        <div className="grid gap-4 lg:grid-cols-3">
          <ProLockedCard
            title="Player Trend Graphs"
            description="Player-level HR, hits, RBI, runs, and power trend graphs."
          />
          <ProLockedCard
            title="Team Trend Graphs"
            description="Team run creation, hits, HRs, and strikeout trend graphs."
          />
          <ProLockedCard
            title="Pitcher Vulnerability Graphs"
            description="Pitcher HR weakness, contact risk, and strikeout volatility."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ProGraphShell
            title="Player Signal Comparison"
            description="Compare hitter power, recent form, park factor, and pitcher weakness."
          />
          <ProGraphShell
            title="Team Game Pressure"
            description="Compare team pressure across run, hit, HR, and strikeout signals."
          />
        </div>
      </div>
    </main>
  );
}
