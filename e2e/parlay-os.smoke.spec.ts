import { test, expect } from "@playwright/test";

test.describe("ParlayOS smoke", () => {
  test("Parlay Hub build tab loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const buildLink = page.getByRole("button", { name: /build/i }).first();
    if (await buildLink.isVisible().catch(() => false)) {
      await buildLink.click();
    } else {
      await page.goto("/#build");
    }

    await expect(page.getByRole("region", { name: /parlayos/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("tab", { name: /build/i })).toBeVisible();
  });

  test("ParlayOS empty build state guides user", async ({ page }) => {
    await page.goto("/#build");
    await page.waitForLoadState("domcontentloaded");

    const hub = page.getByRole("region", { name: /parlayos/i });
    await expect(hub).toBeVisible({ timeout: 30_000 });

    const emptyGuide = page.getByText(/build from your research/i);
    const browseSignals = page.getByRole("button", { name: /browse hr signals/i });
    const openDock = page.getByRole("button", { name: /open parlayos dock/i });
    const hasEmpty = await emptyGuide.isVisible().catch(() => false);
    const hasBrowse = await browseSignals.isVisible().catch(() => false);
    const hasDock = await openDock.isVisible().catch(() => false);
    expect(hasEmpty || hasBrowse || hasDock).toBeTruthy();
  });
});
