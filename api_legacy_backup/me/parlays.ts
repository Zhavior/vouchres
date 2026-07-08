import type { VercelRequest, VercelResponse } from "@vercel/node";
import { normalizeLimit, normalizeOffset, requireUser } from "../_utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, client, error } = await requireUser(req);
  if (!user || !client) {
    return res.status(401).json({ error, parlays: [], total: 0, warnings: [error ?? "unauthorized"] });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed", warnings: ["Use GET for this endpoint."] });
  }

  const limit = normalizeLimit(req.query.limit, 50, 100);
  const offset = normalizeOffset(req.query.offset);
  const { data, count, error: fetchError } = await client
    .from("picks")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .eq("leg_type", "parlay")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (fetchError) {
    return res.status(200).json({ parlays: [], total: 0, limit, offset, warnings: [fetchError.message] });
  }

  const picks = data ?? [];
  const pickIds = picks.map((pick: any) => pick.id);
  let legsByPick: Record<string, any[]> = {};
  if (pickIds.length > 0) {
    const { data: legs, error: legsError } = await client
      .from("pick_legs")
      .select("*")
      .in("pick_id", pickIds)
      .order("leg_index", { ascending: true });
    if (!legsError) {
      legsByPick = (legs ?? []).reduce((acc: Record<string, any[]>, leg: any) => {
        const key = String(leg.pick_id);
        acc[key] = acc[key] ?? [];
        acc[key].push(leg);
        return acc;
      }, {});
    }
  }

  return res.status(200).json({
    parlays: picks.map((pick: any) => ({ ...pick, legs: legsByPick[String(pick.id)] ?? [] })),
    total: count ?? 0,
    limit,
    offset,
    warnings: [],
  });
}
