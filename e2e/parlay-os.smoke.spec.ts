import { test, expect } from "@playwright/test";

test.describe("ParlayOS smoke", () => {
  test("Parlay Hub build tab loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const buildLink = page.getByRole("button", { name: /build/i }).first();
    if (await buildLink.isVisible().catch(() => false)) {
      await buildLink.click();
    } else {
      await page.goto("/?section=build");
    }

    await expect(page.getByRole("region", { name: /parlayos/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("tab", { name: /build/i })).toBeVisible();
  });

  test("ParlayOS empty build state guides user", async ({ page }) => {
    await page.goto("/?section=build");
    await page.waitForLoadState("domcontentloaded");

    const hub = page.getByRole("region", { name: /parlayos/i });
    await expect(hub).toBeVisible({ timeout: 30_000 });

    const buildWithParlay = page.getByText(/build with parlayos/i);
    const openSlip = page.getByRole("button", { name: /open slip/i });
    const hasEmpty = await buildWithParlay.isVisible().catch(() => false);
    const hasSlip = await openSlip.isVisible().catch(() => false);
    expect(hasEmpty || hasSlip).toBeTruthy();
  });
});
