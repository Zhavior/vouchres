import { test, expect, type Page } from "@playwright/test";

async function openReplacementWorkspace(page: Page) {
  await page.goto("/#build");
  await page.waitForLoadState("domcontentloaded");

  const rejectTelemetry = page.getByRole("button", { name: "Reject non-essential" });
  if (await rejectTelemetry.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await rejectTelemetry.click();
  }

  await expect(page.getByRole("heading", { name: "My List & Parlay Editor" })).toBeVisible({ timeout: 30_000 });
}

test.describe("My List smoke", () => {
  test.describe.configure({ timeout: 90_000 });

  test("replacement workspace navigation loads", async ({ page }) => {
    await openReplacementWorkspace(page);

    const workspaceNav = page.getByRole("navigation", { name: "My List and parlay workspace" });
    await expect(workspaceNav.getByRole("button", { name: /My List/i })).toBeVisible();
    await expect(workspaceNav.getByRole("button", { name: /Active Parlay/i })).toBeVisible();
    await expect(workspaceNav.getByRole("button", { name: /Saved & Graded/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /My List \+ Editor/i })).toBeVisible();
  });

  test("empty active parlay guides user to verified players", async ({ page }) => {
    await openReplacementWorkspace(page);

    const activeParlay = page.getByRole("button", { name: /Active Parlay/i });
    await expect(activeParlay).toBeVisible();
    await activeParlay.click();

    await expect(page.getByRole("region", { name: "Parlay Editor" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your active parlay is empty" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Browse HR Players" })).toBeVisible();
  });
});
