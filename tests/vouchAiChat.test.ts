import { describe, expect, it } from "vitest";
import { routeNeedsFullAgent, routeVouchAiMessage } from "../src/lib/vouchAiChatRouting";

describe("routeVouchAiMessage", () => {
  it("routes email feedback to email_form", () => {
    const action = routeVouchAiMessage("send feedback email to zhavior");
    expect(action.kind).toBe("email_form");
    if (action.kind === "email_form") {
      expect(action.target).toBe("zhavior@gmail.com");
    }
  });

  it("routes parlay requests to parlay_analysis", () => {
    expect(routeVouchAiMessage("analyze my parlay slip").kind).toBe("parlay_analysis");
  });

  it("routes HR board shortcuts to section_nav", () => {
    const action = routeVouchAiMessage("open hr board");
    expect(action.kind).toBe("section_nav");
    if (action.kind === "section_nav") {
      expect(action.section).toBe("hr_board");
    }
  });

  it("falls back to api_chat for generic questions", () => {
    expect(routeVouchAiMessage("what weather models do you use?").kind).toBe("api_chat");
  });
});

describe("routeNeedsFullAgent", () => {
  it("flags rich agent-only routes", () => {
    expect(routeNeedsFullAgent(routeVouchAiMessage("explain features"))).toBe(true);
    expect(routeNeedsFullAgent(routeVouchAiMessage("open hr board"))).toBe(false);
  });
});
