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
    size: 220,
    tracking: 14,
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

/**
 * Material system — enamel badge on ink desk.
 * Deliberately NOT neon-cyber (#00E5FF glow on pure black).
 * Palette: graphite ink · sea-glass enamel · brushed seafoam rim · bone type.
 */
function masterSvg({ vD, eD, finalBox, cfg, fontKey }) {
  const margin = Math.round(
    Math.min(finalBox.minX - 264, 760 - finalBox.maxX, finalBox.minY - 200, 820 - finalBox.maxY),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" role="img" aria-label="VouchEdge VE"
  data-craft-level="2"
  data-mark-core="ve"
  data-letter-font="${fontKey}"
  data-letter-style="filled-type"
  data-material="enamel"
  data-palette="ink-desk"
  data-texture="grain"
  data-optical-letter-height="${Math.round(finalBox.h)}"
  data-optical-margin="${Math.max(margin, 0)}"
  data-optical-max-x="${Math.round(finalBox.maxX)}"
  data-no-gimmick="1">
  <!--
    VouchEdge master mark — craft level 2
    craft:level=2 markCore=ve material=enamel palette=ink-desk texture=grain
    letterFont=${fontKey} letterStyle=filled-type
    Graphite plate + sea-glass enamel shield + bone VE. No neon-cyber glow.
  -->
  <defs>
    <!-- Plate: graphite ink with a quiet warm lift at the top -->
    <linearGradient id="ve-plate" x1="180" y1="0" x2="860" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1A2330"/>
      <stop offset="42%" stop-color="#121820"/>
      <stop offset="100%" stop-color="#0B1016"/>
    </linearGradient>
    <linearGradient id="ve-plate-sheen" x1="200" y1="80" x2="820" y2="900" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2A3A48" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="#2A3A48" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0E3D38" stop-opacity="0.18"/>
    </linearGradient>

    <!-- Soft desk wash — not a neon orb -->
    <radialGradient id="ve-glow" cx="48%" cy="40%" r="52%">
      <stop offset="0%" stop-color="#2A9D8F" stop-opacity="0.10"/>
      <stop offset="55%" stop-color="#1B4332" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#0B1016" stop-opacity="0"/>
    </radialGradient>

    <!-- Enamel body -->
    <linearGradient id="ve-shield-fill" x1="512" y1="170" x2="520" y2="860" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1F6F66"/>
      <stop offset="38%" stop-color="#145A52"/>
      <stop offset="72%" stop-color="#0E3F3A"/>
      <stop offset="100%" stop-color="#0A2E2B"/>
    </linearGradient>
    <linearGradient id="ve-shield-inner" x1="400" y1="220" x2="640" y2="720" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5EEAD4" stop-opacity="0.16"/>
      <stop offset="45%" stop-color="#2A9D8F" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#041F1C" stop-opacity="0.35"/>
    </linearGradient>

    <!-- Brushed metal rim -->
    <linearGradient id="ve-shield-stroke" x1="280" y1="160" x2="740" y2="860" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E7F6F2"/>
      <stop offset="28%" stop-color="#9BD5C8"/>
      <stop offset="62%" stop-color="#4FA896"/>
      <stop offset="100%" stop-color="#2F6F63"/>
    </linearGradient>

    <!-- Bone type with cool edge -->
    <linearGradient id="ve-letter" x1="360" y1="400" x2="680" y2="600" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFF8EF"/>
      <stop offset="48%" stop-color="#F0E6D6"/>
      <stop offset="100%" stop-color="#C9DED7"/>
    </linearGradient>
    <linearGradient id="ve-letter-shade" x1="512" y1="410" x2="512" y2="590" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#0A2E2B" stop-opacity="0.18"/>
    </linearGradient>

    <!-- Film grain / paper tooth -->
    <filter id="ve-grain" x="-10%" y="-10%" width="120%" height="120%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="3" seed="11" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.78  0 0 0 0 0.82  0 0 0 0 0.8  0 0 0 0.035 0" in="n" result="g"/>
      <feBlend in="SourceGraphic" in2="g" mode="soft-light"/>
    </filter>
    <filter id="ve-letter-depth" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#041F1C" flood-opacity="0.45"/>
    </filter>

    <clipPath id="ve-shield-clip">
      <path d="${SHIELD}"/>
    </clipPath>
  </defs>

  <!-- Graphite tile -->
  <rect class="ve-mark-tile" width="1024" height="1024" rx="224" fill="url(#ve-plate)"/>
  <rect width="1024" height="1024" rx="224" fill="url(#ve-plate-sheen)"/>
  <rect class="ve-mark-grain" width="1024" height="1024" rx="224" fill="url(#ve-plate)" filter="url(#ve-grain)" opacity="0.4"/>
  <ellipse class="ve-mark-glow" cx="512" cy="455" rx="310" ry="280" fill="url(#ve-glow)"/>

  <!-- Enamel shield -->
  <path
    class="ve-mark-shield"
    d="${SHIELD}"
    fill="url(#ve-shield-fill)"
    stroke="url(#ve-shield-stroke)"
    stroke-width="30"
    stroke-linejoin="round"
  />
  <g clip-path="url(#ve-shield-clip)">
    <path d="${SHIELD}" fill="url(#ve-shield-inner)"/>
    <!-- top lip catch-light -->
    <ellipse cx="512" cy="250" rx="168" ry="54" fill="#E7F6F2" opacity="0.10"/>
  </g>

  <!-- Bone VE -->
  <g class="ve-mark-letters ve-mark-identity ve-mark-optical" aria-label="VE" filter="url(#ve-letter-depth)">
    <path class="letter-v" d="${vD}" fill="url(#ve-letter)"/>
    <path class="letter-e" d="${eD}" fill="url(#ve-letter)"/>
    <path class="letter-v" d="${vD}" fill="url(#ve-letter-shade)" opacity="0.55"/>
    <path class="letter-e" d="${eD}" fill="url(#ve-letter-shade)" opacity="0.55"/>
  </g>
</svg>
`;
}

function reactMark({ vD, eD }) {
  return `/**
 * VouchEdge brand mark — enamel shield + bone VE on graphite ink.
 * Mirrors /public/brand/vouchedge-mark.svg
 */
import React from 'react';

export type VouchEdgeMarkProps = {
  size?: number | string;
  className?: string;
  variant?: 'boot' | 'idle' | 'static';
  title?: string;
};

const SHIELD_D =
  'M512 168 C602 168 718 222 760 274 V530 C760 668 652 798 512 868 C372 798 264 668 264 530 V274 C306 222 422 168 512 168 Z';

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
      data-material="enamel"
      data-palette="ink-desk"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="veMarkPlate" x1="180" y1="0" x2="860" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A2330" />
          <stop offset="42%" stopColor="#121820" />
          <stop offset="100%" stopColor="#0B1016" />
        </linearGradient>
        <linearGradient id="veMarkPlateSheen" x1="200" y1="80" x2="820" y2="900" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2A3A48" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#2A3A48" stopOpacity="0" />
          <stop offset="100%" stopColor="#0E3D38" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id="veMarkGlow" cx="48%" cy="40%" r="52%">
          <stop offset="0%" stopColor="#2A9D8F" stopOpacity="0.10" />
          <stop offset="55%" stopColor="#1B4332" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0B1016" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="veMarkShieldFill" x1="512" y1="170" x2="520" y2="860" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1F6F66" />
          <stop offset="38%" stopColor="#145A52" />
          <stop offset="72%" stopColor="#0E3F3A" />
          <stop offset="100%" stopColor="#0A2E2B" />
        </linearGradient>
        <linearGradient id="veMarkShieldInner" x1="400" y1="220" x2="640" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.16" />
          <stop offset="45%" stopColor="#2A9D8F" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#041F1C" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="veMarkStroke" x1="280" y1="160" x2="740" y2="860" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E7F6F2" />
          <stop offset="28%" stopColor="#9BD5C8" />
          <stop offset="62%" stopColor="#4FA896" />
          <stop offset="100%" stopColor="#2F6F63" />
        </linearGradient>
        <linearGradient id="veMarkLetter" x1="360" y1="400" x2="680" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF8EF" />
          <stop offset="48%" stopColor="#F0E6D6" />
          <stop offset="100%" stopColor="#C9DED7" />
        </linearGradient>
        <linearGradient id="veMarkLetterShade" x1="512" y1="410" x2="512" y2="590" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0A2E2B" stopOpacity="0.18" />
        </linearGradient>
        <filter id="veMarkGrain" x="-10%" y="-10%" width="120%" height="120%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.85  0 0 0 0 0.9  0 0 0 0 0.88  0 0 0 0.055 0"
            in="n"
            result="g"
          />
          <feBlend in="SourceGraphic" in2="g" mode="overlay" />
        </filter>
        <filter id="veMarkLetterDepth" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.2" floodColor="#041F1C" floodOpacity="0.45" />
        </filter>
        <clipPath id="veMarkShieldClip">
          <path d={SHIELD_D} />
        </clipPath>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlate)" className="ve-mark-tile" />
      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlateSheen)" />
      <rect
        width="1024"
        height="1024"
        rx="224"
        fill="url(#veMarkPlate)"
        filter="url(#veMarkGrain)"
        opacity="0.55"
        className="ve-mark-grain"
      />
      <ellipse cx="512" cy="455" rx="310" ry="280" fill="url(#veMarkGlow)" className="ve-mark-glow" />

      <path
        className="ve-mark-shield"
        d={SHIELD_D}
        fill="url(#veMarkShieldFill)"
        stroke="url(#veMarkStroke)"
        strokeWidth="30"
        strokeLinejoin="round"
      />
      <g clipPath="url(#veMarkShieldClip)">
        <path d={SHIELD_D} fill="url(#veMarkShieldInner)" />
        <ellipse cx="512" cy="250" rx="168" ry="54" fill="#E7F6F2" opacity="0.10" />
      </g>

      <g
        className="ve-mark-letters ve-mark-identity ve-mark-optical"
        aria-label="VE"
        filter="url(#veMarkLetterDepth)"
      >
        <path className="letter-v" d="${vD}" fill="url(#veMarkLetter)" />
        <path className="letter-e" d="${eD}" fill="url(#veMarkLetter)" />
        <path className="letter-v" d="${vD}" fill="url(#veMarkLetterShade)" opacity="0.55" />
        <path className="letter-e" d="${eD}" fill="url(#veMarkLetterShade)" opacity="0.55" />
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
