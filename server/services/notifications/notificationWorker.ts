import { getSupabaseAdmin } from "../../middleware/auth";
import { getPrefs, typeEnabled, maybeSendPush, missingTable, type NotificationType } from "./notificationService";

export async function processNotificationJobsBatch() {
  const supabaseAdmin = await getSupabaseAdmin();

  try {
    // 1. Fetch a batch of pending jobs, locking them so other workers don't grab them.
    // We use a raw SQL RPC or direct update if we have one, but with Supabase Data API, 
    // we can simulate a queue by updating `pending` to `processing` returning the rows.
    // Wait, Supabase standard API doesn't support FOR UPDATE SKIP LOCKED directly via standard select.
    // We can use a postgres RPC if we wanted true FOR UPDATE SKIP LOCKED, but for now we can do a 
    // simple atomic update with `in` and `limit`.
    // Actually, in Supabase JS, `in` and `limit` on update isn't strictly atomic for queueing if multiple workers exist,
    // but we only run one worker interval on the single Express server right now.
    
    // To be perfectly safe, let's fetch pending, then try to update to processing.
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from("notification_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      if (missingTable(fetchError)) return; // queue not migrated yet
      console.error("[notificationWorker] fetch error", fetchError);
      return;
    }

    if (!jobs || jobs.length === 0) return;

    // Try to atomically claim them
    const jobIds = jobs.map(j => j.id);
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("notification_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .in("id", jobIds)
      .eq("status", "pending")
      .select("id");

    if (claimError || !claimed || claimed.length === 0) return;

    const claimedIds = new Set(claimed.map(c => c.id));
    const activeJobs = jobs.filter(j => claimedIds.has(j.id));

    // Process each job
    for (const job of activeJobs) {
      try {
        const { prefs } = await getPrefs(job.user_id);
        
        if (!typeEnabled(job.type as NotificationType, prefs)) {
          await markJobCompleted(job.id);
          continue;
        }

        // 2. Insert into the actual notifications table
        const { error: insertError } = await supabaseAdmin.from("notifications").insert({
          user_id: job.user_id,
          type: job.type,
          title: job.title,
          message: job.message,
          metadata: job.metadata,
          dedupe_key: job.dedupe_key,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            // dedupe key duplicate, perfectly fine, mark done.
            await markJobCompleted(job.id);
            continue;
          }
          throw insertError;
        }

        // 3. Fire web push
        await maybeSendPush({
          userId: job.user_id,
          type: job.type as NotificationType,
          title: job.title,
          message: job.message,
          metadata: job.metadata,
          prefs,
        });

        await markJobCompleted(job.id);
      } catch (err: any) {
        await markJobFailed(job.id, err?.message ?? "unknown error");
      }
    }
  } catch (err) {
    console.error("[notificationWorker] fatal loop error", err);
  }
}

async function markJobCompleted(id: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  await supabaseAdmin
    .from("notification_jobs")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);
}

async function markJobFailed(id: string, error: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  await supabaseAdmin
    .from("notification_jobs")
    .update({ status: "failed", error, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export function startNotificationWorker() {
  console.log("[notificationWorker] starting polling loop...");
  // poll every 2 seconds
  const timer = setInterval(() => {
    processNotificationJobsBatch().catch(console.error);
  }, 2000);
  
  return {
    stop: () => clearInterval(timer)
  };
}
