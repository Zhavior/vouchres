/**
 * Build App Store–grade VE monogram from a real font (outlined paths).
 * Also writes a font comparison sheet for QA.
 *
 * Usage: node scripts/buildVeMarkFromFont.mjs [FontKey]
 * FontKey: MontserratBlack | SpaceGroteskBold | NotoSansDisplayBold | InterBold | JetBrainsMonoExtraBold
 */
import opentype from 'opentype.js';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

function loadFont(file) {
  const buf = readFileSync(resolve(ROOT, file));
  // Node Buffer may be a view into a larger ArrayBuffer — slice precisely.
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}
const FONTS = {
  MontserratBlack: {
    file: 'scripts/brand-fonts/Montserrat-Black.ttf',
    label: 'Montserrat Black',
    size: 228,
    tracking: -4,
  },
  SpaceGroteskBold: {
    file: 'scripts/brand-fonts/SpaceGrotesk-Bold.ttf',
    label: 'Space Grotesk Bold',
    size: 268,
    tracking: 0,
  },
  NotoSansDisplayBold: {
    file: 'scripts/brand-fonts/NotoSansDisplay-Bold.ttf',
    label: 'Noto Sans Display Bold',
    size: 228,
    tracking: -2,
  },
  InterBold: {
    file: 'scripts/brand-fonts/Inter-Bold.ttf',
    label: 'Inter Bold',
    size: 228,
    tracking: -2,
  },
  JetBrainsMonoExtraBold: {
    file: 'scripts/brand-fonts/JetBrainsMono-ExtraBold.ttf',
    label: 'JetBrains Mono ExtraBold',
    size: 205,
    tracking: 2,
  },
};

const SHIELD =
  'M512 168 C602 168 718 222 760 274 V530 C760 668 652 798 512 868 C372 798 264 668 264 530 V274 C306 222 422 168 512 168 Z';

function pathToD(path) {
  // opentype Path → SVG d, rounded for stable diffs
  return path
    .toPathData(2)
    .replace(/(\.\d*?[1-9])0+\b/g, '$1')
    .replace(/\.0+\b/g, '');
}

function buildLetterGroup(fontKey) {
  const cfg = FONTS[fontKey];
  const font = loadFont(cfg.file);
  const size = cfg.size;
  const tracking = cfg.tracking;

  const vGlyph = font.getPath('V', 0, 0, size);
  const vBox = vGlyph.getBoundingBox();
  const eGlyph = font.getPath('E', vBox.x2 + tracking, 0, size);
  const eBox = eGlyph.getBoundingBox();

  const minX = Math.min(vBox.x1, eBox.x1);
  const maxX = Math.max(vBox.x2, eBox.x2);
  const minY = Math.min(vBox.y1, eBox.y1);
  const maxY = Math.max(vBox.y2, eBox.y2);
  const w = maxX - minX;
  const h = maxY - minY;

  // Optical center in shield body (slightly above geometric center)
  const cx = 512;
  const cy = 498;
  const tx = cx - (minX + w / 2);
  const ty = cy - (minY + h / 2);

  vGlyph.commands.forEach((c) => {
    if ('x' in c) c.x += tx;
    if ('y' in c) c.y += ty;
    if ('x1' in c) c.x1 += tx;
    if ('y1' in c) c.y1 += ty;
    if ('x2' in c) c.x2 += tx;
    if ('y2' in c) c.y2 += ty;
  });
  eGlyph.commands.forEach((c) => {
    if ('x' in c) c.x += tx;
    if ('y' in c) c.y += ty;
    if ('x1' in c) c.x1 += tx;
    if ('y1' in c) c.y1 += ty;
    if ('x2' in c) c.x2 += tx;
    if ('y2' in c) c.y2 += ty;
  });

  const vD = pathToD(vGlyph);
  const eD = pathToD(eGlyph);
  const finalBox = {
    minX: minX + tx,
    maxX: maxX + tx,
    minY: minY + ty,
    maxY: maxY + ty,
    w,
    h,
  };

  return { vD, eD, finalBox, cfg, fontKey };
}

