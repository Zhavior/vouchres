export const VOUCH_AI_SYSTEM_INSTRUCTION = `You are the master VouchEdge Feature Agent AI.
You answer friendly, helpful sports-tech questions. Explain our key tools:
1. Parlay Lab (stake weighting, unit allocations).
2. V.A.I Smart Picks (sabermetric engine, precomputed tickets).
3. Player Research (Google search grounding).
4. Java Vouch Studio (ticket card editor).
5. Subscriber Clubs (chats & private locks).
6. Theme Engine (applied visual identity and profile presentation).

If the user wants to send feedback, remind them that they can ask you to send an email to vouchedge@gmail.com or zhavior@gmail.com, or use the "Send Email" action buttons in the chat interface. Keep instructions super elegant and professional.`;

export type VouchAiChatRole = "user" | "assistant";

export type VouchAiMessageType =
  | "text"
  | "feature_list"
  | "email_form"
  | "email_receipt"
  | "parlay_analysis"
  | "player_search";

export interface VouchAiApiMessage {
  role: VouchAiChatRole;
  content: string;
}

export interface VouchAiUiMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  type?: VouchAiMessageType;
  meta?: Record<string, unknown>;
}

export type EmailTarget = "vouchedge@gmail.com" | "zhavior@gmail.com";

export type VouchAiRouteAction =
  | {
      kind: "email_form";
      target: EmailTarget;
      subject: string;
      body: string;
      responseText: string;
    }
  | { kind: "parlay_analysis" }
  | { kind: "player_search"; responseText: string }
  | { kind: "feature_list"; responseText: string }
  | { kind: "section_nav"; section: string; responseText: string }
  | { kind: "api_chat" };

export function routeVouchAiMessage(text: string): VouchAiRouteAction {
  const lower = text.toLowerCase();

  if (
    lower.includes("email") ||
    lower.includes("feedback") ||
    lower.includes("zhavior") ||
    lower.includes("@gmail.com") ||
    lower.includes("vouchedge")
  ) {
    let target: EmailTarget = "vouchedge@gmail.com";
    if (lower.includes("zhavior")) {
      target = "zhavior@gmail.com";
    }

    return {
      kind: "email_form",
      target,
      subject: lower.includes("bug") ? "Bug Report feedback" : "General System Feedback",
      body: "Hi team,\n\nI am writing to share some feedback regarding the VouchEdge features...",
      responseText: `📬 I detected an email or feedback request targeted to **${target}**! Let's draft your message securely right here. Fill out the subject and body in the form below, and I will dispatch it with our encrypted digital server trace!`,
    };
  }

  if (
    lower.includes("parlay") ||
    lower.includes("analyze") ||
    lower.includes("slip") ||
    lower.includes("ticket")
  ) {
    return { kind: "parlay_analysis" };
  }

  if (
    lower.includes("search") ||
    lower.includes("player") ||
    lower.includes("stats") ||
    lower.includes("scout") ||
    lower.includes("shohei") ||
    lower.includes("aaron")
  ) {
    return {
      kind: "player_search",
      responseText:
        "🔍 Looking up active sabermetric records or player developments! Type a player name below to check real-time MLB stats or run Gemini analysis:",
    };
  }

  if (
    lower.includes("feature") ||
    lower.includes("explain") ||
    lower.includes("help") ||
    lower.includes("what is")
  ) {
    return {
      kind: "feature_list",
      responseText: `Here is a quick overview of our premier VouchEdge modules:
        
- **Parlay Lab**: A mathematical allocation workspace to build props, simulate decimal/American odds, and calculate risk profiles.
- **V.A.I Smart Picks**: Our elite AI projection database with weather, Statcast, and seasonal trend indicators.
- **Player Research Console**: Grounded scouting reports powered by Google Search.
- **Java Vouch Studio 🛠️**: A customized high-performance photo-editor canvas to mint visual ticket templates.
- **Live Streams**: Immersive stream lobbies where you can tail active sports handicappers.
- **Subscriber Clubs**: Direct text chats and premium parlays hosted by vetted cappers.`,
    };
  }

  if (lower.includes("smart pick") || lower.includes("v.a.i") || lower.includes("ai engine")) {
    return {
      kind: "section_nav",
      section: "ai_engine",
      responseText:
        "Opening **V.A.I Smart Picks** — precomputed tickets backed by Statcast and weather models.",
    };
  }

  if (lower.includes("hr board") || lower.includes("home run")) {
    return {
      kind: "section_nav",
      section: "hr_board",
      responseText: "Jumping to the **HR Board** for today's verified candidates.",
    };
  }

  if (lower.includes("build")) {
    return {
      kind: "section_nav",
      section: "build",
      responseText: "Opening the **Parlay Lab** to draft or review slips.",
    };
  }

  return { kind: "api_chat" };
}

export function routeNeedsFullAgent(action: VouchAiRouteAction): boolean {
  return (
    action.kind === "email_form" ||
    action.kind === "parlay_analysis" ||
    action.kind === "feature_list" ||
    action.kind === "player_search"
  );
}
