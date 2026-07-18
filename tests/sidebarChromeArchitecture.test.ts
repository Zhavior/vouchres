import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("sidebar chrome architecture", () => {
  it("preloads AuthenticatedApp on public landing and uses chrome-preserving fallback", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    expect(app).toContain("ChromePreservingFallback");
    expect(app).toContain("void import('./app/AuthenticatedApp')");
    expect(app).toContain("z8-feed-sidebar");
  });

  it("uses Radix Collapsible for sidebar groups and Vaul for mobile drawer", () => {
    const group = readFileSync("src/app/chrome/SidebarNavGroup.tsx", "utf8");
    const drawer = readFileSync("src/app/chrome/MobileNavDrawer.tsx", "utf8");
    const sidebar = readFileSync("src/social/feed/FeedSidebar.tsx", "utf8");
    const mobile = readFileSync("src/social/feed/MobileProfileDrawer.tsx", "utf8");

    expect(group).toContain("@radix-ui/react-collapsible");
    expect(drawer).toContain("from 'vaul'");
    expect(sidebar).toContain("SidebarNavGroup");
    expect(sidebar).toContain("useSidebarCollapseStore");
    expect(mobile).toContain("MobileNavDrawer");
    expect(mobile).not.toContain("AnimatePresence");
  });

  it("wires auth session notify on persist and logout", () => {
    const supabase = readFileSync("src/lib/supabaseClient.ts", "utf8");
    const logout = readFileSync("src/lib/appLogout.ts", "utf8");
    const nav = readFileSync("src/app/useSectionNavigation.ts", "utf8");

    expect(supabase).toContain("notifyAuthSessionChanged");
    expect(logout).toContain("notifyAuthSessionChanged");
    expect(nav).toContain("useIsLoggedIn");
    expect(nav).toContain("await import('./AuthenticatedApp')");
  });
});
