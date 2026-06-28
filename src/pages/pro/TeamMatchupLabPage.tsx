import {
  ProGraphShell,
  ProLockedCard,
  ProPageHeader,
  VerifiedDataNotice,
} from '../../components/pro';

export default function TeamMatchupLabPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-5">
        <ProPageHeader
          title="Team Matchup Lab"
          subtitle="Team-vs-team research for runs, hits, HR pressure, strikeouts, pitcher risk, and matchup history."
          badge="Team Pro"
        />

        <VerifiedDataNotice />

        <div className="grid gap-4 lg:grid-cols-3">
          <ProLockedCard
            title="Team Pressure"
            description="Compares run pressure, hit pressure, and HR danger when verified trend data is connected."
          />
          <ProLockedCard
            title="Match History"
            description="Past games between these teams, including runs, hits, HRs, and strikeouts."
          />
          <ProLockedCard
            title="Pitcher + Bullpen Risk"
            description="Starting pitcher and bullpen vulnerability research. Verified data required."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ProGraphShell
            title="Runs + Hits Trend"
            description="Team recent runs and hits trend graph. No fake graph data shown."
          />
          <ProGraphShell
            title="Strikeout + HR Trend"
            description="Team strikeout and HR trend graph when verified data feed is connected."
          />
        </div>
      </div>
    </main>
  );
}
