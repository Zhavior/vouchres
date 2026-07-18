/**
 * Brand Mark Judge panel — strict craft bar for the VouchEdge app icon.
 * Presence alone is not enough: optical lockup, restrained effects, no gimmicks.
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
  /** Hard gate — Approved requires craftScore >= CRAFT_APPROVE_MIN */
  craftScore: number;
};

/** Approved only if craft clears this (raised bar). */
export const CRAFT_APPROVE_MIN = 85;
export const FINAL_APPROVE_MIN = 90;
export const LETTER_APPROVE_MIN = 85;

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
  const m = svg.match(/ve-mark-shield[\s\S]{0,280}?stroke-width="(\d+(?:\.\d+)?)"/i)
    || svg.match(/class="ve-mark-shield"[^>]*stroke-width="(\d+(?:\.\d+)?)"/i)
    || svg.match(/stroke-width="(\d+(?:\.\d+)?)"[^>]*class="[^"]*ve-mark-shield/i);
  // Prefer the stroke near the shield path
  const block = svg.match(/class="ve-mark-shield"[\s\S]{0,400}?stroke-width="(\d+(?:\.\d+)?)"/i);
  if (block) return Number(block[1]);
  if (m) return Number(m[1]);
  return null;
}

function maxGlowOpacity(svg: string): number | null {
  const glowBlock = svg.match(/id="ve-glow"[\s\S]{0,400}?<\/radialGradient>/i)?.[0] ?? "";
  const opacities = [...glowBlock.matchAll(/stop-opacity="([\d.]+)"/gi)].map((m) => Number(m[1]));
  if (!opacities.length) return null;
  return Math.max(...opacities);
}

/** Silhouette Judge — one readable shape; penalize overbuilt neon. */
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
    if (stroke >= 28 && stroke <= 34) {
      score += 12;
      notes.push(`Shield stroke ${stroke} — refined (28–34 craft band)`);
    } else if (stroke > 34 && stroke <= 38) {
      score += 2;
      flags.push(`Shield stroke ${stroke} is heavy — prefer ≤34`);
    } else if (stroke > 38) {
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
  if (pathCount >= 4 && pathCount <= 9) {
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

/** Letter Judge — VE must exist AND be optically locked up. */
export function judgeBrandLetters(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 30;

  const hasLettersGroup = has(svg, /ve-mark-letters/i);
  const hasV = has(svg, /class="[^"]*letter-v/i);
  const hasE = has(svg, /class="[^"]*letter-e/i);
  const optical = has(svg, /ve-mark-optical/i);

  if (hasLettersGroup && hasV && hasE) {
    score += 22;
    notes.push("VE letterform group present");
  } else {
    score -= 20;
    flags.push("Missing VE letterform structure");
  }

  if (optical) {
    score += 12;
    notes.push("Optical lockup class present");
  } else {
    score -= 12;
    flags.push("No optical lockup — letters may be cramped or uneven");
  }

  const height = metaInt(svg, "optical-letter-height") ?? metaInt(svg, "letterHeight");
  const gap = metaInt(svg, "optical-gap") ?? metaInt(svg, "gap");
  const margin = metaInt(svg, "optical-margin") ?? metaInt(svg, "margin");

  if (height != null && height >= 240 && height <= 320) {
    score += 10;
    notes.push(`Letter height ${height} in premium band (240–320)`);
  } else {
    score -= 8;
    flags.push("Letter height missing or outside 240–320 optical band");
  }

  if (gap != null && gap >= 36 && gap <= 64) {
    score += 10;
    notes.push(`Inter-letter gap ${gap} — readable tracking`);
  } else {
    score -= 10;
    flags.push("Gap missing or outside 36–64 — cramped or drifting");
  }

  if (margin != null && margin >= 72) {
    score += 8;
    notes.push(`Shield margin ${margin} — letters not kissing the rim`);
  } else {
    score -= 10;
    flags.push("Insufficient shield margin (<72) — crowded lockup");
  }

  const maxX = metaInt(svg, "optical-max-x") ?? metaInt(svg, "maxX");
  if (maxX != null && maxX <= 720) {
    score += 6;
    notes.push(`Letter max-x ${maxX} — inside shield safe zone`);
  } else if (maxX != null) {
    score -= 14;
    flags.push(`Letter max-x ${maxX} spills past shield safe zone (≤720)`);
  } else {
    score -= 6;
    flags.push("Missing optical max-x — cannot prove letters stay inside shield");
  }

  // Gimmick tips / arrow facets — low craft
  if (has(svg, /letter-e-edge|ve-mark-facet/i)) {
    score -= 18;
    flags.push("Gimmick edge tip on E — looks unfinished / glitchy");
  } else {
    score += 8;
    notes.push("No gimmick tips on letterforms");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Letter craft ${score}/100`);
  return { judge: "LetterJudge", score, notes, flags };
}

/** Craft Judge — hard bar the old rubber-stamp panel lacked. */
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

  if (has(svg, /Optical lockup|ve-mark-optical/i)) {
    score += 10;
    notes.push("Optical lockup documented");
  } else {
    flags.push("Optical lockup not documented");
  }

  // Unified letter fill (one gradient) beats rainbow gimmicks
  const letterFills = (svg.match(/url\(#ve-letter\)/g) ?? []).length;
  if (letterFills >= 3) {
    score += 8;
    notes.push("Unified letter fill system");
  }

  if (has(svg, /feGaussianBlur[^>]*stdDeviation="([3-9]|[1-9]\d)/i)) {
    score -= 12;
    flags.push("Heavy blur filter — softens mark into mush at small sizes");
  }

  if (has(svg, /drop-shadow|box-shadow/i)) {
    score -= 6;
    flags.push("CSS shadow cues in mark source — prefer vector light");
  }

  // Person-in-shield is a prior failed direction when letters are the brief
  if (has(svg, /shoulders|vouch identity/i) && !has(svg, /ve-mark-letters/i)) {
    score -= 15;
    flags.push("Person glyph instead of letters");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Craft standard ${score}/100`);
  return { judge: "CraftJudge", score, notes, flags };
}

