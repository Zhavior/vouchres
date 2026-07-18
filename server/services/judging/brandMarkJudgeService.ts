/**
 * Brand Mark Judge panel — scores the VouchEdge app icon for store / marketing quality.
 * Trust-first: rewards letter monogram + shield; penalizes sportsbook clichés.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { clamp } from "../intelligence/scoring";
import type { SubJudgeResult } from "./judgeTypes";

export type BrandMarkCandidate = {
  /** Raw SVG source */
  svg: string;
  /** Optional paths that should exist for HD readiness */
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
};

function has(svg: string, re: RegExp): boolean {
  return re.test(svg);
}

/** Silhouette Judge — one readable shape at thumbnail size. */
export function judgeBrandSilhouette(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 62;

  if (has(svg, /shield|ve-mark-shield/i) || has(svg, /M512\s+14[0-9]/i)) {
    score += 12;
    notes.push("Shield silhouette present — fast trust read");
  } else {
    score -= 14;
    flags.push("No clear shield silhouette");
  }

  const pathCount = (svg.match(/<path\b/gi) ?? []).length;
  if (pathCount > 0 && pathCount <= 10) {
    score += 8;
    notes.push(`Path budget healthy (${pathCount}) — low cognitive load`);
  } else if (pathCount > 14) {
    score -= 10;
    flags.push(`Too many paths (${pathCount}) — may muddle at 48px`);
  }

  if (has(svg, /feGaussianBlur|filter=/i)) {
    notes.push("Soft glow present — OK at HD, must not own the silhouette");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Silhouette clarity ${score}/100`);
  return { judge: "SilhouetteJudge", score, notes, flags };
}

/** Letter Judge — brandable monogram must include readable letters. */
export function judgeBrandLetters(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 40;

  const hasLettersGroup = has(svg, /ve-mark-letters|letterform|monogram/i);
  const hasV = has(svg, /\bVE\b|letter-v|<!--\s*V\b|aria-label="[^"]*V/i) || has(svg, /class="[^"]*letter-v/i);
  const hasE = has(svg, /letter-e|<!--\s*E\b/i) || has(svg, /class="[^"]*letter-e/i);
  const mentionsVE = has(svg, /\bVE\b|VouchEdge monogram|VE monogram/i);

  if (hasLettersGroup) {
    score += 18;
    notes.push("Dedicated letterform group present");
  } else {
    flags.push("No letterform group — icon lacks brand letters");
  }

  if (hasV && hasE) {
    score += 28;
    notes.push("Both V and E letter paths present (VE monogram)");
  } else if (hasV || hasE || mentionsVE) {
    score += 12;
    flags.push("Incomplete monogram — need both V and E");
  } else {
    score -= 16;
    flags.push("No V/E letter geometry detected");
  }

  // Person glyph is not a letter — soft penalty if it crowds the mark.
  if (has(svg, /vouch identity|head \+|shoulders/i) && !hasLettersGroup) {
    score -= 8;
    flags.push("Person glyph without letters — weak brand lockup");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Letter / monogram score ${score}/100`);
  return { judge: "LetterJudge", score, notes, flags };
}

/** Trust Cue Judge — research brand, not sportsbook. */
export function judgeBrandTrustCues(svg: string): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 70;

  if (has(svg, /#00E5FF|#67E8F9|#2DD4BF/i) && has(svg, /#020617|#07111F/i)) {
    score += 10;
    notes.push("Cyan-on-navy competence palette (trust, not casino)");
  } else {
    score -= 12;
    flags.push("Brand palette incomplete");
  }

  if (has(svg, /dice|chip|dollar|sportsbook|betting|🎰|\$/i)) {
    score -= 35;
    flags.push("Sportsbook / wager cue detected — reject for store positioning");
  } else {
    score += 6;
    notes.push("No sportsbook clichés in mark source");
  }

  if (has(svg, /check|verified|vouch|trust/i)) {
    score += 6;
    notes.push("Verification / vouch language in mark");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Trust cue score ${score}/100`);
  return { judge: "TrustCueJudge", score, notes, flags };
}

/** Market Fit Judge — store grid + marketing brandability + HD assets. */
export function judgeBrandMarketFit(candidate: BrandMarkCandidate): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 58;
  const { svg, assets } = candidate;

  if (has(svg, /viewBox="0 0 1024 1024"/)) {
    score += 6;
    notes.push("Vector master viewBox locked for scale");
  }

  if (assets?.png4k && existsSync(assets.png4k)) {
    score += 12;
    notes.push("4K PNG master on disk — press / store ready");
  } else {
    score -= 10;
    flags.push("Missing 4K PNG master");
  }

  if (assets?.preview48 && existsSync(assets.preview48)) {
    score += 8;
    notes.push("48px preview exists — thumbnail QA possible");
  } else {
    flags.push("No 48px preview — cannot prove grid legibility");
  }

  if (has(svg, /ve-mark-letters/i) && has(svg, /ve-mark-shield/i)) {
    score += 10;
    notes.push("Shield + letters lockup is marketing-brandable");
  }

  if (has(svg, /baseball|bat|helmet|football/i)) {
    score -= 12;
    flags.push("Literal sports prop — competes with sportsbook icons");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Market / store fit ${score}/100`);
  return { judge: "MarketFitJudge", score, notes, flags };
}

function approval(final: number, letterScore: number): BrandMarkVerdict["approvalStatus"] {
  if (letterScore < 50) return "Needs more work";
  if (final >= 78 && letterScore >= 70) return "Approved";
  if (final >= 65) return "Playable but risky";
  if (final < 45) return "Avoid";
  return "Needs more work";
}

/** Run the brand-mark panel on SVG (+ optional asset paths). */
export function runBrandMarkJudgePanel(candidate: BrandMarkCandidate): BrandMarkVerdict {
  const silhouette = judgeBrandSilhouette(candidate.svg);
  const letters = judgeBrandLetters(candidate.svg);
  const trust = judgeBrandTrustCues(candidate.svg);
  const market = judgeBrandMarketFit(candidate);

  const judges = [silhouette, letters, trust, market];
  // Letters are weighted — user explicitly requires brand letters.
  const finalScore = clamp(
    Math.round(
      silhouette.score * 0.22 + letters.score * 0.34 + trust.score * 0.22 + market.score * 0.22,
    ),
    1,
    100,
  );

  const whatCouldGoWrong = judges.flatMap((j) => j.flags);
  const judgeNotes = judges.flatMap((j) => j.notes.slice(0, 2));

  const marketingRead =
    letters.score >= 70
      ? "First glance: VE monogram. Second glance: trust shield. Brand learn: VouchEdge."
      : "Letters are weak — store grid may read as generic security, not VouchEdge.";

  return {
    finalScore,
    approvalStatus: approval(finalScore, letters.score),
    confidence: finalScore >= 80 ? "Strong" : finalScore >= 65 ? "Moderate" : "Speculative",
    judges,
    judgeNotes,
    whatCouldGoWrong,
    marketingRead,
  };
}

/** Load the repo master mark and run the panel. */
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
