import {
  Activity,
  Brain,
  ChartNoAxesCombined,
  Flame,
  Terminal,
  Trophy,
} from "lucide-react";

import {
  ProPageHeader,
  ProSignalBar,
} from "../../components/pro";

import { Z8_PANEL } from "../../theme/z8Tokens";
import { useSmartAiCandidates } from "../../components/smart-ai/useSmartAiCandidates";

export default function ProCommandCenterPage() {
  const {
    realCandidates,
    candidatesLoading,
  } = useSmartAiCandidates();

  const topEdges = [...realCandidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <ProPageHeader
        icon={Brain}
        title="VouchEdge Pro Command Center"
        subtitle="AI-powered baseball intelligence. Player edges, AI Judges, matchup analysis, and premium research tools."
        badge="PRO INTELLIGENCE"
        kpiTiles={[
          {
            icon: Flame,
            label: "Top Edge",
            value: "94",
          },
          {
            icon: Brain,
            label: "AI Judges",
            value: "4/4",
          },
          {
            icon: Trophy,
            label: "Elite Picks",
            value: "12",
          },
          {
            icon: Activity,
            label: "Live Models",
            value: "Active",
          },
        ]}
      />

      <ProSignalBar />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${Z8_PANEL} ve-premium-panel rounded-3xl p-5 backdrop-blur-xl shadow-xl shadow-black/20`}>
          <div className="flex items-center gap-2 text-white">
            <Flame className="h-5 w-5 text-vouch-cyan" />
            <h2 className="font-black uppercase">
              Today's Top Edges
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            {candidatesLoading ? (
              <p className="text-sm text-white/50">
                Loading today's intelligence...
              </p>
            ) : (
              topEdges.map((player) => (
                <EdgeRow
                  key={player.playerName}
                  player={player.playerName}
                  score={String(player.score)}
                />
              ))
            )}
          </div>
        </section>

        <section className={`${Z8_PANEL} ve-premium-panel rounded-3xl p-5 backdrop-blur-xl shadow-xl shadow-black/20`}>
          <div className="flex items-center gap-2 text-white">
            <Brain className="h-5 w-5 text-vouch-cyan" />
            <h2 className="font-black uppercase">
              AI Judge Consensus
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-sm text-white/70">
            <p>🔥 Power Hunter — Bullish</p>
            <p>📊 Data Scout — Strong</p>
            <p>📈 Momentum Reader — Elite</p>
            <p>🛡 Risk Auditor — Safe</p>
          </div>
        </section>

        <section className={`${Z8_PANEL} ve-premium-panel rounded-3xl p-5 backdrop-blur-xl shadow-xl shadow-black/20`}>
          <div className="flex items-center gap-2 text-white">
            <Terminal className="h-5 w-5 text-vouch-cyan" />
            <h2 className="font-black uppercase">
              Terminal Access
            </h2>
          </div>

          <p className="mt-4 text-sm text-white/60">
            Live MLB intelligence, research tools, and advanced analytics.
          </p>
        </section>
      </div>

      <section className={`${Z8_PANEL} ve-premium-panel rounded-3xl p-5 backdrop-blur-xl shadow-xl shadow-black/20`}>
        <div className="flex items-center gap-2 text-white">
          <ChartNoAxesCombined className="h-5 w-5 text-vouch-cyan" />
          <h2 className="font-black uppercase">
            Pro Labs
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <LabCard title="Player Edge Lab" />
          <LabCard title="Team Matchup Lab" />
          <LabCard title="Pro Graphs Lab" />
        </div>
      </section>
    </div>
  );
}

function EdgeRow({
  player,
  score,
}: {
  player: string;
  score: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="font-black text-white">
          🔥 {player}
        </span>

        <span className="font-black text-vouch-cyan">
          VE {score}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-black/20 p-2">
          <span className="text-white/50">
            HR Edge
          </span>
          <p className="font-bold text-white">
            Elite
          </p>
        </div>

        <div className="rounded-lg bg-black/20 p-2">
          <span className="text-white/50">
            Confidence
          </span>
          <p className="font-bold text-white">
            High
          </p>
        </div>
      </div>

      <div className="mt-3 text-xs text-white/60">
        ✓ Pitcher vulnerability<br />
        ✓ Park advantage<br />
        ✓ Recent power trend
      </div>
    </div>
  );
}

function LabCard({
  title,
}: {
  title: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="font-bold text-white">
        {title}
      </p>

      <p className="mt-2 text-xs text-white/50">
        Open premium intelligence module →
      </p>
    </div>
  );
}
