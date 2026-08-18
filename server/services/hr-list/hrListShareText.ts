/**
 * Post text for a shared HR list.
 *
 * Shared by the server (share intent response) and mirrored in the client share
 * sheet so the preview the user reads is the text that actually gets posted.
 *
 * Length target is X's 280-character limit. X counts any URL as 23 characters
 * regardless of its real length (t.co wrapping), and the permalink is passed as
 * the intent's separate `url` param, so the body budget is 280 − 23 − 1 space.
 */
import type { HrListEntryRecord } from "./hrListService";

const X_URL_WEIGHT = 23;
const X_LIMIT = 280;
const BODY_BUDGET = X_LIMIT - X_URL_WEIGHT - 1;

/** Named players before the list rolls up into "+N more". */
const NAMED_PLAYERS = 3;

function formatProbPct(prob: number | null | undefined): string | null {
  if (prob == null || !Number.isFinite(Number(prob))) return null;
  const n = Number(prob);
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  if (pct <= 0 || pct > 100) return null;
  return `${Math.round(pct)}%`;
}

function formatSlate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!match) return null;
  const [, , m, d] = match;
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][Number(m) - 1];
  return month ? `${month} ${Number(d)}` : null;
}

export function buildHrListShareText(input: {
  title: string;
  entries: HrListEntryRecord[];
  slateDate?: string | null;
}): string {
  const total = input.entries.length;
  const slate = formatSlate(input.slateDate);

  const headline = [
    input.title.trim(),
    slate ? `· ${slate}` : null,
  ].filter(Boolean).join(" ");

  const named = input.entries.slice(0, NAMED_PLAYERS).map((entry) => {
    const prob = formatProbPct(entry.estimatedHrProb);
    const odds = entry.bestOdds ? String(entry.bestOdds).trim() : null;
    const detail = [prob, odds].filter(Boolean).join(" ");
    return detail ? `${entry.playerName} (${detail})` : entry.playerName;
  });

  const remainder = total - named.length;
  const lines = [
    `⚾ ${headline}`,
    "",
    ...named.map((line) => `• ${line}`),
    remainder > 0 ? `• +${remainder} more` : null,
    "",
    `${total} HR ${total === 1 ? "target" : "targets"} · full board on VouchEdge 👇`,
  ].filter((line) => line !== null) as string[];

  const text = lines.join("\n");
  if (text.length <= BODY_BUDGET) return text;

  // Over budget — drop named players from the end until it fits, then hard-trim.
  for (let keep = named.length - 1; keep >= 0; keep -= 1) {
    const trimmedNamed = named.slice(0, keep);
    const trimmedRemainder = total - keep;
    const candidate = [
      `⚾ ${headline}`,
      "",
      ...trimmedNamed.map((line) => `• ${line}`),
      trimmedRemainder > 0 ? `• +${trimmedRemainder} more` : null,
      "",
      `${total} HR ${total === 1 ? "target" : "targets"} · full board on VouchEdge 👇`,
    ].filter((line) => line !== null).join("\n") as string;
    if (candidate.length <= BODY_BUDGET) return candidate;
  }

  return text.slice(0, BODY_BUDGET - 1).trimEnd() + "…";
}

export const HR_LIST_SHARE_TEXT_LIMITS = { X_LIMIT, X_URL_WEIGHT, BODY_BUDGET } as const;
