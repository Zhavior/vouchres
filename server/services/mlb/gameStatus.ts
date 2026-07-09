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

export function isMlbFinalStatusText(status: unknown): boolean {
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
