/**
 * Capture mobile UI screenshots for visual QA.
 * Usage: node scripts/mobileScreenshots.mjs
 */
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve('/opt/cursor/artifacts/screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const FAKE_TOKEN = 'dev-screenshot-token-abcdefghijklmnopqrstuvwxyz';
const TAG = process.env.SHOT_TAG ? `${process.env.SHOT_TAG}-` : '';

const routes = [
  { name: '01-landing', path: '/vouchedge', auth: false },
  { name: '02-judge-home', path: '/judge-home', auth: true, expectText: 'Judge Home' },
  { name: '03-today', path: '/today', auth: true, expectText: 'Today' },
  { name: '04-feed', path: '/feed', auth: true },
  { name: '05-board', path: '/board', auth: true },
  { name: '06-hr-board', path: '/hr-board', auth: true, expectText: 'HOME RUN' },
  { name: '07-settings', path: '/settings', auth: true, expectText: /settings|profile|notification/i },
];

async function dismissOverlays(page) {
  for (const name of [/reject non-essential/i, /accept all/i]) {
    const btn = page.getByRole('button', { name });
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => undefined);
      await page.waitForTimeout(200);
    }
  }
  await page.evaluate(() => {
    document.querySelectorAll('.legal-gate').forEach((el) => {
      el.style.display = 'none';
    });
  });
}

async function seedAuth(context) {
  await context.addInitScript((token) => {
    localStorage.setItem('vouchedge_auth_token', token);
    localStorage.setItem('vouchedge_active_section', 'today');
    localStorage.setItem(
      'vouchedge.cookie_consent',
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false,
        consented_at: new Date().toISOString(),
        version: 1,
      }),
    );
  }, FAKE_TOKEN);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await seedAuth(context);
  const page = await context.newPage();

  for (const route of routes) {
    const url = `${BASE}${route.path}`;
    console.log('capturing', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(1500);
    await dismissOverlays(page);

    if (route.name.includes('judge')) {
      const judgesTab = page.getByRole('button', { name: /go to judges/i });
      if (await judgesTab.isVisible().catch(() => false)) {
        await judgesTab.click();
        await page.waitForTimeout(800);
      }
    }

    if (route.expectText) {
      await page.getByText(route.expectText).first().waitFor({ timeout: 8000 }).catch(() => undefined);
    }

    await page.waitForTimeout(500);
    const file = resolve(OUT, `${TAG}${route.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log('wrote', file);
    await page.screenshot({ path: resolve(OUT, `${TAG}${route.name}-full.png`), fullPage: true });
  }

  // Explicit dock click tour from Today
  await page.goto(`${BASE}/today`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await dismissOverlays(page);
  for (const [label, fileBase] of [
    ['Go to Judges', '08-dock-judges'],
    ['Go to Home Feed', '09-dock-home'],
    ['Go to Today', '10-dock-today'],
  ]) {
    const tab = page.getByRole('button', { name: label });
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(900);
      await dismissOverlays(page);
      const file = resolve(OUT, `${TAG}${fileBase}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log('wrote', file);
    }
  }

  await browser.close();
  console.log('done', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
