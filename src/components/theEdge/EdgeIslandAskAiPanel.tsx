import { useEffect, useState } from "react";
import { BrainCircuit, Sparkles } from "lucide-react";
import type { CreatorProofProfile, Parlay } from "../../types";
import { useVouchAiChat } from "../../hooks/useVouchAiChat";
import VouchAiChatSurface from "../vouchAi/VouchAiChatSurface";

type Props = {
  profile?: CreatorProofProfile;
  savedSlips?: Parlay[];
  activeLegs?: unknown[];
  onSectionChange?: (section: string) => void;
  onClose?: () => void;
};

const GUEST_PROFILE: CreatorProofProfile = {
  displayName: "there",
  username: "guest",
  handle: "guest",
  avatarUrl: "",
  bio: "",
  verified: false,
  winRate: 0,
  totalPicks: 0,
  wonPicks: 0,
  unitsTracked: 0,
  unitsNetProfit: 0,
  subscriptionTier: "BASIC",
};

export default function EdgeIslandAskAiPanel({
  profile = GUEST_PROFILE,
  savedSlips = [],
  activeLegs = [],
  onSectionChange,
  onClose,
}: Props) {
  const [edgeContextPrompt, setEdgeContextPrompt] = useState("");

  const navigate = (section: string) => {
    onSectionChange?.(section);
    onClose?.();
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ prompt?: string }>;

      if (custom.detail?.prompt) {
        setEdgeContextPrompt(custom.detail.prompt);
      }
    };

    window.addEventListener("vouch-ai-context", handler);

    return () => {
      window.removeEventListener("vouch-ai-context", handler);
    };
  }, []);

  const chat = useVouchAiChat({
    profile,
    savedSlips,
    activeLegs,
    onSectionChange: navigate,
  });

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="glass-panel glass-border mb-4 flex shrink-0 items-center gap-3 rounded-2xl p-3.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-black text-white">VouchEdge AI Agent</h2>
            <Sparkles className="h-3.5 w-3.5 text-vouch-cyan" />
          </div>
          <p className="text-[10px] text-white/40">⚡ FEATURE &amp; PARLAY COMPANION</p>
        </div>
      </div>

      <div className="w-full">
        <VouchAiChatSurface
          variant="island"
          profile={profile}
          onSectionChange={navigate}
          chat={chat}
          initialPrompt={edgeContextPrompt}
        />
      </div>
    </div>
  );
}
