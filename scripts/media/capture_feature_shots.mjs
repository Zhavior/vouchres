/**
 * Capture real product screenshots for the landing page.
 *
 * These are photographs of the running app, not mockups: the landing claims
 * sourced evidence, so the images it ships have to be the actual surfaces.
 * Re-run against a dev server whenever a surface changes.
 *
 *   node scripts/media/capture_feature_shots.mjs http://localhost:3000
 *
 * Each shot gets a fresh browser context. The app restores the last active
 * section from localStorage, so a reused context silently serves the previous
 * surface at the new URL — which is how a "news wire" shot ends up being a
 * second picture of HR Next. Every shot also asserts a string that only its own
 * surface renders, and fails loudly rather than writing the wrong screen.
 */
import { chromium } from '@playwright/test';
import { mkdir, rm } from 'node:fs/promises';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://localhost:3000';
const outDir = 'public/media/features';

const SHOTS = [
  {
    slug: 'hr-intelligence',
    path: '/hr-next',
    expect: 'HOME RUN COMMAND DESK',
    // Today's slate has no lineups before first pitch, which puts the board in
    // its "nothing source-complete yet" state. Shoot a settled slate instead.
    slate: '2026-08-23',
  },
  { slug: 'results-desk', path: '/results', expect: 'TOTAL SLATE HRS' },
  { slug: 'live-games', path: '/live-games', expect: 'LIVE GAMES DESK' },
  // Mobile Today renders its own shell ("VOUCHEDGE // TODAY"), so the guard
  // matches the part both layouts share.
  { slug: 'today-desk', path: '/today', expect: 'PRE-PITCH THESIS' },
  // /news and /build resolve to another surface for a signed-out visitor, so
  // they are not capturable from a public session. Left here as a record of
  // what was tried rather than silently dropped.
  { slug: 'news-wire', path: '/news', expect: 'INTEL WIRE' },
  { slug: 'parlay-builder', path: '/build', expect: 'SLIP' },
];

await mkdir(outDir, { recursive: true });
/**
 * Two frames per surface. A desktop screenshot scaled into a phone-width column
 * is an unreadable smear, so the landing serves a real phone-viewport capture
 * below the `lg` breakpoint instead of shrinking the desktop one.
 */
const FRAMES = [
  { suffix: '', viewport: { width: 1440, height: 900 }, width: 1800 },
  { suffix: '-mobile', viewport: { width: 390, height: 844 }, width: 780 },
];

const browser = await chromium.launch();

for (const { shot, frame } of SHOTS.flatMap((shot) => FRAMES.map((frame) => ({ shot, frame })))) {
  const context = await browser.newContext({
    viewport: frame.viewport,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  const url = `${base}${shot.path}`;

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });

    // Consent banner is chrome, not product — decline it before the shot.
    const decline = page.getByRole('button', { name: /reject non-essential/i });
    if (await decline.count()) await decline.first().click({ timeout: 5_000 }).catch(() => {});

    if (shot.slate) {
      const slateInput = page.locator('input[type="date"]').first();
      if (await slateInput.count()) {
        await slateInput.fill(shot.slate).catch(() => {});
        await page.waitForTimeout(4_000);
      }
    }

    // Let late data and any entrance transition settle so the frame is not
    // captured mid-render.
    await page.waitForTimeout(4_000);

    // Read <main>, not <body>: the nav bar carries every surface's name, so a
    // body-level check passes even when the router served a different screen.
    const main = await page.locator('main').first().innerText().catch(() => '');
    if (shot.expect && !main.toUpperCase().includes(shot.expect.toUpperCase())) {
      console.error(`SKIPPED ${shot.slug}${frame.suffix}: ${url} did not render "${shot.expect}" — wrong surface or gated.`);
      continue;
    }

    // Shoot at 2x, then ship a single 1800px webp: ~40-70KB instead of the
    // ~300-800KB retina PNG, which is the difference between a landing that
    // loads and one that streams screenshots at the visitor.
    const raw = `${outDir}/${shot.slug}${frame.suffix}.raw.png`;
    await page.screenshot({ path: raw });
    await sharp(raw)
      .resize({ width: frame.width })
      .webp({ quality: 74 })
      .toFile(`${outDir}/${shot.slug}${frame.suffix}.webp`);
    await rm(raw);
    console.log(`captured ${shot.slug}${frame.suffix} <- ${url}`);
  } catch (error) {
    console.error(`FAILED ${shot.slug}${frame.suffix} <- ${url}: ${error.message}`);
  } finally {
    await context.close();
  }
}

await browser.close();