function masterSvg({ vD, eD, finalBox, cfg, fontKey }) {
  const margin = Math.round(
    Math.min(finalBox.minX - 264, 760 - finalBox.maxX, finalBox.minY - 200, 820 - finalBox.maxY),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" role="img" aria-label="VouchEdge VE"
  data-craft-level="2"
  data-mark-core="ve"
  data-letter-font="${fontKey}"
  data-letter-style="filled-type"
  data-optical-letter-height="${Math.round(finalBox.h)}"
  data-optical-margin="${Math.max(margin, 0)}"
  data-optical-max-x="${Math.round(finalBox.maxX)}"
  data-no-gimmick="1">
  <!--
    VouchEdge master mark — craft level 2
    craft:level=2 markCore=ve letterFont=${fontKey} letterStyle=filled-type
    Font-outlined VE (${cfg.label}) inside trust shield. No stroke-overlap junk.
  -->
  <defs>
    <linearGradient id="ve-plate" x1="512" y1="0" x2="512" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06101C"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="ve-shield-stroke" x1="240" y1="160" x2="780" y2="880" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#A5F3FC"/>
      <stop offset="50%" stop-color="#22D3EE"/>
      <stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>
    <linearGradient id="ve-shield-fill" x1="512" y1="180" x2="512" y2="860" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#00E5FF" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="ve-letter" x1="300" y1="300" x2="740" y2="740" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F8FEFF"/>
      <stop offset="45%" stop-color="#67E8F9"/>
      <stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>
    <radialGradient id="ve-glow" cx="50%" cy="42%" r="46%">
      <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="#00E5FF" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#00E5FF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1024" height="1024" rx="224" fill="url(#ve-plate)"/>
  <circle class="ve-mark-glow" cx="512" cy="468" r="300" fill="url(#ve-glow)"/>

  <path
    class="ve-mark-shield"
    d="${SHIELD}"
    fill="url(#ve-shield-fill)"
    stroke="url(#ve-shield-stroke)"
    stroke-width="32"
    stroke-linejoin="round"
  />

  <g class="ve-mark-letters ve-mark-identity ve-mark-optical" aria-label="VE" fill="url(#ve-letter)">
    <path class="letter-v" d="${vD}"/>
    <path class="letter-e" d="${eD}"/>
  </g>
</svg>
`;
}

function reactMark({ vD, eD }) {
  return `/**
 * VouchEdge brand mark — trust shield + filled VE type.
 * Mirrors /public/brand/vouchedge-mark.svg (font-outlined paths).
 */
import React from 'react';

export type VouchEdgeMarkProps = {
  size?: number | string;
  className?: string;
  variant?: 'boot' | 'idle' | 'static';
  title?: string;
};

export function VouchEdgeMark({
  size = 96,
  className = '',
  variant = 'idle',
  title = 'VouchEdge',
}: VouchEdgeMarkProps) {
  const dim = typeof size === 'number' ? \`\${size}px\` : size;
  const animClass =
    variant === 'boot' ? 've-mark-boot' : variant === 'idle' ? 've-mark-idle' : '';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={dim}
      height={dim}
      className={\`ve-brand-mark \${animClass} \${className}\`.trim()}
      role="img"
      aria-label={title}
      data-craft-level="2"
      data-mark-core="ve"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="veMarkPlate" x1="512" y1="0" x2="512" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06101C" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="veMarkStroke" x1="240" y1="160" x2="780" y2="880" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5F3FC" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <linearGradient id="veMarkShieldFill" x1="512" y1="180" x2="512" y2="860" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="veMarkLetter" x1="300" y1="300" x2="740" y2="740" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FEFF" />
          <stop offset="45%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <radialGradient id="veMarkGlow" cx="50%" cy="42%" r="46%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.14" />
          <stop offset="70%" stopColor="#00E5FF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlate)" className="ve-mark-tile" />
      <circle cx="512" cy="468" r="300" fill="url(#veMarkGlow)" className="ve-mark-glow" />

      <path
        className="ve-mark-shield"
        d="${SHIELD}"
        fill="url(#veMarkShieldFill)"
        stroke="url(#veMarkStroke)"
        strokeWidth="32"
        strokeLinejoin="round"
      />

      <g className="ve-mark-letters ve-mark-identity ve-mark-optical" aria-label="VE" fill="url(#veMarkLetter)">
        <path className="letter-v" d="${vD}" />
        <path className="letter-e" d="${eD}" />
      </g>
    </svg>
  );
}

export default VouchEdgeMark;
`;
}

async function renderComparison(svgsByKey) {
  const outDir = '/opt/cursor/artifacts/screenshots';
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });

  const cards = Object.entries(svgsByKey)
    .map(
      ([key, svg]) => `
      <figure>
        <div class="icon">${svg.replace('<svg ', '<svg width="220" height="220" ')}</div>
        <figcaption>${FONTS[key].label}</figcaption>
        <div class="sizes">
          ${svg.replace('<svg ', '<svg width="48" height="48" ')}
          ${svg.replace('<svg ', '<svg width="96" height="96" ')}
        </div>
      </figure>`,
    )
    .join('\n');

  await page.setContent(`<!doctype html><html><head><style>
    html,body{margin:0;background:#0a1220;color:#e2e8f0;font:600 14px Inter,system-ui,sans-serif}
    h1{margin:24px 28px 8px;font-size:22px}
    p{margin:0 28px 20px;color:#94a3b8;font-weight:500}
    .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;padding:0 24px 24px}
    figure{margin:0;background:#020617;border:1px solid rgba(103,232,249,.18);border-radius:20px;padding:16px;text-align:center}
    .icon{display:flex;justify-content:center}
    figcaption{margin-top:10px;font-size:12px;letter-spacing:.02em}
    .sizes{display:flex;gap:12px;justify-content:center;align-items:center;margin-top:12px}
  </style></head><body>
    <h1>VouchEdge VE — font bake-off</h1>
    <p>Filled type inside shield (not stroke outlines). Compare 48 / 96 / 220.</p>
    <div class="grid">${cards}</div>
  </body></html>`);
  await page.waitForTimeout(200);
  const sheet = `${outDir}/ve-font-bakeoff.png`;
  await page.screenshot({ path: sheet, fullPage: true });
  console.log('wrote', sheet);

  // also render each key at 128 for side-by-side review
  for (const [key, svg] of Object.entries(svgsByKey)) {
    await page.setViewportSize({ width: 256, height: 256 });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#020617">${svg.replace('<svg ', '<svg width="256" height="256" ')}</body></html>`);
    await page.screenshot({ path: `${outDir}/ve-font-${key}.png` });
  }

  await browser.close();
}

