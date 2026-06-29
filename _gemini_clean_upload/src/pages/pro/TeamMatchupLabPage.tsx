import { Activity, BarChart3, Clock, Shield } from 'lucide-react';
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

        <VerifiedDataNotice variant="feed-required" />

        <div className="grid gap-4 lg:grid-cols-3">
          <ProLockedCard
            icon={Activity}
            accent="#34d399"
            title="Team Pressure"
            description="Compares run pressure, hit pressure, and HR danger when verified trend data is connected."
          />
          <ProLockedCard
            icon={Clock}
            accent="#38bdf8"
            title="Match History"
            description="Past games between these teams, including runs, hits, HRs, and strikeouts."
          />
          <ProLockedCard
            icon={Shield}
            accent="#fbbf24"
            title="Pitcher + Bullpen Risk"
            description="Starting pitcher and bullpen vulnerability research. Verified data required."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ProGraphShell
            icon={Activity}
            accent="#34d399"
            title="Runs + Hits Trend"
            description="Team recent runs and hits trend graph. No fake graph data shown."
          />
          <ProGraphShell
            icon={BarChart3}
            accent="#f97316"
            title="Strikeout + HR Trend"
            description="Team strikeout and HR trend graph when verified data feed is connected."
          />
        </div>
      </div>
    </main>
  );
}
