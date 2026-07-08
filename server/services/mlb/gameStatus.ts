export function isMlbLiveStatus(status: unknown): boolean {
  const text = String(status ?? "").toLowerCase();
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
  const text = String(status ?? "").toLowerCase();
  return text.includes("final") || text.includes("game over") || text.includes("completed");
}
