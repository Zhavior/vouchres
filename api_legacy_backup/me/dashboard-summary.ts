import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../_utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, client, error } = await requireUser(req);
  if (!user || !client) {
    return res.status(401).json({ error, warnings: [error ?? "unauthorized"] });
  }

  const { data, error: fetchError } = await client
    .from("picks")
    .select("id, status, leg_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(250);

  if (fetchError) {
    return res.status(200).json({
      widgets: { savedPicks: 0, savedParlays: 0, pendingPicks: 0, winRate: null, proofScore: 0 },
      summary: { total: 0, pending: 0, won: 0, lost: 0, void: 0, push: 0, parlays: 0, singles: 0 },
      recent: [],
      warnings: [fetchError.message],
    });
  }

  const rows = data ?? [];
  const summary = rows.reduce(
    (acc: any, pick: any) => {
      const status = String(pick.status ?? "pending").toLowerCase();
      acc.total += 1;
      acc[status] = (acc[status] ?? 0) + 1;
      if (pick.leg_type === "parlay") acc.parlays += 1;
      else acc.singles += 1;
      return acc;
    },
    { total: 0, pending: 0, won: 0, lost: 0, void: 0, push: 0, parlays: 0, singles: 0 }
  );
  const graded = summary.won + summary.lost + summary.void + summary.push;
  const decisions = summary.won + summary.lost;
  const winRate = decisions > 0 ? Number(((summary.won / decisions) * 100).toFixed(1)) : null;
  const proofScore = graded > 0 ? Math.min(100, Math.round(summary.won * 7 + summary.push * 2 + graded * 1.5)) : 0;

  return res.status(200).json({
    widgets: {
      savedPicks: summary.total,
      savedParlays: summary.parlays,
      pendingPicks: summary.pending,
      winRate,
      proofScore,
    },
    summary,
    recent: rows.slice(0, 8),
    warnings: [],
  });
}
