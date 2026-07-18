/**
 * Brand Craft Market Agent (BC) — market-graphics bar for VouchEdge icons.
 *
 * Research basis (2025–2026 store reality):
 * - Apple Liquid Glass / Icon Composer: ≤4 layer groups; silhouette survives
 *   Clear/Tinted/Mono; prefer flat source layers; white foreground for mono.
 * - App Store practice: one idea @ ~40–60px; high contrast; no baked shadows
 *   that fight the system mask.
 * - Google Play: full-bleed square, no pre-rounded corners / baked shadows.
 * - Sports product systems (e.g. FanDuel iconography): consistent stem weight,
 *   grid, detail budget for smallest size — not illustration soup.
 *
 * This agent is NOT Brand Mark Judge. BM checks craft flags.
 * BC asks: “Would this survive next to market icons on a home screen?”
 * It CANNOT auto-ship — human veto is required for marketReady.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { clamp } from "../intelligence/scoring";
import type { SubJudgeResult } from "./judgeTypes";

export type MarketShipStatus =
  | "Market-candidate" // high score — still needs human ship
  | "Workshop" // promising, not home-screen ready
  | "AI-cliché" // template tells dominate
  | "Reject"; // hard fail

export type BrandCraftMarketVerdict = {
  finalScore: number;
  marketShipStatus: MarketShipStatus;
  /** Always false unless explicitly forced — production brand needs a human. */
  marketReady: false;
  humanVetoRequired: true;
  confidence: "Strong" | "Moderate" | "Speculative";
  judges: SubJudgeResult[];
  marketBar: string[];
  killList: string[];
  letterBrief: string[];
  nextActions: string[];
  researchNotes: string[];
};

function has(svg: string, re: RegExp): boolean {
  return re.test(svg);
}

function metaInt(svg: string, key: string): number | null {
  const attr = svg.match(new RegExp(`data-${key}="(\\d+)"`, "i"));
  if (attr) return Number(attr[1]);
  const comment = svg.match(new RegExp(`${key}=(\\d+)`, "i"));
  if (comment) return Number(comment[1]);
  return null;
}

function pathCount(svg: string): number {
  return (svg.match(/<path\b/gi) ?? []).length;
}

function maxNamedGlow(svg: string, id: string): number | null {
  const block = svg.match(new RegExp(`id="${id}"[\\s\\S]{0,500}?<\\/radialGradient>`, "i"))?.[0] ?? "";
  const opacities = [...block.matchAll(/stop-opacity="([\d.]+)"/gi)].map((m) => Number(m[1]));
  if (!opacities.length) return null;
  return Math.max(...opacities);
}

