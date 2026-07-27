/** Fuzzy MLB team name matching — abbrev, nickname, or full name vs slate label. */

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function teamMatchesMlbSlateName(query: string, slateTeamName: string): boolean {
  const q = normalizeText(query);
  const full = normalizeText(slateTeamName);
  if (!q || !full) return false;
  if (q === full) return true;
  if (full.includes(q) || q.includes(full)) return true;

  const lastWord = full.split(/\s+/).pop() ?? "";
  if (lastWord && (lastWord.startsWith(q) || q.startsWith(lastWord))) return true;

  const initials = slateTeamName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .toLowerCase();
  if (q.length >= 2 && q === initials) return true;

  return false;
}

export function playerTeamMatchesGameSide(
  playerTeam: string | null | undefined,
  gameTeam: string,
  extraLabels: Array<string | null | undefined> = [],
): boolean {
  const labels = [playerTeam, ...extraLabels].filter(Boolean) as string[];
  return labels.some((label) => teamMatchesMlbSlateName(label, gameTeam));
}
