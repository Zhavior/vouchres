export default function handler(req: any, res: any) {
  const date = typeof req.query?.date === "string"
    ? req.query.date
    : new Date().toISOString().slice(0, 10);

  res.status(200).json({
    ok: true,
    date,
    source: "vouchres_safe_fallback",
    warning: "Daily MLB report fallback is active. Full report route can be connected later.",
    games: [],
    picks: [],
    notes: [],
    updatedAt: new Date().toISOString(),
  });
}
