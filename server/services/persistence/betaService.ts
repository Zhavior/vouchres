import { getSupabaseAdmin } from "../../middleware/auth";

/**
 * Beta signup persistence — replaces the localStorage-only beta signup
 * in PremiumSubPage.tsx. Server now stores waitlist emails in Postgres,
 * issues real invite codes, and tracks activation.
 */

export interface BetaSignup {
  id: string;
  email: string;
  state: "waitlist" | "invited" | "active" | "churned";
  invite_code: string | null;
  invited_at: string | null;
  activated_user_id: string | null;
  created_at: string;
}

/**
 * Add an email to the waitlist. Idempotent on email.
 */
export async function joinWaitlist(email: string): Promise<BetaSignup> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("beta_signups")
    .upsert(
      { email, state: "waitlist" },
      { onConflict: "email", ignoreDuplicates: false }
    )
    .select("*")
    .single();

  // If the row already existed, upsert returns null data on conflict-ignore.
  // Fetch explicitly in that case.
  if (error || !data) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("beta_signups")
      .select("*")
      .eq("email", email)
      .single();
    if (!existing) throw existingError ?? error ?? new Error("beta_signup_failed");
    return existing as BetaSignup;
  }

  return data as BetaSignup;
}

/**
 * Issue an invite code and mark the signup as 'invited'.
 * Called by staff via admin UI.
 */
export async function issueInvite(email: string): Promise<BetaSignup | null> {
  const supabaseAdmin = await getSupabaseAdmin();
  const code = generateInviteCode();
  const { data, error } = await supabaseAdmin
    .from("beta_signups")
    .update({
      state: "invited",
      invite_code: code,
      invited_at: new Date().toISOString(),
    })
    .eq("email", email)
    .eq("state", "waitlist")
    .select("*")
    .maybeSingle();

  // No matching waitlist row is a soft miss (null), not a transport failure.
  if (error) {
    console.error("[beta] issueInvite failed", error);
    throw error;
  }
  return (data as BetaSignup | null) ?? null;
}

/**
 * Mark a signup as 'active' once the user has created an auth account.
 */
export async function markActivated(email: string, userId: string): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("beta_signups")
    .update({ state: "active", activated_user_id: userId })
    .eq("email", email);
  if (error) throw error;
}

/**
 * Validate an invite code during signup.
 */
export async function validateInviteCode(code: string): Promise<boolean> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("beta_signups")
    .select("state, invite_code")
    .eq("invite_code", code)
    .eq("state", "invited")
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

function generateInviteCode(): string {
  // 8-char base32 code, friendly (no 0/O/1/I confusion)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `VE-${code}`;
}
