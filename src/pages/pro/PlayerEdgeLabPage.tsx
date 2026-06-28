import {
  ProGraphShell,
  ProLockedCard,
  ProPageHeader,
  VerifiedDataNotice,
} from '../../components/pro';

export default function PlayerEdgeLabPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-5">
        <ProPageHeader
          title="Player Edge Lab"
          subtitle="Deep player research for HR form, matchup context, hitter power, pitcher vulnerability, and Pro trend views."
          badge="Player Pro"
        />

        <VerifiedDataNotice />

        <div className="grid gap-4 lg:grid-cols-3">
          <ProLockedCard
            title="Player Snapshot"
            description="Verified player profile, current matchup, team context, and confidence status."
          />
          <ProLockedCard
            title="Batter vs Pitcher"
            description="Head-to-head history unlocks when verified matchup data is connected."
          />
          <ProLockedCard
            title="Vs Team Trends"
            description="Hits, RBIs, runs, HRs, and extra-base trends against today’s opponent."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ProGraphShell
            title="Recent Power Trend"
            description="Last 7, 15, and 30 game power trend graph. Verified data required."
          />
          <ProGraphShell
            title="Matchup Signal Graph"
            description="Hitter power, pitcher weakness, park factor, recent form, and confidence over time."
          />
        </div>
      </div>
    </main>
  );
}
