/**
 * Record the branded splash animation as a short video.
 * Usage: node scripts/playSplashDemo.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = '/opt/cursor/artifacts';
const ROOT = process.cwd();
const svg = readFileSync(resolve(ROOT, 'public/brand/vouchedge-mark.svg'), 'utf8');
const css = readFileSync(resolve(ROOT, 'src/styles/ve-brand-mark.css'), 'utf8');

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  html,body{margin:0;height:100%;background:#020617;color:#fff;
    font-family:ui-sans-serif,system-ui,sans-serif;overflow:hidden}
  ${css}
  .shell{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:24px;text-align:center;position:relative}
  .mark-wrap{margin-bottom:28px;filter:drop-shadow(0 0 48px rgba(0,229,255,.28))}
  .mark-wrap svg{width:120px;height:120px;display:block}
  h1{font-size:28px;font-weight:900;margin:0;opacity:0;animation:fadeUp .6s ease .7s forwards}
  p{color:rgba(255,255,255,.55);margin:8px 0 0;font-size:14px;opacity:0;animation:fadeUp .6s ease .9s forwards}
  .bar{width:260px;margin-top:40px;opacity:0;animation:fadeUp .5s ease 1.05s forwards}
  .meta{display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.4);margin-bottom:8px}
  .track{height:4px;background:rgba(255,255,255,.1);border-radius:999px;overflow:hidden}
  .fill{height:100%;width:0%;background:linear-gradient(90deg,#67e8f9,#6ee7b7);
    animation:progressFill 2.4s cubic-bezier(.16,1,.3,1) 1.1s forwards}
  .pct{color:rgba(165,243,252,.9);font-family:ui-monospace,monospace}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes progressFill{to{width:100%}}
  .phase{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  #hello{opacity:0;pointer-events:none}
  body.phase-hello #boot{opacity:0;transition:opacity .35s ease}
  body.phase-hello #hello{opacity:1;transition:opacity .45s ease .2s}
</style>
</head>
<body>
  <div id="boot" class="shell ve-splash-shell phase" role="status" aria-label="Loading VouchEdge">
    <div class="mark-wrap">${svg.replace('<svg', '<svg class="ve-brand-mark ve-mark-boot"')}</div>
    <h1>VouchEdge</h1>
    <p id="status">Warming research systems…</p>
    <div class="bar">
      <div class="meta"><span id="steps">0/5</span><span class="pct" id="pct">0%</span></div>
      <div class="track"><div class="fill" id="fill"></div></div>
    </div>
  </div>
  <div id="hello" class="shell ve-splash-shell phase" role="status" aria-label="Signing in">
    <div class="mark-wrap">${svg.replace('<svg', '<svg class="ve-brand-mark ve-mark-boot"')}</div>
    <h1>VouchEdge</h1>
    <p>Welcome back — opening your workspace…</p>
  </div>
<script>
  const statuses = [
    'Preparing VouchEdge…',
    'Warming HR board',
    'Syncing judges',
    'Loading today\\'s slate',
    'Ready'
  ];
  const pctEl = document.getElementById('pct');
  const stepsEl = document.getElementById('steps');
  const statusEl = document.getElementById('status');
  let t0 = performance.now();
  function tick(now){
    const elapsed = now - t0;
    const p = Math.min(100, Math.round((elapsed / 2400) * 100));
    pctEl.textContent = p + '%';
    const step = Math.min(5, Math.floor(p / 20) + (p >= 100 ? 0 : 1));
    stepsEl.textContent = Math.min(5, Math.ceil(p / 20)) + '/5';
    statusEl.textContent = statuses[Math.min(statuses.length - 1, Math.floor(p / 25))];
    if (elapsed < 2600) requestAnimationFrame(tick);
    else {
      document.body.classList.add('phase-hello');
      // replay hello mark animation
      const helloSvg = document.querySelector('#hello svg');
      helloSvg.classList.remove('ve-mark-boot');
      void helloSvg.offsetWidth;
      helloSvg.classList.add('ve-mark-boot');
    }
  }
  requestAnimationFrame(tick);
</script>
</body>
</html>`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(resolve(OUT, 'videos'), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: resolve(OUT, 'videos'),
      size: { width: 390, height: 844 },
    },
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  // Boot animation (~2.6s) + hello (~2s)
  await page.waitForTimeout(5200);
  await context.close();
  await browser.close();

  const vids = readdirSync(resolve(OUT, 'videos')).filter((f) => f.endsWith('.webm'));
  vids.sort(
    (a, b) =>
      statSync(resolve(OUT, 'videos', b)).mtimeMs - statSync(resolve(OUT, 'videos', a)).mtimeMs,
  );
  const latest = vids[0];
  if (!latest) throw new Error('No video recorded');
  const dest = resolve(OUT, 'vouchEdge-splash-demo.webm');
  copyFileSync(resolve(OUT, 'videos', latest), dest);
  console.log('wrote', dest);

  // Also grab mid-boot and hello stills from a fresh run without video for sharpness
  const browser2 = await chromium.launch({ headless: true });
  const page2 = await browser2.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await page2.setContent(html, { waitUntil: 'domcontentloaded' });
  await page2.waitForTimeout(1400);
  await page2.screenshot({ path: resolve(OUT, 'screenshots/play-boot-mid.png') });
  await page2.waitForTimeout(2000);
  await page2.screenshot({ path: resolve(OUT, 'screenshots/play-hello.png') });
  await browser2.close();
  console.log('wrote stills');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
