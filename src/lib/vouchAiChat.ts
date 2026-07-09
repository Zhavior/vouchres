import { apiClient } from "./apiClient";
import {
  VOUCH_AI_SYSTEM_INSTRUCTION,
  type VouchAiApiMessage,
  type VouchAiUiMessage,
} from "./vouchAiChatRouting";

export * from "./vouchAiChatRouting";

export const VOUCH_AI_OPEN_EVENT = "open-vedge-agent-chat";

export interface VouchAiOpenEventDetail {
  text?: string;
  action?: string;
  messages?: VouchAiUiMessage[];
  processLastUserMessage?: boolean;
}

export function formatChatTimestamp(date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function uiMessagesToApiHistory(messages: VouchAiUiMessage[]): VouchAiApiMessage[] {
  return messages.map((m) => ({
    role: m.sender === "agent" ? "assistant" : "user",
    content: m.text,
  }));
}

export interface VouchAiChatApiResult {
  status: "success" | "no-key" | "error";
  text: string;
}

export async function sendVouchAiChat(
  history: VouchAiApiMessage[],
  userText: string
): Promise<VouchAiChatApiResult> {
  const messages = [...history, { role: "user" as const, content: userText }];

  try {
    const data = await apiClient.post<{ status: string; text: string }>("/api/ai/chat", {
      messages,
      systemInstruction: VOUCH_AI_SYSTEM_INSTRUCTION,
    });

    if (data.status === "success" || data.status === "no-key") {
      return { status: data.status === "no-key" ? "no-key" : "success", text: data.text };
    }

    return {
      status: "error",
      text: "I am temporarily operating in design-simulation mode, but everything is fully active! Feel free to click any feature shortcut above or draft an email feedback block.",
    };
  } catch {
    return {
      status: "error",
      text: "I am connected in offline simulation mode! I can help guide your sports research, explain features, construct parlay slips, or dispatch feedback emails.",
    };
  }
}

export function openVouchAiAgent(detail: VouchAiOpenEventDetail = {}): void {
  window.dispatchEvent(new CustomEvent(VOUCH_AI_OPEN_EVENT, { detail }));
}

export function buildIslandWelcomeMessage(firstName: string): VouchAiUiMessage {
  return {
    id: "welcome",
    sender: "agent",
    text: `Hey ${firstName} — I'm your Command AI bot. Ask about features, HR edges, or parlay research. I route to real VouchEdge tools when you need them.`,
    timestamp: formatChatTimestamp(),
  };
}

export function buildAgentWelcomeMessage(displayName: string): VouchAiUiMessage {
  return {
    id: "welcome-agent-msg",
    sender: "agent",
    text: `👋 Hey **${displayName}**! I am your **VouchEdge AI Assistant Agent**. Let's make your sports research smarter! 

I can explain any app feature, connect with our **V.A.I Smart Picks** and the parlay engine, fetch live MLB stats, analyze your draft tickets, or dispatch verified feedback emails directly to **vouchedge@gmail.com** and **zhavior@gmail.com**.

How can I help you research today?`,
    timestamp: formatChatTimestamp(),
    type: "feature_list",
  };
}
