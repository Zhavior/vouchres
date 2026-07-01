export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    source: "vouchres_safe_fallback",
    warning: "Agent route fallback is active. Connect production agents later.",
    cappers: [],
    judges: [],
    agents: [],
    updatedAt: new Date().toISOString(),
  });
}
