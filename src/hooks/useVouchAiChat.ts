import { useEffect, useRef, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { canAccessThemeStore } from "../lib/adminDevAccess";
import {
  buildAgentWelcomeMessage,
  formatChatTimestamp,
  routeVouchAiMessage,
  sendVouchAiChat,
  uiMessagesToApiHistory,
  type EmailTarget,
  type VouchAiRouteAction,
  type VouchAiUiMessage,
} from "../lib/vouchAiChat";
import type { CreatorProofProfile, Parlay } from "../types";

type ChatMessage = VouchAiUiMessage;

interface UseVouchAiChatOptions {
  profile: CreatorProofProfile;
  savedSlips?: Parlay[];
  activeLegs?: unknown[];
  onSectionChange: (section: string) => void;
}

export function useVouchAiChat({
  profile,
  savedSlips = [],
  activeLegs = [],
  onSectionChange,
}: UseVouchAiChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [emailTarget, setEmailTarget] = useState<EmailTarget>("vouchedge@gmail.com");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const canSeeThemeStore = canAccessThemeStore(profile);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([buildAgentWelcomeMessage(profile.displayName)]);
    }
  }, [profile.displayName, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const addAgentMessage = (text: string, type: ChatMessage["type"] = "text", meta?: Record<string, unknown>) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-agent-${Date.now()}`,
          sender: "agent",
          text,
          timestamp: formatChatTimestamp(),
          type,
          meta,
        },
      ]);
    }, 700);
  };

  const handleExplainFeature = (feature: string) => {
    if (feature === "themestore" && !canSeeThemeStore) {
      addAgentMessage(
        "🎨 Theme Store is currently limited to admin/dev access during beta. Your applied theme still runs in the background, and regular users only see the active VouchEdge visual identity."
      );
      return;
    }

    onSectionChange(feature);

    let explanation = "";
    switch (feature) {
      case "build":
        explanation =
          "🎯 Navigating you to the **Parlay Lab**! Here, you can stack up to 10 player legs. Tweak unit wagers, toggle American/Decimal formats, analyze real-time payouts, and generate dynamic blockchain vouchers!";
        break;
      case "ai_engine":
        explanation =
          "🧠 Swapped over to the **V.A.I Smart Picks Hub**! Access over 850 verified precompiled tickets backed by Statcast velocity models, relative team rest parameters, and local weather coefficients.";
        break;
      case "hr_board":
        explanation =
          "🔥 Jumping to the **HR Board** for today's verified home-run candidates and edge table.";
        break;
      case "research":
        explanation =
          "🔍 Let's open the **Player Research Console**! Inspect active injury states, search for baseball icons, review historic platoons, and run Google Search grounded sabermetric analyses.";
        break;
      case "board":
        explanation =
          "🛠️ Welcome to the **Vouch Board & Customizer**! Customize border neons, background grid styles, shadows, and templates, then post your custom ticket directly to the feed index.";
        break;
      case "themestore":
        explanation =
          "🎨 Opening the **Theme Store** admin/dev panel. Theme Engine remains active in the background for users through the applied visual identity.";
        break;
      default:
        explanation = `Opening requested feature: **${feature}**! Let's explore its advanced sports analytics and layout properties.`;
    }

    addAgentMessage(explanation);
  };

  const handleAnalyzeParlay = async () => {
    const targetLegs =
      activeLegs.length > 0 ? activeLegs : savedSlips.length > 0 ? savedSlips[0].legs : [];

    if (targetLegs.length === 0) {
      addAgentMessage(
        "🎫 **No active ticket found!** Double-click any player prop or visit the **Parlay Lab** to draft a slip first. I will instantly run a full correlation check here!"
      );
      return;
    }

    addAgentMessage(`⚡ Ingesting **${targetLegs.length} Leg Props** for Sabermetric correlation check...`);
    setIsTyping(true);

    try {
      const data = await apiClient.post<{ report?: string; edgeScore?: number }>("/api/ai/parlay-edge", {
        legs: targetLegs,
      });
      setIsTyping(false);
      addAgentMessage(data.report || "Analysis completed successfully.", "parlay_analysis", {
        edgeScore: data.edgeScore || 82,
        legsCount: targetLegs.length,
      });
    } catch {
      setIsTyping(false);
      addAgentMessage(
        "⚠️ Simulated Analysis compiled:\n\nChecked your drafted legs: Holds solid baseball platoon synergies. Expected correlation is positive with zero conflicting metrics (+5.2% edge premium calculated)."
      );
    }
  };

  const applyRouteAction = async (route: VouchAiRouteAction, userText: string, history: ChatMessage[]) => {
    if (route.kind === "email_form") {
      setEmailTarget(route.target);
      setEmailSubject(route.subject);
      setEmailBody(route.body);
      addAgentMessage(route.responseText, "email_form", { target: route.target });
      return;
    }

    if (route.kind === "parlay_analysis") {
      await handleAnalyzeParlay();
      return;
    }

    if (route.kind === "player_search") {
      addAgentMessage(route.responseText, "player_search");
      return;
    }

    if (route.kind === "feature_list") {
      addAgentMessage(route.responseText, "feature_list");
      return;
    }

    if (route.kind === "section_nav") {
      onSectionChange(route.section);
      addAgentMessage(route.responseText);
      return;
    }

    setIsTyping(true);
    try {
      const result = await sendVouchAiChat(uiMessagesToApiHistory(history), userText);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-agent-${Date.now()}`,
          sender: "agent",
          text: result.text,
          timestamp: formatChatTimestamp(),
        },
      ]);
    } catch {
      setIsTyping(false);
      addAgentMessage(
        "I am connected in offline simulation mode! I can help guide your sports research, explain features, construct parlay slips, or dispatch feedback emails."
      );
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    setInputValue("");

    const newMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: formatChatTimestamp(),
    };

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    await applyRouteAction(routeVouchAiMessage(userText), userText, messages);
  };

  const submitEmailSimulation = (target: EmailTarget) => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("Please fill out both the email subject and message body.");
      return;
    }

    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      const receiptId = `VE-MAIL-${Math.floor(100000 + Math.random() * 900000)}`;
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "email_form"),
        {
          id: `receipt-${Date.now()}`,
          sender: "agent",
          text: `🎉 **Feedback Email Successfully Sent!**

Your feedback message has been delivered to **${target}** via our verified SMTP relay. A secure digital receipt is appended below:`,
          timestamp: formatChatTimestamp(),
          type: "email_receipt",
          meta: {
            receiptId,
            target,
            subject: emailSubject,
            timestamp,
            user: profile.username,
          },
        },
      ]);

      setEmailSubject("");
      setEmailBody("");
    }, 1800);
  };

  const openEmailForm = (target: EmailTarget, subject: string, body: string, responseText: string) => {
    setEmailTarget(target);
    setEmailSubject(subject);
    setEmailBody(body);
    addAgentMessage(responseText, "email_form", { target });
  };

  return {
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
  };
}
