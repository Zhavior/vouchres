import { useEffect, useState } from "react";
import { ProductEvents } from "../../lib/productEvents";
import { useEntitlements } from "../../features/hr/hooks/useEntitlements";
import {
  ArrowRight,
  BrainCircuit,
  Cpu,
  FileText,
  Flame,
  Mail,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sliders,
} from "lucide-react";
import { motion } from "../../lib/motion";
import type { CreatorProofProfile } from "../../types";
import type { useVouchAiChat } from "../../hooks/useVouchAiChat";

type ChatState = ReturnType<typeof useVouchAiChat>;

type Props = {
  variant: "island" | "agent";
  profile: CreatorProofProfile;
  onSectionChange: (section: string) => void;
  chat: ChatState;
};

const ISLAND_PAGE_SHORTCUTS = [
  { label: "V.A.I Smart Picks", section: "ai_engine", icon: Cpu },
  { label: "HR Board", section: "hr_board", icon: Flame },
  { label: "Parlay Lab", section: "build", icon: Shield },
] as const;

export default function VouchAiChatSurface({
  variant,
  profile,
  onSectionChange,
  chat,
  initialPrompt,
}: Props) {
  const { isPro } = useEntitlements();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    emailSubject,
    setEmailSubject,
    emailBody,
    setEmailBody,
    isSendingEmail,
    scrollRef,
    handleExplainFeature,
    handleAnalyzeParlay,
    handleSendMessage,
    submitEmailSimulation,
    openEmailForm,
  } = chat;

  useEffect(() => {
    if (initialPrompt && !inputValue) {
      setInputValue(initialPrompt);
    }
  }, [initialPrompt, inputValue, setInputValue]);

  const isIsland = variant === "island";

  const userBubble = isIsland
    ? "ml-auto border border-vouch-cyan/25 bg-vouch-cyan/10 text-white"
    : "bg-sky-600 text-white rounded-tr-none shadow shadow-sky-600/20";

  const agentBubble = isIsland
    ? "mr-auto glass-panel glass-border text-white/80"
    : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-md";

  const pageJumpBtn =
    "glass-panel glass-border inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold text-vouch-cyan transition hover:border-vouch-cyan/40 shrink-0";

  const quickBtn = isIsland
    ? "glass-panel glass-border inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold text-vouch-cyan transition hover:border-vouch-cyan/40 shrink-0 uppercase"
    : "px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-sky-400 border border-slate-800 hover:border-sky-900 rounded-full shrink-0 flex items-center gap-1 uppercase transition-all text-[9px] font-bold";

  const featureBtn = isIsland
    ? "p-2 glass-panel glass-border rounded-xl text-left transition-colors flex items-center gap-2 group hover:border-vouch-cyan/40"
    : "p-2 bg-slate-950 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/30 rounded-xl text-left transition-colors flex items-center gap-2 group";

  const inputClass = isIsland
    ? "glass-panel glass-border min-w-0 flex-1 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-vouch-cyan/40 focus:outline-none"
    : "flex-1 bg-slate-950 text-white rounded-xl border border-slate-800 px-3.5 py-2.5 outline-none focus:border-sky-500 font-medium placeholder-slate-500 text-xs";

  const sendBtn = isIsland
    ? "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-vouch-cyan/35 bg-vouch-cyan/15 text-vouch-cyan transition hover:bg-vouch-cyan/25 disabled:opacity-40"
    : "p-2.5 bg-gradient-to-tr from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl active:scale-90 transition-all font-bold cursor-pointer shrink-0";

  return (
    <>
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 space-y-3 overflow-y-auto ${isIsland ? "pr-1" : "p-4 space-y-4 scrollbar-none"}`}
      >
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col max-w-[92%] ${m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
          >
            {!isIsland && (
              <span className="text-[9px] font-bold uppercase font-mono text-slate-500 mb-1">
                {m.sender === "user" ? `@${profile.username}` : "🤖 VouchEdge Core Agent"} • {m.timestamp}
              </span>
            )}

            <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${m.sender === "user" ? userBubble : agentBubble}`}>
              <p className="whitespace-pre-wrap">{m.text}</p>

              {m.type === "feature_list" && (
                <div className={`mt-3.5 grid grid-cols-2 gap-2 pt-2 ${isIsland ? "" : "border-t border-slate-800"}`}>
                  <button type="button" onClick={() => handleExplainFeature("build")} className={featureBtn}>
                    <Sliders className={`w-4 h-4 shrink-0 ${isIsland ? "text-vouch-cyan" : "text-sky-400"}`} />
                    <span className={`text-[10px] font-bold ${isIsland ? "text-white/70 group-hover:text-vouch-cyan" : "text-slate-300 group-hover:text-sky-400"}`}>
                      Explain Parlay Lab
                    </span>
                  </button>
                  <button type="button" onClick={() => handleExplainFeature("ai_engine")} className={featureBtn}>
                    <Cpu className={`w-4 h-4 shrink-0 ${isIsland ? "text-vouch-cyan" : "text-indigo-400"}`} />
                    <span className={`text-[10px] font-bold ${isIsland ? "text-white/70 group-hover:text-vouch-cyan" : "text-slate-300 group-hover:text-indigo-400"}`}>
                      Explain V.A.I Picks
                    </span>
                  </button>
                  <button type="button" onClick={() => handleExplainFeature("research")} className={featureBtn}>
                    <Search className={`w-4 h-4 shrink-0 ${isIsland ? "text-vouch-cyan" : "text-purple-400"}`} />
                    <span className={`text-[10px] font-bold ${isIsland ? "text-white/70 group-hover:text-vouch-cyan" : "text-slate-300 group-hover:text-purple-400"}`}>
                      Explain Research
                    </span>
                  </button>
                  <button type="button" onClick={() => handleExplainFeature("board")} className={featureBtn}>
                    <FileText className={`w-4 h-4 shrink-0 ${isIsland ? "text-vouch-cyan" : "text-pink-400"}`} />
                    <span className={`text-[10px] font-bold ${isIsland ? "text-white/70 group-hover:text-vouch-cyan" : "text-slate-300 group-hover:text-pink-400"}`}>
                      Explain Board
                    </span>
                  </button>
                </div>
              )}

              {m.type === "email_form" && (
                <div className={`mt-3.5 space-y-2.5 pt-3.5 ${isIsland ? "" : "border-t border-slate-800"}`}>
                  <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border ${isIsland ? "glass-panel glass-border" : "bg-slate-950 border-slate-800"}`}>
                    <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">To Address</span>
                    <span className="text-[10px] font-bold text-sky-400 font-mono">{String(m.meta?.target ?? "")}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-500 font-mono">Subject</span>
                    <input
                      type="text"
                      placeholder="Feedback Subject..."
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className={`w-full text-xs text-white border rounded-lg px-2 py-1.5 outline-none font-medium ${isIsland ? "glass-panel glass-border focus:border-vouch-cyan/40" : "bg-slate-950 border-slate-800 focus:border-sky-500"}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-500 font-mono">Message Body</span>
                    <textarea
                      placeholder="Enter your bug reports or layout suggestions..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className={`w-full text-[11px] text-white border rounded-lg p-2 outline-none h-20 resize-none font-medium leading-normal ${isIsland ? "glass-panel glass-border focus:border-vouch-cyan/40" : "bg-slate-950 border-slate-800 focus:border-sky-500"}`}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSendingEmail}
                    onClick={() => submitEmailSimulation(m.meta?.target as "vouchedge@gmail.com" | "zhavior@gmail.com")}
                    className={`w-full py-2 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all ${isIsland ? "border border-vouch-cyan/35 bg-vouch-cyan/15 text-vouch-cyan" : "bg-gradient-to-r from-sky-500 to-indigo-600"}`}
                  >
                    {isSendingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending trace...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Dispatch feedback inbox</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {m.type === "email_receipt" && m.meta && (
                <div className={`mt-3.5 p-3 border rounded-xl space-y-2 font-mono text-[10px] ${isIsland ? "glass-panel glass-border" : "bg-slate-950 border-emerald-950 ring-1 ring-emerald-500/20"}`}>
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 text-emerald-400 font-bold">
                    <span>🎯 LEDGER_DELIVERY</span>
                    <span>SENT</span>
                  </div>
                  <p className="flex justify-between">
                    <span className="text-slate-500">ID:</span>
                    <span className="text-slate-200 font-semibold">{String(m.meta.receiptId)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">To:</span>
                    <span className="text-sky-400 font-semibold">{String(m.meta.target)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Subject:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">{String(m.meta.subject)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Sender:</span>
                    <span className="text-slate-300">@{String(m.meta.user)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-slate-400">{String(m.meta.timestamp)}</span>
                  </p>
                </div>
              )}

              {m.type === "parlay_analysis" && m.meta && (
                <div className={`mt-3.5 p-3 rounded-xl flex items-center justify-between font-mono text-[11px] gap-3 ${isIsland ? "glass-panel glass-border" : "bg-indigo-950/50 border border-indigo-900/60"}`}>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase">Parlay Edge Score</span>
                    <span className="text-base font-black text-indigo-400 block">{String(m.meta.edgeScore)}% SURETY</span>
                  </div>
                  <span className="px-2 py-1 bg-indigo-900/60 border border-indigo-700/40 text-xs font-black text-indigo-300 rounded uppercase">
                    🎰 {String(m.meta.legsCount)} LEGS RUN
                  </span>
                </div>
              )}

              {m.type === "player_search" && (
                <div className="mt-3 leading-normal border-t border-slate-900 pt-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSectionChange("research");
                      handleExplainFeature("research");
                    }}
                    className={`mt-1 flex items-center justify-between p-2 rounded-lg text-[11px] font-bold uppercase transition-colors ${isIsland ? "glass-panel glass-border text-vouch-cyan hover:border-vouch-cyan/40" : "border border-slate-800 hover:border-sky-500/30 bg-slate-950 text-slate-300 hover:text-sky-400"}`}
                  >
                    <span>Go to Grounded Search Panel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className={`mr-auto rounded-2xl px-3.5 py-2.5 text-xs ${isIsland ? "glass-panel glass-border text-white/50" : "bg-slate-900/90 text-slate-400 border border-slate-800"}`}>
            {isIsland ? (
              "Thinking…"
            ) : (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        )}
      </div>

      {isIsland && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Quick page jumps">
          {ISLAND_PAGE_SHORTCUTS.map(({ label, section, icon: Icon }) => (
            <button
              key={section}
              type="button"
              onClick={() => handleExplainFeature(section)}
              className={pageJumpBtn}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className={`flex flex-wrap gap-2 ${isIsland ? "mt-3" : "overflow-x-auto pb-1 scrollbar-none"}`}>
        <button type="button" onClick={() => handleExplainFeature("build")} className={quickBtn}>
          <Sliders className="w-3 h-3" />
          <span>Explain features</span>
        </button>
        <button type="button" onClick={handleAnalyzeParlay} className={quickBtn}>
          <BrainCircuit className="w-3 h-3" style={isIsland ? undefined : { animationDuration: "6s" }} />
          <span>Analyze Parlay</span>
        </button>
        <button
          type="button"
          onClick={() =>
            openEmailForm(
              "vouchedge@gmail.com",
              "Improvement feedback",
              "Hi VouchEdge team,\n\nI suggest improving the visual themes...",
              "📬 Let's secure your progress and send email feedback to **vouchedge@gmail.com**! Use the form below:"
            )
          }
          className={quickBtn}
        >
          <Mail className={`w-3 h-3 ${isIsland ? "" : "text-red-500"}`} />
          <span>Send @vouchedge</span>
        </button>
        <button
          type="button"
          onClick={() =>
            openEmailForm(
              "zhavior@gmail.com",
              "App Feedback",
              "Hi zhavior,\n\nI wanted to share my feedback on feature enhancements...",
              "📬 Draft a quick feedback message to and direct it to **zhavior@gmail.com** below:"
            )
          }
          className={quickBtn}
        >
          <Mail className={`w-3 h-3 ${isIsland ? "" : "text-amber-500"}`} />
          <span>Send @zhavior</span>
        </button>
      </div>

      {showUpgradePrompt && (
        <div className="mb-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
          <div className="font-black text-white">
            🔒 Vouch AI Pro
          </div>

          <p className="mt-2 text-sm text-white/70">
            Unlock unlimited Vouch conversations,
            edge explanations, matchup intelligence,
            and confidence breakdowns.
          </p>

          <button
            type="button"
            onClick={() => {
              ProductEvents.proUpgradeClicked("vouch_ai");
              onSectionChange?.("premium");
            }}
            className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-black"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          if (!isPro && messages.filter((m) => m.sender === "user").length >= 3) {
            e.preventDefault();
            setShowUpgradePrompt(true);
            return;
          }

          ProductEvents.firstVouchQuestion();
          handleSendMessage(e);
        }}
        className={`flex gap-2 ${isIsland ? "mt-3" : "mt-0 items-center"}`}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask agent, search player, or request feedback..."
          className={inputClass}
          disabled={isTyping}
        />
        <button type="submit" disabled={!inputValue.trim() || isTyping} aria-label="Send message" className={sendBtn}>
          <Send className="w-4 h-4" />
        </button>
      </form>

      {isIsland && (
        <p className="mt-3 text-center text-[10px] text-white/25">
          Research &amp; entertainment only — no guaranteed outcomes.
        </p>
      )}
    </>
  );
}
