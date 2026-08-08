import React from "react";
import { X } from "lucide-react";

import {
  PlayerIdentityHeader,
  ConfidenceSummary,
  StickyResearchAction,
} from "../../../../components/player-intelligence";
import { oddsDisplay } from "../../engine/signalScore";

interface NavItem {
  id: string;
  label: string;
}

interface Tier {
  label: string;
  color: string;
  rgb: string;
}

interface Props {
  player: any;
  showImg: boolean;
  hue: number;
  teamLogo: string | null;
  oppLogo: string | null;
  tier: Tier;
  compositeScore: number;
  decision: any;
  activeSection: string;
  setActiveSection: (id: string) => void;
  NAV: NavItem[];
  onClose: () => void;
  onAddToSlip: (player: any) => void;
  fmtScore: (v: number | null | undefined) => string;
  fmtOdds: (v: number | null | undefined) => string;
}

export default function ProfileSidebar({
  player,
  showImg,
  hue,
  teamLogo,
  oppLogo,
  tier,
  compositeScore,
  decision,
  activeSection,
  setActiveSection,
  NAV,
  onClose,
  onAddToSlip,
  fmtScore,
  fmtOdds,
}: Props) {
  return (
    <aside className="ve-hr-profile-sidebar ve-player-intelligence-rail relative flex-shrink-0 overflow-hidden border-b border-white/10 lg:flex lg:w-72 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-80">
      <button
        onClick={onClose}
        aria-label="Close"
        className="aurora-pressable absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 lg:h-9 lg:w-9"
        style={{
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-5 lg:pt-8">
        <PlayerIdentityHeader
          name={player.playerName}
          avatarUrl={showImg ? player.headshotUrl : null}
          teamHue={hue}
          team={player.team}
          teamLogoUrl={teamLogo}
          opponent={player.opponent}
          opponentLogoUrl={oppLogo}
          subtitle={player.pitcherName ? `vs ${player.pitcherName}` : null}
          meta={
            player.venue
              ? `🏟️ ${player.venue}${player.gameTime ? ` · ${player.gameTime}` : ""}`
              : null
          }
          tierLabel={tier.label}
          tierColor={tier.color}
          chips={[
            ...(oddsDisplay(player)
              ? [{ label: oddsDisplay(player) as string, tone: "neutral" as const }]
              : []),
            ...(player.bookOdds != null
              ? [{ label: fmtOdds(player.bookOdds), tone: "caution" as const }]
              : []),
          ]}
        />
      </div>

      <div className="hidden px-5 lg:block">
        <ConfidenceSummary
          score={compositeScore}
          label="Weighted composite"
          color={tier.color}
          stats={[
            { label: "Power", value: fmtScore(player.hitterPower) },
            { label: "Pitcher", value: fmtScore(player.pitcherVulnerability) },
            { label: "Form", value: fmtScore(player.recentForm) },
          ]}
        />
      </div>

      <nav className="mt-auto hidden px-3 pb-3 pt-4 lg:block">
        <div className="flex flex-col gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveSection(n.id)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all"
              style={{
                background:
                  activeSection === n.id
                    ? `rgba(${tier.rgb},0.12)`
                    : "transparent",
                color:
                  activeSection === n.id
                    ? tier.color
                    : "rgba(255,255,255,0.4)",
                borderLeft:
                  activeSection === n.id
                    ? `3px solid ${tier.color}`
                    : "3px solid transparent",
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="hidden px-4 pb-5 lg:block">
        <StickyResearchAction
          eyebrow="Home run market"
          label="Choose HR prop"
          disabled={!decision.canAddToSlip}
          disabledReason={decision.addToSlipBlockReason}
          onClick={() => onAddToSlip(player)}
          trustLine={`${decision.lineupLabel} · ${decision.freshnessLabel}`}
        />
      </div>
    </aside>
  );
}
