/**
 * Capture branded splash frames (boot + hello) for QA.
 * Usage: SHOT_TAG=v6 node scripts/splashScreenshots.mjs
 */
import { chromium } from 'playwright';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = '/opt/cursor/artifacts/screenshots';
const TAG = process.env.SHOT_TAG || 'splash';
const ROOT = process.cwd();

// Always use the shipping master mark so QA shots match production.
const svg = readFileSync(resolve(ROOT, 'public/brand/vouchedge-mark.svg'), 'utf8').replace(
  '<svg ',
  '<svg width="120" height="120" ',
);

async function shot(page, name, body) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>
      html,body{margin:0;height:100%;background:#0B1016;color:#fff;
        font-family:ui-sans-serif,system-ui,sans-serif}
      .shell{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
        background:radial-gradient(ellipse 80% 50% at 50% 35%,rgba(42,157,143,.14),transparent 60%),linear-gradient(165deg,#1A2330,#0B1016 55%,#080C11);padding:24px;text-align:center}
      .mark{width:120px;height:120px;margin-bottom:28px;filter:drop-shadow(0 10px 28px rgba(4,31,28,.45))}
      .mark svg{width:120px;height:120px;display:block}
      h1{font-size:28px;font-weight:900;margin:0}
      p{color:rgba(255,255,255,.55);margin:8px 0 0;font-size:14px}
      .bar{width:260px;margin-top:40px}
      .meta{display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.4);margin-bottom:8px}
      .track{height:4px;background:rgba(255,255,255,.1);border-radius:999px;overflow:hidden}
      .fill{height:100%;width:42%;background:linear-gradient(90deg,#67e8f9,#6ee7b7)}
      .pct{color:rgba(165,243,252,.9);font-family:ui-monospace,monospace}
    </style></head><body>${body}</body></html>`,
    { waitUntil: 'domcontentloaded' },
  );
  mkdirSync(OUT, { recursive: true });
  const path = resolve(OUT, `${TAG}-${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log('wrote', path);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await shot(
    page,
    'boot-splash',
    `<div class="shell" role="status" aria-label="Loading VouchEdge">
      <div class="mark">${svg}</div>
      <h1>VouchEdge</h1>
      <p>Warming HR board</p>
      <div class="bar"><div class="meta"><span>2/5</span><span class="pct">42%</span></div>
      <div class="track"><div class="fill"></div></div></div>
    </div>`,
  );

  await shot(
    page,
    'hello-splash',
    `<div class="shell" role="status" aria-label="Signing in">
      <div class="mark">${svg}</div>
      <h1>VouchEdge</h1>
      <p>Welcome back — opening your workspace…</p>
    </div>`,
  );

  try {
    copyFileSync(resolve(ROOT, 'assets/icon-only.png'), resolve(OUT, `${TAG}-icon-1024.png`));
    copyFileSync(resolve(ROOT, 'public/brand/vouchedge-1024.png'), resolve(OUT, `${TAG}-mark-1024.png`));
    console.log('copied HD masters to', OUT);
  } catch (err) {
    console.warn('HD copy skipped', err.message);
  }

  writeFileSync(
    resolve(OUT, `${TAG}-brand-notes.txt`),
    [
      'Master SVG: public/brand/vouchedge-mark.svg (1024 viewBox)',
      'PWA icons: public/icons/vouchedge-{180,192,512}.png',
      'Capacitor: assets/icon-only.png (1024), assets/splash.png (2732)',
      'Regenerate: node scripts/generateBrandAssets.mjs',
      'Android: npx capacitor-assets generate --android',
    ].join('\n') + '\n',
  );

  await browser.close();
  console.log('done', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
