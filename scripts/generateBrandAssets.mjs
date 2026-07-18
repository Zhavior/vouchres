/**
 * Render HD / 4K VouchEdge brand PNGs from the master SVG for PWA + Capacitor.
 * Usage: npm run brand:assets
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const SVG = readFileSync(resolve(ROOT, 'public/brand/vouchedge-mark.svg'), 'utf8');

const outputs = [
  // Recognition ladder (store grid → home screen → marketing)
  { file: 'public/brand/previews/vouchedge-48.png', size: 48 },
  { file: 'public/brand/previews/vouchedge-128.png', size: 128 },
  { file: 'public/icons/vouchedge-180.png', size: 180 },
  { file: 'public/icons/vouchedge-192.png', size: 192 },
  { file: 'public/icons/vouchedge-512.png', size: 512 },
  { file: 'assets/icon-only.png', size: 1024 },
  { file: 'assets/icon-foreground.png', size: 1024 },
  { file: 'public/brand/vouchedge-1024.png', size: 1024 },
  // True 4K master for App Store / Play / press kits
  { file: 'public/brand/vouchedge-4k.png', size: 4096 },
  { file: 'assets/splash.png', size: 2732, splash: true },
  { file: 'assets/splash-dark.png', size: 2732, splash: true },
];

function htmlFor(size, splash = false) {
  const logo = Math.round(splash ? size * 0.28 : size);
  const pad = splash ? Math.round((size - logo) / 2) : 0;
  return `<!doctype html><html><head><style>
    html,body{margin:0;background:#0B0618;width:${size}px;height:${size}px;overflow:hidden}
    .wrap{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;
      background:radial-gradient(ellipse 55% 45% at 40% 55%,rgba(34,211,238,0.16),transparent 60%),radial-gradient(ellipse 45% 40% at 78% 22%,rgba(192,38,211,0.18),transparent 55%),#0B0618}
    svg{width:${logo}px;height:${logo}px;display:block${splash ? `;margin:${pad}px` : ''}}
  </style></head><body><div class="wrap">${SVG}</div></body></html>`;
}

async function main() {
  mkdirSync(resolve(ROOT, 'assets'), { recursive: true });
  mkdirSync(resolve(ROOT, 'public/icons'), { recursive: true });
  mkdirSync(resolve(ROOT, 'public/brand/previews'), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  for (const out of outputs) {
    const page = await browser.newPage({
      viewport: { width: out.size, height: out.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(htmlFor(out.size, Boolean(out.splash)), { waitUntil: 'load' });
    await page.waitForTimeout(100);
    const buf = await page.screenshot({ type: 'png', omitBackground: false });
    const dest = resolve(ROOT, out.file);
    writeFileSync(dest, buf);
    console.log('wrote', out.file, `${out.size}x${out.size}`, `${Math.round(buf.length / 1024)}KB`);
    await page.close();
  }

  copyFileSync(resolve(ROOT, 'public/brand/vouchedge-mark.svg'), resolve(ROOT, 'public/vouchedge-icon.svg'));
  copyFileSync(resolve(ROOT, 'public/brand/vouchedge-mark.svg'), resolve(ROOT, 'public/favicon.svg'));
  copyFileSync(resolve(ROOT, 'assets/icon-only.png'), resolve(ROOT, 'assets/icon-background.png'));

  await browser.close();
  console.log('done — run: npx capacitor-assets generate --android (optional)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
