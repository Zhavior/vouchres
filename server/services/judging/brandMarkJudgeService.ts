/**
 * Brand Mark Judge panel — strict craft bar for the VouchEdge app icon.
 * Core: trust shield + VE monogram. No sportsbook clichés.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { clamp } from "../intelligence/scoring";
import type { SubJudgeResult } from "./judgeTypes";

export type BrandMarkCandidate = {
  svg: string;
  assets?: {
    png4k?: string;
    png1024?: string;
    preview48?: string;
  };
};

export type BrandMarkVerdict = {
  finalScore: number;
  approvalStatus: "Approved" | "Playable but risky" | "Needs more work" | "Avoid";
  confidence: "Strong" | "Moderate" | "Speculative";
  judges: SubJudgeResult[];
  judgeNotes: string[];
  whatCouldGoWrong: string[];
  marketingRead: string;
  craftScore: number;
};

export const CRAFT_APPROVE_MIN = 85;
export const FINAL_APPROVE_MIN = 90;
export const CORE_APPROVE_MIN = 85;

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

function shieldStrokeWidth(svg: string): number | null {
  const block = svg.match(/class="ve-mark-shield"[\s\S]{0,400}?stroke-width="(\d+(?:\.\d+)?)"/i);
  if (block) return Number(block[1]);
  return null;
}

function maxGlowOpacity(svg: string): number | null {
  const glowBlock = svg.match(/id="ve-glow"[\s\S]{0,400}?<\/radialGradient>/i)?.[0] ?? "";
  const opacities = [...glowBlock.matchAll(/stop-opacity="([\d.]+)"/gi)].map((m) => Number(m[1]));
  if (!opacities.length) return null;
  return Math.max(...opacities);
}

export function judgeBrandSilhouette(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 50;

  if (has(svg, /ve-mark-shield/i)) {
    score += 10;
    notes.push("Shield silhouette present");
  } else {
    score -= 18;
    flags.push("No shield silhouette class");
  }

  const stroke = shieldStrokeWidth(svg);
  if (stroke != null) {
    if (stroke >= 28 && stroke <= 36) {
      score += 12;
      notes.push(`Shield stroke ${stroke} — refined (28–36 craft band)`);
    } else if (stroke > 36 && stroke <= 40) {
      score += 2;
      flags.push(`Shield stroke ${stroke} is heavy — prefer ≤36`);
    } else if (stroke > 40) {
      score -= 14;
      flags.push(`Shield stroke ${stroke} is chunky / low-craft`);
    }
  } else {
    flags.push("Could not read shield stroke-width");
  }

  const glow = maxGlowOpacity(svg);
  if (glow != null) {
    if (glow <= 0.18) {
      score += 10;
      notes.push(`Glow opacity ${glow} — restrained (premium)`);
    } else if (glow <= 0.25) {
      score += 2;
      flags.push(`Glow opacity ${glow} is loud — target ≤0.18`);
    } else {
      score -= 16;
      flags.push(`Glow opacity ${glow} looks like cheap neon security`);
    }
  }

  const pathCount = (svg.match(/<path\b/gi) ?? []).length;
  if (pathCount >= 2 && pathCount <= 8) {
    score += 6;
    notes.push(`Path budget ${pathCount} — clean`);
  } else if (pathCount > 12) {
    score -= 10;
    flags.push(`Path budget ${pathCount} — muddy at 48px`);
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Silhouette craft ${score}/100`);
  return { judge: "SilhouetteJudge", score, notes, flags };
}

/** Core mark Judge — VE letters inside shield. */
export function judgeBrandCore(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 35;

  const hasLetters = has(svg, /ve-mark-letters/i);
  const hasV = has(svg, /letter-v/i);
  const hasE = has(svg, /letter-e(?!-edge)/i);

  if (hasLetters && hasV && hasE) {
    score += 30;
    notes.push("VE letter lockup present (V + E)");
  } else {
    score -= 22;
    flags.push("Missing VE monogram — icon must read as VouchEdge");
  }

  if (has(svg, /filled-type|letter-style="filled-type"|data-letter-font=/i)) {
    score += 10;
    notes.push("Filled type lockup (font-outlined)");
  } else if (has(svg, /ve-mark-starwars|starwars-outline|letter-style="starwars/i)) {
    score -= 10;
    flags.push("Stroke-outline VE — looks broken at App Store sizes; use filled type");
  }

  if (has(svg, /ve-mark-optical/i)) {
    score += 8;
    notes.push("Optical lockup class present");
  }

  const margin = metaInt(svg, "optical-margin") ?? metaInt(svg, "margin");
  if (margin != null && margin >= 80) {
    score += 10;
    notes.push(`Shield margin ${margin} — letters not kissing the rim`);
  } else {
    score -= 6;
    flags.push("Tight or missing shield margin around letters");
  }

  const maxX = metaInt(svg, "optical-max-x") ?? metaInt(svg, "max-x");
  if (maxX != null && maxX <= 740) {
    score += 8;
    notes.push(`Letter max-x ${maxX} — stays inside shield body`);
  } else if (maxX != null) {
    score -= 8;
    flags.push(`Letter max-x ${maxX} may clip shield tip / rim`);
  }

  // Check-only marks are the old brief — letters are required now
  if (has(svg, /ve-mark-check|mark-check|markCore=check|data-mark-core="check"/i) && !hasLetters) {
    score -= 16;
    flags.push("Check-only mark — restore VE letters for current brief");
  }

  if (has(svg, /letter-e-edge|ve-mark-facet/i)) {
    score -= 12;
    flags.push("Gimmick facet still present");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Core mark (VE) ${score}/100`);
  return { judge: "CoreMarkJudge", score, notes, flags };
}

export function judgeBrandCraft(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 40;

  const level = metaInt(svg, "craft-level") ?? metaInt(svg, "level");
  if (level != null && level >= 2) {
    score += 18;
    notes.push(`Craft level ${level} declared (≥2 required for approve)`);
  } else {
    score -= 20;
    flags.push("Craft level <2 or missing — not approve-ready");
  }

  if (has(svg, /data-no-gimmick="1"|noGimmick=1/i)) {
    score += 10;
    notes.push("No-gimmick craft flag set");
  } else {
    score -= 8;
    flags.push("Missing no-gimmick craft flag");
  }

  if (has(svg, /markCore=ve|data-mark-core="ve"/i)) {
    score += 12;
    notes.push("Mark core declared: ve");
  } else {
    score -= 10;
    flags.push("Mark core not declared as ve");
  }

  if (has(svg, /ve-mark-letters/i) && has(svg, /ve-mark-shield/i)) {
    score += 8;
    notes.push("Shield + VE system present");
  }

  if (has(svg, /data-material="enamel"|material=enamel/i) && has(svg, /data-texture="grain"|feTurbulence/i)) {
    score += 8;
    notes.push("Enamel + grain material system declared");
  }

  if (has(svg, /feGaussianBlur[^>]*stdDeviation="([3-9]|[1-9]\d)/i)) {
    score -= 12;
    flags.push("Heavy blur filter — softens mark into mush at small sizes");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Craft standard ${score}/100`);
  return { judge: "CraftJudge", score, notes, flags };
}

export function judgeBrandTrustCues(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 62;

  const hasInkDesk =
    has(svg, /#0B1016|#121820|#1A2330|#0A2E2B|#145A52|#1F6F66|#2A9D8F/i) &&
    has(svg, /#F0E6D6|#FFF8EF|#E7F6F2|#F5F0E6/i);
  const hasLegacyNeon = has(svg, /#00E5FF/i) && has(svg, /stop-opacity="0\.(1[4-9]|[2-9])/i);

  if (hasInkDesk || has(svg, /data-palette="ink-desk"|palette=ink-desk/i)) {
    score += 12;
    notes.push("Ink-desk enamel palette (graphite + sea-glass + bone)");
  } else if (has(svg, /#00E5FF|#22D3EE|#2DD4BF|#67E8F9|#A5F3FC/i) && has(svg, /#020617|#06101C/i)) {
    score += 4;
    flags.push("Legacy neon-cyber palette — prefer ink-desk enamel");
  } else {
    score -= 14;
    flags.push("Brand palette incomplete");
  }

  if (has(svg, /data-material="enamel"|material=enamel|ve-grain|feTurbulence/i)) {
    score += 8;
    notes.push("Material texture present (enamel / grain)");
  }

  if (has(svg, /dice|chip|dollar|sportsbook|betting|🎰/i)) {
    score -= 40;
    flags.push("Sportsbook cue — hard fail");
  } else {
    score += 6;
    notes.push("No sportsbook clichés");
  }

  if (has(svg, /ve-mark-letters|letter-v|VouchEdge|aria-label="VE"/i)) {
    score += 6;
    notes.push("Letter identity reads as VouchEdge");
  }

  const glow = maxGlowOpacity(svg);
  if (glow != null && glow > 0.22) {
    score -= 14;
    flags.push("Over-glow reads as generic cyber-security template");
  } else if (hasLegacyNeon) {
    score -= 10;
    flags.push("Neon #00E5FF wash — AI-default look");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Trust cue ${score}/100`);
  return { judge: "TrustCueJudge", score, notes, flags };
}

export function judgeBrandMarketFit(candidate: BrandMarkCandidate): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 55;
  const { svg, assets } = candidate;

  if (has(svg, /viewBox="0 0 1024 1024"/)) {
    score += 6;
    notes.push("Vector master viewBox locked");
  }

  if (assets?.png4k && existsSync(assets.png4k)) {
    score += 10;
    notes.push("4K PNG on disk");
  } else {
    score -= 12;
    flags.push("Missing 4K PNG");
  }

  if (assets?.preview48 && existsSync(assets.preview48)) {
    score += 8;
    notes.push("48px preview on disk");
  } else {
    flags.push("Missing 48px preview");
  }

  if (has(svg, /ve-mark-letters/i) && has(svg, /ve-mark-shield/i)) {
    score += 12;
    notes.push("Shield + VE — marketable monogram system");
  } else {
    score -= 8;
    flags.push("Lockup incomplete for marketing system");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Market fit ${score}/100`);
  return { judge: "MarketFitJudge", score, notes, flags };
}

function approval(
  final: number,
  coreScore: number,
  craftScore: number,
): BrandMarkVerdict["approvalStatus"] {
  if (craftScore < 70 || coreScore < 70) return "Needs more work";
  if (final >= FINAL_APPROVE_MIN && coreScore >= CORE_APPROVE_MIN && craftScore >= CRAFT_APPROVE_MIN) {
    return "Approved";
  }
  if (final >= 80 && craftScore >= 75) return "Playable but risky";
  if (final < 50) return "Avoid";
  return "Needs more work";
}

export function runBrandMarkJudgePanel(candidate: BrandMarkCandidate): BrandMarkVerdict {
  const silhouette = judgeBrandSilhouette(candidate.svg);
  const core = judgeBrandCore(candidate.svg);
  const craft = judgeBrandCraft(candidate.svg);
  const trust = judgeBrandTrustCues(candidate.svg);
  const market = judgeBrandMarketFit(candidate);

  const judges = [craft, core, silhouette, trust, market];
  const finalScore = clamp(
    Math.round(
      craft.score * 0.28 +
        core.score * 0.3 +
        silhouette.score * 0.18 +
        trust.score * 0.12 +
        market.score * 0.12,
    ),
    1,
    100,
  );

  const whatCouldGoWrong = judges.flatMap((j) => j.flags);
  const judgeNotes = judges.flatMap((j) => j.notes.slice(0, 2));

  const marketingRead =
    craft.score >= CRAFT_APPROVE_MIN && core.score >= CORE_APPROVE_MIN
      ? "First glance: VE. Second: trust shield. Brand learn: VouchEdge."
      : "Below craft bar — do not ship. Fix VE / shield / clutter before approve.";

  return {
    finalScore,
    craftScore: craft.score,
    approvalStatus: approval(finalScore, core.score, craft.score),
    confidence:
      finalScore >= 90 && craft.score >= CRAFT_APPROVE_MIN ? "Strong" : finalScore >= 80 ? "Moderate" : "Speculative",
    judges,
    judgeNotes,
    whatCouldGoWrong,
    marketingRead,
  };
}

export function judgeRepoBrandMark(root = process.cwd()): BrandMarkVerdict {
  const svgPath = resolve(root, "public/brand/vouchedge-mark.svg");
  const svg = readFileSync(svgPath, "utf8");
  return runBrandMarkJudgePanel({
    svg,
    assets: {
      png4k: resolve(root, "public/brand/vouchedge-4k.png"),
      png1024: resolve(root, "public/brand/vouchedge-1024.png"),
      preview48: resolve(root, "public/brand/previews/vouchedge-48.png"),
    },
  });
}

/** @deprecated use judgeBrandCore */
export function judgeBrandLetters(svg: string): SubJudgeResult {
  return judgeBrandCore(svg);
}
