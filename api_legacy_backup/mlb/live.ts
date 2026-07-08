export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    source: "vouchres_safe_fallback",
    warning: "Live MLB route fallback is active. Connect production live-game feed later.",
    games: [],
    liveGames: [],
    updatedAt: new Date().toISOString(),
  });
}