/** Silhouette @ thumbnail — market icons live or die at ~48px. */
export function judgeMarketSilhouette(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 42;

  const hasShield = has(svg, /ve-mark-shield/i);
  const hasLetters = has(svg, /ve-mark-letters|letter-v/i);
  const hasCheck = has(svg, /ve-mark-check|mark-check/i);

  const cores = [hasShield, hasLetters, hasCheck].filter(Boolean).length;
  if (cores === 1 || (hasShield && (hasLetters || hasCheck) && cores <= 2)) {
    score += 18;
    notes.push("One primary mark system (shield + identity) — market silhouette budget");
  } else if (cores >= 3) {
    score -= 14;
    flags.push("Too many competing cores — fails 40–60px silhouette test");
  } else {
    score -= 16;
    flags.push("No clear primary silhouette");
  }

  const paths = pathCount(svg);
  if (paths <= 6) {
    score += 14;
    notes.push(`Path budget ${paths} — survives thumbnail`);
  } else if (paths <= 10) {
    score += 4;
    flags.push(`Path budget ${paths} — borderline for 48px`);
  } else {
    score -= 16;
    flags.push(`Path budget ${paths} — muddy at store grid`);
  }

  // Liquid Glass / mono: need a near-white identity layer
  if (has(svg, /#FFFFFF|#F8FAFC|#FFF8EF|#F0E6D6/i)) {
    score += 12;
    notes.push("Near-white identity layer — mono/clear mode survivable");
  } else {
    score -= 18;
    flags.push("No white/bone identity — fails Apple Clear/Tinted/Mono bar");
  }

  const margin = metaInt(svg, "optical-margin");
  if (margin != null && margin >= 80) {
    score += 8;
    notes.push(`Optical margin ${margin} — mark not kissing mask`);
  } else {
    flags.push("Tight optical margin — store masks will clip");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Market silhouette ${score}/100`);
  return { judge: "MarketSilhouetteJudge", score, notes, flags };
}

/** Letter construction — stems, tracking, counters. Not “font dump in a badge”. */
export function judgeLetterConstruction(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 38;

  const hasV = has(svg, /letter-v/i);
  const hasE = has(svg, /letter-e(?!-edge)/i);
  if (hasV && hasE) {
    score += 16;
    notes.push("V + E glyph classes present");
  } else {
    score -= 22;
    flags.push("Missing constructed VE glyphs");
  }

  const tracking = metaInt(svg, "optical-gap") ?? metaInt(svg, "tracking");
  const letterH = metaInt(svg, "optical-letter-height");
  const maxX = metaInt(svg, "optical-max-x");

  if (tracking != null && tracking >= 8) {
    score += 12;
    notes.push(`Optical gap/tracking ${tracking} — letters not fused`);
  } else if (has(svg, /tracking:\s*1[4-9]|tracking:\s*[2-9]\d/i)) {
    score += 8;
    notes.push("Positive tracking declared in bake script");
  } else {
    score -= 10;
    flags.push("No positive optical gap — fused VE is an AI tell");
  }

  if (letterH != null && letterH >= 120 && letterH <= 280) {
    score += 10;
    notes.push(`Letter height ${letterH} — proportioned for shield body`);
  } else if (letterH != null) {
    flags.push(`Letter height ${letterH} outside market band (120–280)`);
  }

  if (maxX != null && maxX <= 720) {
    score += 8;
    notes.push(`Letter max-x ${maxX} — inside safe zone`);
  }

  // Custom construction beats raw font dump when optical meta is declared
  if (has(svg, /data-letter-style="filled-type"|letterStyle=filled-type/i) && tracking != null) {
    score += 8;
    notes.push("Filled type with optical metadata");
  }

  if (has(svg, /Orbitron|Syncopate|Michroma/i) && !(tracking != null && tracking >= 10)) {
    score -= 8;
    flags.push("Geometric display font without optical re-kern — often reads as template");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Letter construction ${score}/100`);
  return { judge: "LetterConstructionJudge", score, notes, flags };
}

/** Kill AI / template graphics that never make premium store grids. */
export function judgeAntiCliche(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 70;

  const nightCityTemplate =
    has(svg, /#2B1F54|#1A1035|#C026D3/i) &&
    has(svg, /#22D3EE|#67E8F9/i) &&
    has(svg, /feDropShadow[^>]*flood-color="#22D3EE"/i);

  if (nightCityTemplate) {
    score -= 28;
    flags.push("Night-city template (violet plate + cyan bloom + magenta haze) — common AI stack");
  } else {
    score += 8;
    notes.push("Not the stock violet/cyan/magenta AI stack");
  }

  const glow = maxNamedGlow(svg, "ve-glow");
  if (glow != null && glow > 0.2) {
    score -= 16;
    flags.push(`Atmosphere glow ${glow} > 0.20 — neon security / cyber cliché`);
  } else if (glow != null && glow <= 0.12) {
    score += 8;
    notes.push("Atmosphere wash restrained");
  }

  if (has(svg, /feDropShadow[^>]*stdDeviation="([4-9]|[1-9]\d)/i)) {
    score -= 14;
    flags.push("Heavy drop-shadow bloom — fights Liquid Glass / Play shadows");
  }

  if (has(svg, /dice|chip|dollar|sportsbook|betting|🎰|parlay/i)) {
    score -= 40;
    flags.push("Sportsbook cue — hard market fail for VouchEdge");
  } else {
    score += 6;
    notes.push("No sportsbook clichés");
  }

  // Baked rounded tile is OK for our master (we ship squircle PNGs) but note Play prefers unmasked
  if (has(svg, /rx="224"/) && has(svg, /viewBox="0 0 1024 1024"/)) {
    notes.push("Master uses rounded tile — keep a square export for Play keyline");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Anti-cliché ${score}/100`);
  return { judge: "AntiClicheJudge", score, notes, flags };
}

/** Layer / material discipline for 2026 store renderers. */
export function judgeLayerDiscipline(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 48;

  const hasMaterial = has(svg, /data-material=/i);
  const hasPalette = has(svg, /data-palette=/i);
  const hasTexture = has(svg, /data-texture=|feTurbulence/i);

  if (hasMaterial && hasPalette) {
    score += 10;
    notes.push("Material + palette declared");
  }

  // Prefer ≤4 conceptual layers: plate, atmosphere, shield, letters
  const layerHints = [
    /ve-mark-tile|ve-plate/i.test(svg),
    /ve-mark-glow|ve-haze|ve-amber/i.test(svg),
    /ve-mark-shield/i.test(svg),
    /ve-mark-letters|ve-mark-check/i.test(svg),
  ].filter(Boolean).length;

  if (layerHints >= 2 && layerHints <= 4) {
    score += 16;
    notes.push(`${layerHints} conceptual layers — inside Icon Composer 1–4 group bar`);
  } else if (layerHints > 4) {
    score -= 10;
    flags.push(`${layerHints} layer concepts — over Apple’s ~4 group guidance`);
  }

  if (hasTexture && has(svg, /baseFrequency="(0\.\d|[1-9])/i)) {
    // Fine grain OK; loud fractal = AI grit
    if (has(svg, /opacity="0\.[3-9]|opacity="0\.5"/i) && has(svg, /feTurbulence/i)) {
      score -= 6;
      flags.push("Grain overlay may read as AI noise at 48px — keep subtler");
    } else {
      score += 6;
      notes.push("Texture present at restrained level");
    }
  }

  if (has(svg, /data-no-gimmick="1"|noGimmick=1/i)) {
    score += 8;
    notes.push("No-gimmick craft flag");
  }

  // Flat-ish fills beat fake liquid glass double-treatment
  if (has(svg, /feSpecularLighting|feGaussianBlur[^>]*stdDeviation="([5-9]|[1-9]\d)/i)) {
    score -= 12;
    flags.push("Baked lighting/blur will fight system Liquid Glass");
  } else {
    score += 8;
    notes.push("No heavy baked lighting filters");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Layer discipline ${score}/100`);
  return { judge: "LayerDisciplineJudge", score, notes, flags };
}

/** Evidence on disk — market work ships size ladders. */
export function judgeMarketEvidence(root: string, svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 50;

  const files = {
    preview48: resolve(root, "public/brand/previews/vouchedge-48.png"),
    preview128: resolve(root, "public/brand/previews/vouchedge-128.png"),
    png1024: resolve(root, "public/brand/vouchedge-1024.png"),
    png4k: resolve(root, "public/brand/vouchedge-4k.png"),
  };

  let present = 0;
  for (const [k, p] of Object.entries(files)) {
    if (existsSync(p)) {
      present += 1;
      notes.push(`${k} on disk`);
    } else {
      flags.push(`Missing ${k}`);
    }
  }
  score += present * 8;

  if (has(svg, /viewBox="0 0 1024 1024"/)) {
    score += 6;
    notes.push("1024 vector master locked");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Market evidence ${score}/100`);
  return { judge: "MarketEvidenceJudge", score, notes, flags };
}

function shipStatus(final: number, cliche: number, silhouette: number): MarketShipStatus {
  if (cliche < 45 || silhouette < 50) return "Reject";
  if (cliche < 60) return "AI-cliché";
  if (final >= 88 && silhouette >= 80 && cliche >= 72) return "Market-candidate";
  return "Workshop";
}

export function runBrandCraftMarketPanel(
  svg: string,
  root = process.cwd(),
): BrandCraftMarketVerdict {
  const silhouette = judgeMarketSilhouette(svg);
  const letters = judgeLetterConstruction(svg);
  const cliche = judgeAntiCliche(svg);
  const layers = judgeLayerDiscipline(svg);
  const evidence = judgeMarketEvidence(root, svg);

  const judges = [silhouette, letters, cliche, layers, evidence];
  const finalScore = clamp(
    Math.round(
      silhouette.score * 0.28 +
        letters.score * 0.26 +
        cliche.score * 0.22 +
        layers.score * 0.14 +
        evidence.score * 0.1,
    ),
    1,
    100,
  );

  const killList = judges.flatMap((j) => j.flags);
  const marketBar = [
    "One silhouette readable at ~48px (Apple/Google store grid)",
    "Near-white identity for Clear / Tinted / Mono",
    "≤4 conceptual layers (Icon Composer group bar)",
    "No sportsbook cues; no neon-cyber AI stack",
    "Optical letter gap — VE never fused",
    "Human ship required — agent cannot auto-approve market",
  ];

  const letterBrief = [
    "Build V/E on a stem grid before color",
    "Declare optical-gap ≥ 8 (tracking) and optical-margin ≥ 80",
    "Prefer custom path construction over raw display-font dump",
    "Proof at 48 / 128 / 1024 before claiming market parity",
  ];

  const nextActions: string[] = [];
  if (killList.some((k) => /night-city|neon|AI/i.test(k))) {
    nextActions.push("Replace violet/cyan/magenta AI stack with a distinctive 2–3 color system");
  }
  if (killList.some((k) => /fused|tracking|gap/i.test(k))) {
    nextActions.push("Re-kern VE with optical gap ≥ 10; redraw E counters");
  }
  if (killList.some((k) => /white|mono/i.test(k))) {
    nextActions.push("Add a pure-white foreground identity layer for mono modes");
  }
  if (killList.some((k) => /shadow|bloom|Lighting/i.test(k))) {
    nextActions.push("Strip baked bloom; keep flat vectors for Liquid Glass");
  }
  if (!nextActions.length) {
    nextActions.push("Present 48px crop next to 3 reference App Store icons for human ship");
  }

  const status = shipStatus(finalScore, cliche.score, silhouette.score);

  return {
    finalScore,
    marketShipStatus: status,
    marketReady: false,
    humanVetoRequired: true,
    confidence:
      finalScore >= 88 && status === "Market-candidate"
        ? "Strong"
        : finalScore >= 70
          ? "Moderate"
          : "Speculative",
    judges,
    marketBar,
    killList,
    letterBrief,
    nextActions,
    researchNotes: [
      "Apple WWDC25 Icon Composer: layered glass; Clear/Tinted discard palette — shape wins",
      "Design for ~40–60px first; detail is a privilege of 1024",
      "Google Play: square full-bleed, no pre-baked corners/shadows in listing asset",
      "Sports systems emphasize consistent stem weight + smallest-size budget",
    ],
  };
}

export function judgeRepoBrandCraftMarket(root = process.cwd()): BrandCraftMarketVerdict {
  const svg = readFileSync(resolve(root, "public/brand/vouchedge-mark.svg"), "utf8");
  return runBrandCraftMarketPanel(svg, root);
}

/** Agent plugin meta for catalog / dock. */
export const BRAND_CRAFT_MARKET_META = {
  id: "brand_craft_market",
  name: "Brand Craft Market Agent",
  code: "BC",
  lane: "brand" as const,
  tagline:
    "Market-graphics bar — silhouette, letter construction, anti-cliché. Cannot auto-ship.",
  specialty: "App Store / Play icon parity · letter geometry · human veto",
  color: "purple" as const,
  builtin: true,
  endpoint: "GET /api/judge/brand-craft",
};
