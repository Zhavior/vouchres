export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    source: "vouchres_safe_fallback",
    warning: "Legacy HR feed fallback active. Use /api/mlb/hr-board/today for HR Engine Pro v2.",
    picks: [],
    candidates: [],
    projectedCandidates: [],
    updatedAt: new Date().toISOString(),
  });
}
