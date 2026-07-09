import { useEffect, useRef, useState } from "react";
import { BrainCircuit, Cpu, Flame, Send, Shield, Sparkles } from "lucide-react";
import { motion } from "../../lib/motion";
import { apiUrl } from "../../lib/apiBase";
import type { CreatorProofProfile } from "../../types";

type ChatMessage = {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
};

type Props = {
  profile?: CreatorProofProfile;
  onSectionChange?: (section: string) => void;
  onClose?: () => void;
};

const QUICK_ACTIONS = [
  { label: "V.A.I Smart Picks", section: "ai_engine", icon: Cpu },
  { label: "HR Board", section: "hr_board", icon: Flame },
  { label: "Parlay Lab", section: "build", icon: Shield },
] as const;

export default function EdgeIslandAskAiPanel({ profile, onSectionChange, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstName = profile?.displayName?.split(" ")[0] ?? "there";

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "agent",
        text: `Hey ${firstName} — I'm your Command AI bot. Ask about features, HR edges, or parlay research. I route to real VouchEdge tools when you need them.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [firstName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const appendAgent = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const goSection = (section: string, note: string) => {
    onSectionChange?.(section);
    appendAgent(note);
    onClose?.();
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    setInputValue("");
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    const lower = text.toLowerCase();
    if (lower.includes("smart pick") || lower.includes("v.a.i") || lower.includes("ai engine")) {
      goSection("ai_engine", "Opening **V.A.I Smart Picks** — precomputed tickets backed by Statcast and weather models.");
      return;
    }
    if (lower.includes("hr board") || lower.includes("home run")) {
      goSection("hr_board", "Jumping to the **HR Board** for today's verified candidates.");
      return;
    }
    if (lower.includes("parlay") || lower.includes("build")) {
      goSection("build", "Opening the **Parlay Lab** to draft or review slips.");
      return;
    }

    setIsTyping(true);
    try {
      const history = messages.map((m) => ({
        role: m.sender === "agent" ? "assistant" : "user",
        content: m.text,
      }));
      history.push({ role: "user", content: text });

      const response = await fetch(apiUrl("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          systemInstruction: `You are the VouchEdge Command Island AI — concise, trust-first, research-only.
Explain HR Board, Parlay Lab, V.A.I Smart Picks, and Player Research honestly.
Never guarantee outcomes. Suggest opening the relevant app section when helpful.`,
        }),
      });

      const data = await response.json();
      setIsTyping(false);
      if (data.status === "success" || data.status === "simulated") {
        appendAgent(data.text);
      } else {
        appendAgent("I'm in offline mode — use the quick actions below or open V.A.I Smart Picks from Command.");
      }
    } catch {
      setIsTyping(false);
      appendAgent("Connection unavailable — tap a quick action to jump into the app, or try again.");
    }
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="glass-panel glass-border mb-4 flex items-center gap-3 rounded-2xl p-3.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-black text-white">Ask AI</h2>
            <Sparkles className="h-3.5 w-3.5 text-vouch-cyan" />
          </div>
          <p className="text-[10px] text-white/40">Command AI bot · research &amp; navigation</p>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
              m.sender === "user"
                ? "ml-auto border border-vouch-cyan/25 bg-vouch-cyan/10 text-white"
                : "mr-auto glass-panel glass-border text-white/80"
            }`}
          >
            {m.text}
          </motion.div>
        ))}
        {isTyping && (
          <div className="mr-auto glass-panel glass-border rounded-2xl px-3.5 py-2.5 text-xs text-white/50">
            Thinking…
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(({ label, section, icon: Icon }) => (
          <button
            key={section}
            type="button"
            onClick={() =>
              goSection(
                section,
                section === "ai_engine"
                  ? "Opening **V.A.I Smart Picks**."
                  : section === "hr_board"
                    ? "Opening **HR Board**."
                    : "Opening **Parlay Lab**."
              )
            }
            className="glass-panel glass-border inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold text-vouch-cyan transition hover:border-vouch-cyan/40"
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about edges, features, parlays…"
          className="glass-panel glass-border min-w-0 flex-1 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-vouch-cyan/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          aria-label="Send message"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-vouch-cyan/35 bg-vouch-cyan/15 text-vouch-cyan transition hover:bg-vouch-cyan/25 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-3 text-center text-[10px] text-white/25">
        Research &amp; entertainment only — no guaranteed outcomes.
      </p>
    </div>
  );
}
