export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    source: "vouchres_safe_fallback",
    warning: "Matchups fallback is active. Connect verified matchup module later.",
    matchups: [],
    games: [],
    updatedAt: new Date().toISOString(),
  });
}
