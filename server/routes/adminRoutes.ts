import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, requireStaff, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { AppError } from "../errors/AppError";
import { issueInvite } from "../services/persistence/betaService";

/**
 * Admin routes — staff-only.
 *
 *   GET    /api/admin/beta              — list all beta signups
 *   POST   /api/admin/beta/invite       — issue invite for a single email
 *   POST   /api/admin/beta/invite-batch — issue invites for multiple emails
 *   DELETE /api/admin/beta/:email       — remove a waitlist entry
 *   POST   /api/admin/grade-pending     — manually trigger grading job
 *   GET    /api/admin/users             — paginated user list
 *   PATCH  /api/admin/users/:id         — update user (ban, staff flag, tier override)
 *   POST   /api/admin/cappers           — create a new capper
 *   GET    /api/admin/stats             — dashboard stats
 *
 * All routes require requireAuth + requireStaff.
 */
export const adminRoutes = Router();

adminRoutes.get(
  "/beta",
  requireAuth,
  requireStaff,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const state = req.query.state as string | undefined;
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const offset = Number(req.query.offset ?? 0);

    let query = supabaseAdmin
      .from("beta_signups")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (state) query = query.eq("state", state);

    const { data, count, error } = await query;
    if (error) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to fetch beta signups.",
        cause: error,
      });
    }

    return res.json(apiOkFlat(req, { signups: data ?? [], total: count ?? 0, limit, offset }));
  }),
);

const InviteSchema = z.object({ email: z.string().email() });

adminRoutes.post(
  "/beta/invite",
  requireAuth,
  requireStaff,
  validate({ body: InviteSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const { email } = req.body as z.infer<typeof InviteSchema>;
    const result = await issueInvite(email);
    if (!result) {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "Email is not in the waitlist or was already invited.",
        details: { error: "not_in_waitlist_or_already_invited" },
      });
    }
    return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
  }),
);

const InviteBatchSchema = z.object({
  emails: z.array(z.string().email()).max(100),
});

adminRoutes.post(
  "/beta/invite-batch",
  requireAuth,
  requireStaff,
  validate({ body: InviteBatchSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const { emails } = req.body as z.infer<typeof InviteBatchSchema>;
    const results: Array<{ email: string; ok: boolean; invite_code?: string; error?: string }> = [];

    for (const email of emails) {
      try {
        const r = await issueInvite(email);
        if (r) {
          results.push({ email, ok: true, invite_code: r.invite_code });
        } else {
          results.push({ email, ok: false, error: "not_in_waitlist_or_already_invited" });
        }
      } catch (err: any) {
        results.push({ email, ok: false, error: err.message });
      }
    }
    return res.json(apiOkFlat(req, { results }));
  }),
);

adminRoutes.delete(
  "/beta/:email",
  requireAuth,
  requireStaff,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const { email } = req.params;
    const { error } = await supabaseAdmin
      .from("beta_signups")
      .delete()
      .eq("email", email);
    if (error) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to delete beta signup.",
        cause: error,
      });
    }
    return res.json(apiOkFlat(req, {}));
  }),
);

adminRoutes.post(
  "/grade-pending",
  requireAuth,
  requireStaff,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const days = Math.min(Number(req.body?.days ?? 3), 14);
    const dryRun = Boolean(req.body?.dryRun);

    try {
      const { gradePendingPicks } = await import("../services/grading/gradingService");
      const result = await gradePendingPicks({ days, dryRun });
      return res.json(apiOkFlat(req, {
        graded: result.graded.length,
        skipped: result.skipped.length,
        summary: result.summary,
        warnings: result.summary.warnings,
        details: result,
      }));
    } catch (err: any) {
      console.error("[admin] grade-pending failed", err);
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: err?.message ?? "Failed to grade pending picks.",
        expose: true,
        cause: err,
      });
    }
  }),
);

adminRoutes.get(
  "/users",
  requireAuth,
  requireStaff,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const offset = Number(req.query.offset ?? 0);
    const search = req.query.search as string | undefined;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, email, tier, is_banned, is_staff, is_demo, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to fetch users.",
        cause: error,
      });
    }

    return res.json(apiOkFlat(req, { users: data ?? [], total: count ?? 0, limit, offset }));
  }),
);

