/** Bias Judge — name-value hype, favorite-team bias, public hype, chasing language. */
import { PickCandidate, SubJudgeResult } from "./judgeTypes";
import { clamp } from "../intelligence/scoring";

const STAR_NAMES = ["judge", "ohtani", "betts", "acuna", "acuña", "soto", "trout", "harper"];
const HYPE_WORDS = ["lock", "guaranteed", "free money", "can't lose", "cant lose", "100%", "sure thing", "bet the house"];

export function judgeBias(pick: PickCandidate): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 80; // start trusting, subtract for bias signals

  const hay = `${pick.player ?? ""} ${pick.selection ?? ""} ${(pick.reasons ?? []).join(" ")}`.toLowerCase();

  if (STAR_NAMES.some((n) => (pick.player ?? "").toLowerCase().includes(n))) {
    score -= 6;
    flags.push("Star-name pick — check for name-value hype vs actual edge");
  }

  const foundHype = HYPE_WORDS.filter((w) => hay.includes(w));
  if (foundHype.length) {
    score -= 25;
    flags.push(`Hype/overconfident wording detected: ${foundHype.join(", ")}`);
  }

  if ((pick.score ?? 0) >= 92) {
    score -= 8;
    notes.push("Very high confidence — verify it isn't overconfidence");
  }

  if (flags.length === 0) notes.push("No strong bias signals detected");
  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Bias-clean score ${score}/100 (higher = less biased)`);
  return { judge: "BiasJudge", score, notes, flags };
}
