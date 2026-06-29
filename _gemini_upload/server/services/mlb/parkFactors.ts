/**
 * Static MLB park HR factors. 100 = league neutral.
 * Source: ESPN/Baseball Reference 5-year park factor averages (2020-2024).
 * Indexed by venue name substring (lowercase) for fuzzy match against MLB schedule data.
 * Weather and wind are NOT included — unavailable without a weather API.
 */
export const PARK_HR_FACTORS: Record<string, number> = {
  "coors field": 121,
  "great american ball park": 111,
  "yankee stadium": 112,
  "globe life field": 107,
  "american family field": 109,
  "wrigley field": 106,
  "camden yards": 109,
  "guaranteed rate field": 107,
  "citizens bank park": 108,
  "minute maid park": 104,
  "target field": 104,
  "nationals park": 103,
  "rogers centre": 106,
  "truist park": 102,
  "fenway park": 104,
  "angel stadium": 101,
  "busch stadium": 98,
  "kauffman stadium": 97,
  "pnc park": 99,
  "t-mobile park": 97,
  "progressive field": 100,
  "petco park": 93,
  "oracle park": 94,
  "dodger stadium": 97,
  "citi field": 99,
  "loanDepot park": 97,
  "loandepot park": 97,
  "tropicana field": 96,
  "comerica park": 96,
  "sutter health park": 98, // Athletics temp Sacramento venue
  "las vegas ballpark": 115, // if Athletics move completed
};

/** Returns park HR factor for venue, or 100 (neutral) if unknown. */
export function getParkFactor(venue: string): { factor: number; source: "table" | "neutral" } {
  const lower = venue.toLowerCase();
  for (const [key, factor] of Object.entries(PARK_HR_FACTORS)) {
    if (lower.includes(key)) return { factor, source: "table" };
  }
  // Partial match on common tokens
  const tokens = lower.split(/\s+/);
  for (const [key, factor] of Object.entries(PARK_HR_FACTORS)) {
    if (tokens.some((t) => t.length > 4 && key.includes(t))) return { factor, source: "table" };
  }
  return { factor: 100, source: "neutral" };
}