const UserUpdateSchema = z.object({
  is_banned: z.boolean().optional(),
  is_staff: z.boolean().optional(),
  tier: z.enum(["free", "gold", "seller_pro"]).optional(),
  reason: z.string().max(500).optional(),
});

adminRoutes.patch(
  "/users/:id",
  requireAuth,
  requireStaff,
  validate({ body: UserUpdateSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const { id } = req.params;
    const updates = req.body as z.infer<typeof UserUpdateSchema>;

    if (id === req.user!.id && updates.is_staff === false) {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "You cannot demote yourself.",
        details: { error: "cannot_demote_self" },
      });
    }

    const safeUpdates: Record<string, unknown> = {};
    if (updates.is_banned !== undefined) safeUpdates.is_banned = updates.is_banned;
    if (updates.is_staff !== undefined) safeUpdates.is_staff = updates.is_staff;
    if (updates.tier !== undefined) safeUpdates.tier = updates.tier;

    if (Object.keys(safeUpdates).length === 0) {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "No updates provided.",
        details: { error: "no_updates" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(safeUpdates)
      .eq("id", id)
      .select("id, username, tier, is_banned, is_staff")
      .single();

    if (error) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to update user.",
        cause: error,
      });
    }

    console.log(
      `[admin] staff ${req.user!.id} updated user ${id}:`,
      safeUpdates,
      updates.reason ? `reason: ${updates.reason}` : "",
    );

    return res.json(apiOkFlat(req, data as unknown as Record<string, unknown>));
  }),
);

const CapperCreateSchema = z.object({
  id: z.string().min(2).max(32).regex(/^[a-z0-9-]+$/),
  display_name: z.string().min(1).max(64),
  tagline: z.string().max(140).default(""),
  persona: z.string().max(1000).default(""),
  is_demo: z.boolean().default(true),
});

adminRoutes.post(
  "/cappers",
  requireAuth,
  requireStaff,
  validate({ body: CapperCreateSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const body = req.body as z.infer<typeof CapperCreateSchema>;
    const { data, error } = await supabaseAdmin
      .from("cappers")
      .insert(body)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new AppError({
          status: 409,
          code: "conflict",
          message: "Capper id already exists.",
          details: { error: "capper_id_exists" },
        });
      }
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to create capper.",
        cause: error,
      });
    }

    await supabaseAdmin.from("trust_scores").upsert({
      subject_type: "capper",
      subject_id: body.id,
      scope: "overall",
      score: 50.0,
    }, { onConflict: "subject_type,subject_id,scope" });

    return res.status(201).json(apiOkFlat(req, data as unknown as Record<string, unknown>));
  }),
);

adminRoutes.get(
  "/stats",
  requireAuth,
  requireStaff,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const [
      usersCount,
      betaWaitlist,
      betaInvited,
      betaActive,
      picksTotal,
      picksPending,
      picksGraded,
      subsActive,
      subsGold,
      subsSellerPro,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("is_demo", false),
      supabaseAdmin.from("beta_signups").select("*", { count: "exact", head: true }).eq("state", "waitlist"),
      supabaseAdmin.from("beta_signups").select("*", { count: "exact", head: true }).eq("state", "invited"),
      supabaseAdmin.from("beta_signups").select("*", { count: "exact", head: true }).eq("state", "active"),
      supabaseAdmin.from("picks").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("picks").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("picks").select("*", { count: "exact", head: true }).in("status", ["won", "lost", "push"]),
      supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("tier", "gold").eq("status", "active"),
      supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("tier", "seller_pro").eq("status", "active"),
    ]);

    return res.json(apiOkFlat(req, {
      users: usersCount.count ?? 0,
      beta: {
        waitlist: betaWaitlist.count ?? 0,
        invited: betaInvited.count ?? 0,
        active: betaActive.count ?? 0,
      },
      picks: {
        total: picksTotal.count ?? 0,
        pending: picksPending.count ?? 0,
        graded: picksGraded.count ?? 0,
      },
      subscriptions: {
        active: subsActive.count ?? 0,
        gold: subsGold.count ?? 0,
        seller_pro: subsSellerPro.count ?? 0,
      },
      estimated_mrr: ((subsGold.count ?? 0) * 8) + ((subsSellerPro.count ?? 0) * 40),
    }));
  }),
);
