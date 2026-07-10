function statusText(status: unknown): string {
  if (typeof status === "object" && status !== null) {
    const record = status as unknown as Record<string, unknown>;
    return [
      record.abstractGameState,
      record.detailedState,
      record.codedGameState,
      record.statusCode,
    ]
      .filter((value) => value != null)
      .map(String)
      .join(" ");
  }

  return String(status ?? "");
}

export function formatMlbStatus(status: unknown): string {
  if (typeof status === "object" && status !== null) {
    const record = status as unknown as Record<string, unknown>;
    return `abstract=${record.abstractGameState ?? "unknown"}, detailed=${record.detailedState ?? "unknown"}, coded=${record.codedGameState ?? "unknown"}, statusCode=${record.statusCode ?? "unknown"}`;
  }

  return `status=${String(status ?? "unknown")}`;
}

export function isMlbLiveStatus(status: unknown): boolean {
  const text = statusText(status).toLowerCase();
  return (
    text.includes("progress") ||
    text.includes("live") ||
    text.includes("in play") ||
    text.includes("warmup") ||
    text.includes("delayed") ||
    text.includes("challenge") ||
    text.includes("review") ||
    /\b(top|bottom|middle|end)\s+\d/.test(text) ||
    /\b\d+(st|nd|rd|th)\s+inning\b/.test(text)
  );
}

/**
 * A game that ended WITHOUT being played to a valid, gradeable result:
 * postponed, suspended (mid-suspension), cancelled, or forfeited. MLB
 * frequently reports abstractGameState="Final" alongside detailedState=
 * "Postponed" (codedGameState "D"), so these would otherwise slip past
 * isMlbFinalStatusText, hit an empty/partial box score, and grade every
 * player prop as a LOSS. They must NOT be treated as final — the pick
 * stays pending until the game is actually replayed/resumed to completion.
 *
 * Note: a suspended game that later RESUMES and completes reports
 * detailedState="Final" (not "Suspended"), so it correctly grades then.
 */
export function isMlbAbandonedStatus(status: unknown): boolean {
  const text = statusText(status).toLowerCase();
  return (
    text.includes("postponed") ||
    text.includes("suspended") ||
    text.includes("cancelled") ||
    text.includes("canceled") ||
    text.includes("forfeit")
  );
}

export function isMlbFinalStatusText(status: unknown): boolean {
  // Postponed/suspended/cancelled/forfeited games are terminal but NOT
  // "final and played" — never grade off them (see isMlbAbandonedStatus).
  if (isMlbAbandonedStatus(status)) return false;

  const raw = statusText(status);
  const text = raw.toLowerCase();
  const tokens = raw.split(/\s+/).map((token) => token.toUpperCase());

  return (
    text.includes("final") ||
    text.includes("game over") ||
    text.includes("completed") ||
    text.includes("official") ||
    tokens.includes("F")
  );
}