/** Trust Cue Judge — research brand, not sportsbook / neon casino. */
export function judgeBrandTrustCues(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 62;

  if (has(svg, /#00E5FF|#22D3EE|#2DD4BF|#7DD3FC/i) && has(svg, /#020617|#06101C/i)) {
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

  const glow = maxGlowOpacity(svg);
  if (glow != null && glow > 0.28) {
    score -= 12;
    flags.push("Over-glow reads as generic cyber-security template");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Trust cue ${score}/100`);
  return { judge: "TrustCueJudge", score, notes, flags };
}

/** Market Fit Judge — assets + brandability (does not inflate craft). */
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

  if (has(svg, /ve-mark-letters/i) && has(svg, /ve-mark-shield/i) && has(svg, /ve-mark-optical/i)) {
    score += 12;
    notes.push("Shield + optical VE lockup — marketable system");
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
  letterScore: number,
  craftScore: number,
): BrandMarkVerdict["approvalStatus"] {
  if (craftScore < 70 || letterScore < 70) return "Needs more work";
  if (final >= FINAL_APPROVE_MIN && letterScore >= LETTER_APPROVE_MIN && craftScore >= CRAFT_APPROVE_MIN) {
    return "Approved";
  }
  if (final >= 80 && craftScore >= 75) return "Playable but risky";
  if (final < 50) return "Avoid";
  return "Needs more work";
}

export function runBrandMarkJudgePanel(candidate: BrandMarkCandidate): BrandMarkVerdict {
  const silhouette = judgeBrandSilhouette(candidate.svg);
  const letters = judgeBrandLetters(candidate.svg);
  const craft = judgeBrandCraft(candidate.svg);
  const trust = judgeBrandTrustCues(candidate.svg);
  const market = judgeBrandMarketFit(candidate);

  const judges = [craft, letters, silhouette, trust, market];
  // Craft + letters dominate — assets alone cannot buy Approval.
  const finalScore = clamp(
    Math.round(
      craft.score * 0.3 +
        letters.score * 0.28 +
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
    craft.score >= CRAFT_APPROVE_MIN && letters.score >= LETTER_APPROVE_MIN
      ? "First glance: clean VE. Second: trust shield. Brand learn: VouchEdge — craft clears bar."
      : "Below craft bar — do not ship. Fix optical lockup / gimmicks / heavy neon before approve.";

  return {
    finalScore,
    craftScore: craft.score,
    approvalStatus: approval(finalScore, letters.score, craft.score),
    confidence: finalScore >= 90 && craft.score >= CRAFT_APPROVE_MIN ? "Strong" : finalScore >= 80 ? "Moderate" : "Speculative",
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
