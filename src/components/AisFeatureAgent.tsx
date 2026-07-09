import React, { useState } from "react";
import { BrainCircuit, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "../lib/motion";
import { CreatorProofProfile, Parlay } from "../types";
import { useVouchAiChat } from "../hooks/useVouchAiChat";
import VouchAiChatSurface from "./vouchAi/VouchAiChatSurface";

interface AisFeatureAgentProps {
  profile: CreatorProofProfile;
  savedSlips?: Parlay[];
  activeLegs?: unknown[];
  activeThemeId?: string;
  onSectionChange: (section: string) => void;
}

export default function AisFeatureAgent({
  profile,
  savedSlips = [],
  activeLegs = [],
  activeThemeId = "default",
  onSectionChange,
}: AisFeatureAgentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const chat = useVouchAiChat({
    profile,
    savedSlips,
    activeLegs,
    onSectionChange,
    listenForOpenEvent: true,
    onExternalOpen: () => setIsOpen(true),
  });

  return (
    <div className="fixed bottom-6 left-6 md:left-8 z-50 font-sans" id="ai-feature-agent-root">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 relative group"
          id="open-agent-chatbot-btn"
        >
          <BrainCircuit className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400" />
          </span>
          <div className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none pointer-events-none shadow-xl">
            🤖 Ask VouchEdge AI Agent
          </div>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            transition={{ duration: 0.25 }}
            className={`w-[360px] md:w-[420px] h-[550px] rounded-3xl border shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden bg-slate-950/95 backdrop-blur-xl ${
              activeThemeId === "music_beat_lines"
                ? "border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.15)]"
                : "border-slate-800/80 shadow-slate-950/50"
            }`}
            id="agent-chat-drawer-container"
          >
            <div className="bg-gradient-to-r from-sky-950/70 via-indigo-950/70 to-purple-950/70 border-b border-white/5 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white border border-sky-400/20">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    VouchEdge AI Agent
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">⚡ FEATURE & PARLAY COMPANION</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                id="close-agent-drawer-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0 p-3 border-t border-white/5 bg-slate-900/50">
              <VouchAiChatSurface variant="agent" profile={profile} onSectionChange={onSectionChange} chat={chat} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
