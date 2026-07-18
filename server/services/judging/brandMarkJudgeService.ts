/**
 * Brand Mark Judge panel — strict craft bar for the VouchEdge app icon.
 * Core: trust shield + verification check (vouch). No sportsbook clichés.
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

/** Core mark Judge — verification check inside shield (vouch). */
export function judgeBrandCore(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 35;

  const hasCheck =
    has(svg, /ve-mark-check|mark-check|markCore=check|data-mark-core="check"/i) &&
    has(svg, /M340\s+500|L460\s+640|check/i);

  if (has(svg, /ve-mark-check|mark-check/i)) {
    score += 28;
    notes.push("Verification check mark present");
  } else {
    score -= 22;
    flags.push("Missing check mark — icon must vouch / verify");
  }

  if (has(svg, /stroke-linecap="round"/i) && hasCheck) {
    score += 10;
    notes.push("Rounded check stroke — clean at small sizes");
  }

  if (has(svg, /ve-mark-optical/i)) {
    score += 8;
    notes.push("Optical lockup class present");
  }

  const margin = metaInt(svg, "optical-margin") ?? metaInt(svg, "margin");
  if (margin != null && margin >= 80) {
    score += 10;
    notes.push(`Shield margin ${margin} — check not kissing the rim`);
  } else {
    score -= 6;
    flags.push("Tight or missing shield margin around check");
  }

  // Letters inside icon are no longer the brief
  if (has(svg, /ve-mark-letters|letter-v|letter-e|starwars/i)) {
    score -= 16;
    flags.push("Legacy VE letters still in mark — remove for check-core brief");
  } else {
    score += 10;
    notes.push("No VE letter clutter in icon");
  }

  if (has(svg, /letter-e-edge|ve-mark-facet/i)) {
    score -= 12;
    flags.push("Gimmick facet still present");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Core mark (check) ${score}/100`);
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

  if (has(svg, /markCore=check|data-mark-core="check"/i)) {
    score += 12;
    notes.push("Mark core declared: check");
  } else {
    score -= 10;
    flags.push("Mark core not declared as check");
  }

  if (has(svg, /ve-mark-check/i) && has(svg, /ve-mark-shield/i)) {
    score += 10;
    notes.push("Shield + check system present");
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

  if (has(svg, /#00E5FF|#22D3EE|#2DD4BF|#67E8F9/i) && has(svg, /#020617|#06101C/i)) {
    score += 10;
    notes.push("Brand palette present");
  } else {
    score -= 14;
    flags.push("Brand palette incomplete");
  }

  if (has(svg, /dice|chip|dollar|sportsbook|betting|🎰/i)) {
    score -= 40;
    flags.push("Sportsbook cue — hard fail");
  } else {
    score += 8;
    notes.push("No sportsbook clichés");
  }

  if (has(svg, /check|verif|vouch/i)) {
    score += 8;
    notes.push("Verification / vouch language in mark");
  }

  const glow = maxGlowOpacity(svg);
  if (glow != null && glow > 0.28) {
    score -= 12;
    flags.push("Over-glow reads as generic cyber-security template");
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

  if (has(svg, /ve-mark-check/i) && has(svg, /ve-mark-shield/i)) {
    score += 12;
    notes.push("Shield + check — marketable vouch system");
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
      ? "First glance: verified check. Second: trust shield. Brand learn: VouchEdge."
      : "Below craft bar — do not ship. Fix check / shield / clutter before approve.";

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

/** @deprecated use judgeBrandCore — kept for older imports */
export function judgeBrandLetters(svg: string): SubJudgeResult {
  return judgeBrandCore(svg);
}