async function main() {
  const pick = process.argv[2] || 'MontserratBlack';
  if (!FONTS[pick]) {
    console.error('Unknown font key. Choose one of:', Object.keys(FONTS).join(', '));
    process.exit(1);
  }

  const built = {};
  for (const key of Object.keys(FONTS)) {
    built[key] = buildLetterGroup(key);
  }

  const svgs = Object.fromEntries(
    Object.entries(built).map(([k, g]) => [k, masterSvg(g)]),
  );
  await renderComparison(svgs);

  const chosen = built[pick];
  const svg = masterSvg(chosen);
  const svgPath = resolve(ROOT, 'public/brand/vouchedge-mark.svg');
  writeFileSync(svgPath, svg);
  writeFileSync(resolve(ROOT, 'public/vouchedge-icon.svg'), svg);
  writeFileSync(resolve(ROOT, 'public/favicon.svg'), svg);
  writeFileSync(resolve(ROOT, 'src/brand/VouchEdgeMark.tsx'), reactMark(chosen));

  // keep a copy of the chosen font for provenance (not shipped to clients as dependency)
  copyFileSync(resolve(ROOT, FONTS[pick].file), resolve(ROOT, 'scripts/brand-fonts/ACTIVE-VE-FONT.ttf'));
  writeFileSync(
    resolve(ROOT, 'scripts/brand-fonts/ACTIVE.txt'),
    `${pick}\n${FONTS[pick].label}\nsize=${FONTS[pick].size} tracking=${FONTS[pick].tracking}\n`,
  );

  console.log(`shipped ${pick} (${FONTS[pick].label}) → public/brand/vouchedge-mark.svg`);
  console.log('bbox', chosen.finalBox);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
