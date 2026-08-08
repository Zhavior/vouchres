import { test, expect } from "@playwright/test";

test.describe("My List smoke", () => {
  test("My List build tab loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const buildLink = page.getByRole("button", { name: /build/i }).first();
    if (await buildLink.isVisible().catch(() => false)) {
      await buildLink.click();
    } else {
      await page.goto("/#build");
    }

    await expect(page.getByRole("region", { name: "My List" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("tab", { name: /build/i })).toBeVisible();
  });

  test("My List empty build state guides user", async ({ page }) => {
    await page.goto("/#build");
    await page.waitForLoadState("domcontentloaded");

    const hub = page.getByRole("region", { name: "My List" });
    await expect(hub).toBeVisible({ timeout: 30_000 });

    const emptyBuildState = page.getByRole("heading", { name: /build from your research/i });
    const openSlip = page.getByRole("button", { name: /open slip/i });
    const hasEmpty = await emptyBuildState.isVisible().catch(() => false);
    const hasSlip = await openSlip.isVisible().catch(() => false);
    expect(hasEmpty || hasSlip).toBeTruthy();
  });
});
