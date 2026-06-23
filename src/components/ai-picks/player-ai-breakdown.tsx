/**
 * Player AI Breakdown — full player analysis page.
 * Shows matchup, scores, recent form, previous games, pitcher danger, AI reasoning.
 * Fetches from /mlb/ai-picks/player/:playerId via mlbApi.playerAIBreakdown().
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mlbApi, type AIPickData } from "@/services/mlb";
import { ChevronLeft, Zap, Layers, Shield, Share2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { LoadingCard, ErrorCard, DebugNote } from "@/components/ui-states";

export function PlayerAIBreakdown({ pick, onBack, onAddToParlay, onVouchTail }: {
  pick: AIPickData;
  onBack: () => void;
  onAddToParlay?: () => void;
  onVouchTail?: () => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    matchup: true, scores: true, form: true, games: true, box: false, pitcher: true, reasoning: true, parlay: true,
  });

  const { data: breakdownData, isLoading, isError } = useQuery({
    queryKey: ["ai-picks", "player", pick.playerId],
    queryFn: () => mlbApi.playerAIBreakdown(pick.playerId),
    retry: 1,
    staleTime: 60_000,
  });

  const toggle = (key: string) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const handleShareX = () => {
    const caption = `Today's VouchEdge AI HR read:\n\n${pick.playerName} ${pick.confidenceLabel}\nAI Confidence: ${pick.scores.hrConfidenceScore}%\nValue Score: ${pick.scores.valueScore}\nMatchup: ${pick.team} vs ${pick.opponent}\n\nPosted before first pitch. Graded after final.\n\nProbability-based. No guarantees.\n#VouchEdge #MLBPicks #ProofOverHype`;
    navigator.clipboard.writeText(caption);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`, "_blank");
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <LoadingCard key={i} lines={4} />)}</div>;
  if (isError || !breakdownData?.data) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "var(--ve-accent)" }}>
          <ChevronLeft className="w-4 h-4" /> Back to Today's AI Picks
        </button>
        <ErrorCard message="Player breakdown endpoint not available. The backend may not have /mlb/ai-picks/player/:playerId yet." />
        <FallbackBreakdown pick={pick} onAddToParlay={onAddToParlay} onVouchTail={onVouchTail} onShareX={handleShareX} />
      </div>
    );
  }

  const d = breakdownData.data;
  const scores = d.scores || pick.scores;
  const matchup = d.todayMatchup || {};
  const reasoning = d.aiReasoning || {};
  const missing = d.missingData || [];
  const recentGames = d.recentGames || [];
  const prevVsOpp = d.previousGamesVsOpponent || [];
  const pitcherReport = d.pitcherDangerReport || null;
  const confColor = scores.hrConfidenceScore >= 80 ? "var(--ve-success)" : scores.hrConfidenceScore >= 65 ? "var(--ve-accent)" : "var(--ve-warning)";

  return (
    <div className="space-y-4 pb-6">
      <button onClick={onBack} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "var(--ve-accent)" }}>
        <ChevronLeft className="w-4 h-4" /> Back to Today's AI Picks
      </button>

      {/* Player Hero */}
      <div className="ve-card p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: "var(--ve-badge-bg)", border: "1px solid var(--ve-card-border)", color: "var(--ve-accent)" }}>
            {pick.playerName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">{pick.playerName}</h2>
            <p className="text-xs" style={{ color: "var(--ve-text-muted)" }}>{pick.team} - vs {pick.opponent}</p>
            <p className="text-[11px]" style={{ color: "var(--ve-text-dim)" }}>{pick.opposingPitcher}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          <MiniStat label="HR CONF" value={scores.hrConfidenceScore} color={confColor} />
          <MiniStat label="TRUST" value={scores.trustScore} color="var(--ve-accent)" />
          <MiniStat label="VALUE" value={scores.valueScore} color="var(--ve-purple)" />
          <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
            <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>RISK</div>
            <div className="text-sm font-bold" style={{ color: "var(--ve-warning)" }}>{pick.riskTier}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {onAddToParlay && <button onClick={onAddToParlay} className="flex-1 ve-button text-xs"><Layers className="w-3.5 h-3.5 inline mr-1" /> Add to Parlay</button>}
          {onVouchTail && <button onClick={onVouchTail} className="flex-1 ve-button-ghost text-xs"><Shield className="w-3.5 h-3.5 inline mr-1" /> Vouch/Tail</button>}
          <button onClick={handleShareX} className="ve-button-ghost text-xs px-3"><Share2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {missing.length > 0 && <DebugNote message={`Missing data: ${missing.join(", ")}`} />}

      {/* Matchup Summary */}
      <Collapsible title="Today's Matchup" open={openSections.matchup} onToggle={() => toggle("matchup")}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <InfoRow label="Opposing Pitcher" value={matchup.opposingPitcher || pick.opposingPitcher} />
          <InfoRow label="Pitcher Hand" value={matchup.pitcherHand || "N/A"} />
          <InfoRow label="Pitcher ERA" value={matchup.pitcherERA || "N/A"} />
          <InfoRow label="Pitcher WHIP" value={matchup.pitcherWHIP || "N/A"} />
          <InfoRow label="HR Allowed" value={matchup.pitcherHRAllowed?.toString() || "N/A"} />
          <InfoRow label="Park Factor" value={matchup.parkFactor?.toString() || "N/A"} />
        </div>
      </Collapsible>

      {/* AI Reasoning */}
      <Collapsible title="AI Reasoning" open={openSections.reasoning} onToggle={() => toggle("reasoning")}>
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <div className="text-[10px] font-bold uppercase mb-1" style={{ color: "var(--ve-success)" }}>Why AI Likes It</div>
            <p style={{ color: "var(--ve-text-muted)" }}>{reasoning.whyAILikesIt || pick.aiReasoning}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <div className="text-[10px] font-bold uppercase mb-1" style={{ color: "var(--ve-danger)" }}>Why It May Fail</div>
            <p style={{ color: "var(--ve-text-muted)" }}>{reasoning.whyItMayFail || "Volatility and matchup variance may impact outcome."}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>Best Use:</span>
            <span style={{ color: "var(--ve-text)" }}>{reasoning.bestUse || "Standalone watch or balanced parlay"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>Data Quality:</span>
            <span style={{ color: "var(--ve-text)" }}>{reasoning.dataQualityScore || 70}/100</span>
          </div>
        </div>
      </Collapsible>

      {/* Recent Form */}
      <Collapsible title="Recent Batter Form" open={openSections.form} onToggle={() => toggle("form")}>
        {recentGames.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {[{ label: "Last 3", games: recentGames.slice(0, 3) }, { label: "Last 5", games: recentGames.slice(0, 5) }, { label: "Last 10", games: recentGames.slice(0, 10) }].map(s => {
              const hrs = s.games.reduce((sum: number, g: any) => sum + (g.hr || 0), 0);
              const hits = s.games.reduce((sum: number, g: any) => sum + (g.h || 0), 0);
              return (
                <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
                  <div className="text-[10px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>{s.label}</div>
                  <div className="text-lg font-bold font-mono" style={{ color: "var(--ve-accent)" }}>{hits}H</div>
                  <div className="text-xs" style={{ color: "var(--ve-text-muted)" }}>{hrs} HR</div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-xs" style={{ color: "var(--ve-text-dim)" }}>No recent game data available.</p>}
      </Collapsible>

      {/* Box Score Evidence */}
      <Collapsible title="Batting Box Score Evidence" open={openSections.box} onToggle={() => toggle("box")}>
        {recentGames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: "var(--ve-text-dim)" }}>
                <th className="py-1.5 px-2 text-left">Date</th><th className="py-1.5 px-2 text-left">Opp</th>
                <th className="py-1.5 px-2">AB</th><th className="py-1.5 px-2">H</th><th className="py-1.5 px-2">HR</th>
                <th className="py-1.5 px-2">RBI</th><th className="py-1.5 px-2">TB</th>
              </tr></thead>
              <tbody>
                {recentGames.map((g: any, i: number) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--ve-card-border)", color: "var(--ve-text-muted)" }}>
                    <td className="py-1.5 px-2">{g.date?.split("T")[0]?.slice(5) || g.date || "—"}</td>
                    <td className="py-1.5 px-2">{g.opponent || "—"}</td>
                    <td className="py-1.5 px-2 text-center">{g.ab || 4}</td>
                    <td className="py-1.5 px-2 text-center" style={{ color: "var(--ve-accent)" }}>{g.h || 0}</td>
                    <td className="py-1.5 px-2 text-center" style={{ color: "var(--ve-danger)" }}>{g.hr || 0}</td>
                    <td className="py-1.5 px-2 text-center">{g.rbi || 0}</td>
                    <td className="py-1.5 px-2 text-center" style={{ color: "var(--ve-purple)" }}>{g.tb || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-xs" style={{ color: "var(--ve-text-dim)" }}>No box score data available.</p>}
      </Collapsible>

      {/* Pitcher Danger Report */}
      <Collapsible title="Pitcher Danger Report" open={openSections.pitcher} onToggle={() => toggle("pitcher")}>
        {pitcherReport ? (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <InfoRow label="HR Risk" value={`${pitcherReport.hrRisk}/100`} />
              <InfoRow label="Danger Rating" value={pitcherReport.dangerRating} />
              <InfoRow label="Fly Ball Risk" value={pitcherReport.flyBallRisk} />
              <InfoRow label="Hard Contact" value={pitcherReport.hardContactRisk} />
            </div>
            <div className="flex items-start gap-1.5" style={{ color: "var(--ve-warning)" }}>
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /><span>{pitcherReport.matchupWarning}</span>
            </div>
          </div>
        ) : <p className="text-xs" style={{ color: "var(--ve-text-dim)" }}>Pitcher danger report unavailable.</p>}
      </Collapsible>

      {/* Parlay Fit */}
      <Collapsible title="Parlay Fit" open={openSections.parlay} onToggle={() => toggle("parlay")}>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span style={{ color: "var(--ve-text-muted)" }}>Fit Type</span><span className="font-semibold">{pick.riskTier === "LOW" ? "Safe leg" : pick.riskTier === "MEDIUM" ? "Balanced" : "Aggressive"}</span></div>
          <div className="flex justify-between"><span style={{ color: "var(--ve-text-muted)" }}>Weakest Risk</span><span style={{ color: "var(--ve-warning)" }}>{pick.scores.volatilityScore > 60 ? "High volatility" : "Moderate variance"}</span></div>
          {onAddToParlay && <button onClick={onAddToParlay} className="ve-button w-full text-xs mt-2"><Layers className="w-3.5 h-3.5 inline mr-1" /> Add to Parlay</button>}
        </div>
      </Collapsible>
    </div>
  );
}

function FallbackBreakdown({ pick, onAddToParlay, onVouchTail, onShareX }: any) {
  return (
    <div className="ve-card p-5">
      <h3 className="text-sm font-bold mb-3">{pick.playerName} - Quick View</h3>
      <p className="text-xs mb-3" style={{ color: "var(--ve-text-muted)" }}>{pick.aiReasoning}</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
          <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>HR CONF</div>
          <div className="text-sm font-bold font-mono" style={{ color: "var(--ve-accent)" }}>{pick.scores.hrConfidenceScore}</div>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
          <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>TRUST</div>
          <div className="text-sm font-bold font-mono" style={{ color: "var(--ve-accent)" }}>{pick.scores.trustScore}</div>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
          <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>VALUE</div>
          <div className="text-sm font-bold font-mono" style={{ color: "var(--ve-purple)" }}>{pick.scores.valueScore}</div>
        </div>
      </div>
      <div className="flex gap-2">
        {onAddToParlay && <button onClick={onAddToParlay} className="flex-1 ve-button text-xs"><Layers className="w-3.5 h-3.5 inline mr-1" /> Add to Parlay</button>}
        {onVouchTail && <button onClick={onVouchTail} className="flex-1 ve-button-ghost text-xs"><Shield className="w-3.5 h-3.5 inline mr-1" /> Vouch/Tail</button>}
        <button onClick={onShareX} className="ve-button-ghost text-xs px-3"><Share2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function Collapsible({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="ve-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-black/20 transition-colors">
        <span className="text-sm font-bold">{title}</span>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--ve-text-dim)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--ve-text-dim)" }} />}
      </button>
      {open && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
      <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>{label}</div>
      <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded" style={{ background: "rgba(5,11,24,0.3)" }}>
      <span style={{ color: "var(--ve-text-dim)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--ve-text-muted)" }}>{value}</span>
    </div>
  );
}
