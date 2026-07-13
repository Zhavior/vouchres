import { AppError } from "../../errors/AppError";
import { getSupabaseAdmin } from "../../middleware/auth";
import { structuredLog } from "../../lib/structuredLog";

export type SocialControlType = "block" | "mute";
export type SocialReportSubjectType = "profile" | "post" | "story";
export type SocialReportReason =
  | "spam"
  | "harassment"
  | "impersonation"
  | "harmful_content"
  | "other";

async function admin() {
  return getSupabaseAdmin();
}

export async function getHiddenProfileIds(userId: string): Promise<Set<string>> {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("social_user_controls")
    .select("actor_id, target_id, control_type")
    .or(`actor_id.eq.${userId},target_id.eq.${userId}`);

  if (error) throw error;

  return new Set(
    (data ?? []).flatMap((row) => {
      const actorId = String(row.actor_id);
      const targetId = String(row.target_id);
      const type = String(row.control_type);
      if (actorId === userId && (type === "block" || type === "mute")) return [targetId];
      if (targetId === userId && type === "block") return [actorId];
      return [];
    }),
  );
}

export async function getSocialControlState(actorId: string, targetId: string) {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("social_user_controls")
    .select("control_type")
    .eq("actor_id", actorId)
    .eq("target_id", targetId);
  if (error) throw error;

  const controls = new Set((data ?? []).map((row) => String(row.control_type)));
  return { blocked: controls.has("block"), muted: controls.has("mute") };
}

export async function setSocialControl(input: {
  actorId: string;
  targetId: string;
  controlType: SocialControlType;
}) {
  if (input.actorId === input.targetId) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "You cannot change safety controls for your own account.",
    });
  }

  const supabaseAdmin = await admin();
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", input.targetId)
    .maybeSingle();
  if (!target) {
    throw new AppError({ status: 404, code: "not_found", message: "Profile not found." });
  }

  const { error } = await supabaseAdmin.from("social_user_controls").upsert({
    actor_id: input.actorId,
    target_id: input.targetId,
    control_type: input.controlType,
  });
  if (error) throw error;

  if (input.controlType === "block") {
    await supabaseAdmin
      .from("follows")
      .delete()
      .or(
        `and(follower_id.eq.${input.actorId},following_profile_id.eq.${input.targetId}),and(follower_id.eq.${input.targetId},following_profile_id.eq.${input.actorId})`,
      );
  }

  return getSocialControlState(input.actorId, input.targetId);
}

export async function clearSocialControl(input: {
  actorId: string;
  targetId: string;
  controlType: SocialControlType;
}) {
  const supabaseAdmin = await admin();
  const { error } = await supabaseAdmin
    .from("social_user_controls")
    .delete()
    .match({
      actor_id: input.actorId,
      target_id: input.targetId,
      control_type: input.controlType,
    });
  if (error) throw error;
  return getSocialControlState(input.actorId, input.targetId);
}

async function resolveReportTarget(subjectType: SocialReportSubjectType, subjectId: string) {
  const supabaseAdmin = await admin();
  if (subjectType === "profile") {
    const { data } = await supabaseAdmin.from("profiles").select("id").eq("id", subjectId).maybeSingle();
    return data ? String(data.id) : null;
  }

  const table = subjectType === "post" ? "posts" : "user_stories";
  const authorColumn = subjectType === "post" ? "author_id" : "user_id";
  const { data } = await supabaseAdmin.from(table).select(`${authorColumn}`).eq("id", subjectId).maybeSingle();
  return data?.[authorColumn] ? String(data[authorColumn]) : null;
}

export async function createSocialReport(input: {
  reporterId: string;
  subjectType: SocialReportSubjectType;
  subjectId: string;
  reason: SocialReportReason;
  details?: string;
  requestId?: string;
}) {
  const targetProfileId = await resolveReportTarget(input.subjectType, input.subjectId);
  if (!targetProfileId) {
    throw new AppError({ status: 404, code: "not_found", message: "Report subject not found." });
  }
  if (targetProfileId === input.reporterId) {
    throw new AppError({ status: 400, code: "bad_request", message: "You cannot report your own content." });
  }

  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("social_reports")
    .upsert(
      {
        reporter_id: input.reporterId,
        subject_type: input.subjectType,
        subject_id: input.subjectId,
        target_profile_id: targetProfileId,
        reason: input.reason,
        details: input.details?.trim().slice(0, 500) ?? "",
        status: "open",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "reporter_id,subject_type,subject_id" },
    )
    .select("id, status, created_at")
    .single();
  if (error) throw error;

  structuredLog({
    level: "info",
    event: "social.report.created",
    requestId: input.requestId,
    subjectType: input.subjectType,
    reason: input.reason,
  });
  return data;
}
