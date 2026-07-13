import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shell = readFileSync("src/app/AppShell.tsx", "utf8");
const island = readFileSync("src/components/theEdge/EdgeCommandIsland.tsx", "utf8");
const chat = readFileSync("src/components/theEdge/WorldChatPanel.tsx", "utf8");

describe("Edge Command Island", () => {
  it("mounts an authenticated corner island outside the public front page", () => {
    expect(shell).toContain("<EdgeCommandIsland");
    expect(shell).toContain("showGlobalAppChrome && isLoggedIn && !isPublicFrontPage");
    expect(island).toContain("fixed bottom-5 right-5");
  });

  it("keeps chat profile-linked and compact", () => {
    expect(island).toContain("<WorldChatPanel");
    expect(island).toContain("compact");
    expect(chat).toContain("onNavigateProfile");
    expect(chat).toContain("Chatting as @${resolvedProfile.username}");
  });
});
