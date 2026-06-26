# Supabase email templates — setup instructions

Supabase Auth sends transactional emails for:
1. Email confirmation (signup)
2. Password reset
3. Magic link signin
4. Invite user (staff-initiated)

## Setup

1. Go to https://supabase.com/dashboard → your project → Authentication → Email Templates

2. For each template type, paste the corresponding HTML from this folder:

   | Template type in Supabase | File in this folder |
   |---------------------------|---------------------|
   | Confirm signup            | `confirm-email.html` |
   | Reset Password            | `reset-password.html` |
   | Magic Link                | `confirm-email.html` (modify copy) |
   | Invite User               | `invite-email.html` |

3. Supabase templates support these variables (auto-replaced):
   - `{{ .ConfirmationURL }}` — the action URL (confirm, reset, magic link)
   - `{{ .Token }}` — the invite code (for invite emails)
   - `{{ .Email }}` — the recipient's email
   - `{{ .SiteURL }}` — your configured site URL

4. Configure the sender address:
   - Default: `noreply@mail.app.supabase.com`
   - Custom: set up your own domain in Supabase > Settings > Authentication > SMTP
   - For beta, the default is fine. For production, use a custom domain
     (improves deliverability and brand trust).

5. Configure the site URL:
   - Supabase > Authentication > URL Configuration
   - Site URL: `https://vouchedge.app` (your production URL)
   - Redirect URLs: add `http://localhost:3000/auth/callback` for dev,
     `https://vouchedge.app/auth/callback` for prod

## Testing

After setup, test each flow end-to-end:

1. **Confirm email**: Sign up with a test email → check inbox → click link → verify auth completes
2. **Password reset**: Sign out → click "Forgot password" → check inbox → click link → set new password → sign in
3. **Magic link**: Sign out → click "Sign in with email link" → check inbox → click link → verify signed in
4. **Invite**: As staff, issue invite via /admin → check invited user's inbox → click link → complete signup

## Custom SMTP (production)

For production, configure custom SMTP to avoid Supabase's free-tier email limits:

1. Choose a provider:
   - **Resend** (recommended — modern, generous free tier of 3,000/mo)
   - **Postmark** (excellent deliverability, paid from day 1)
   - **Amazon SES** (cheapest at scale, more setup)
   - **SendGrid** (established, has free tier)

2. Get SMTP credentials from your provider

3. Supabase > Settings > Authentication > SMTP Settings:
   - Enable custom SMTP
   - Host: `smtp.resend.com` (or your provider's)
   - Port: `465` (SSL) or `587` (STARTTLS)
   - Username: your API key / username
   - Password: your API key / password
   - Sender email: `noreply@vouchedge.app` (requires domain verification)
   - Sender name: `VouchEdge`

4. Verify DNS records (SPF, DKIM, DMARC) per your provider's docs.

5. Send a test email from Supabase dashboard to confirm.
