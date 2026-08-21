import sgMail from "@sendgrid/mail";
import { getSupabaseAdmin } from "../../middleware/auth";
import { getSafePublicOrigin } from "../../lib/publicOrigin";
import { BLOG_POSTS, type BlogPost } from "../../../src/data/blog/posts";

// Fallback in-memory set in case database table isn't migrated yet
const localSubscribers = new Set<string>();

export async function addSubscriber(email: string): Promise<{ created: boolean; email: string }> {
  const cleanEmail = email.trim().toLowerCase();
  localSubscribers.add(cleanEmail);

  try {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: cleanEmail, subscribed_at: new Date().toISOString(), status: "active" },
        { onConflict: "email" }
      );

    if (error) {
      console.warn("[newsletter] Supabase write notice (using fallback):", error.message);
    }
  } catch (err: any) {
    console.warn("[newsletter] DB fallback active for:", cleanEmail);
  }

  // Trigger automated welcome email
  await sendWelcomeEmail(cleanEmail).catch((err) => {
    console.error("[newsletter] Welcome email dispatch error:", err);
  });

  return { created: true, email: cleanEmail };
}

export async function getActiveSubscribers(): Promise<string[]> {
  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("status", "active");

    if (!error && Array.isArray(data) && data.length > 0) {
      const set = new Set([...localSubscribers, ...data.map((r) => r.email)]);
      return Array.from(set);
    }
  } catch (err) {
    // fallback
  }

  return Array.from(localSubscribers);
}

export async function sendWelcomeEmail(toEmail: string): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.CONTACT_EMAIL || "support@vouchedge.xyz";
  const baseUrl = getSafePublicOrigin();
  const latestPost = BLOG_POSTS[0];

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000000; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
      <div style="padding: 32px 24px; background: linear-gradient(180deg, #050f18 0%, #000000 100%); border-bottom: 1px solid rgba(34, 211, 238, 0.2);">
        <div style="font-family: monospace; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">
          // SYSTEM DISPATCH NODE
        </div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
          TRANSMISSION ACCESS GRANTED
        </h1>
      </div>

      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin-top: 0;">
          Your frequency is now locked into the <strong>VouchEdge Transmission Log</strong>. You will receive direct engineering logs, MLB probability architecture breakdowns, and release notes before they hit public channels.
        </p>

        ${
          latestPost
            ? `
        <div style="margin: 24px 0; padding: 20px; background: #080d14; border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 8px;">
          <div style="font-family: monospace; font-size: 10px; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
            LATEST TRANSMISSION // ${latestPost.tag}
          </div>
          <h2 style="margin: 0 0 8px; font-size: 18px; color: #ffffff; font-weight: 800;">
            ${latestPost.title}
          </h2>
          <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; line-height: 1.5;">
            ${latestPost.excerpt}
          </p>
          <a href="${baseUrl}/blog/${latestPost.slug}" style="display: inline-block; background: #22d3ee; color: #000000; font-family: monospace; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
            Read Transmission →
          </a>
        </div>
        `
            : ""
        }

        <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
          No spam. No synthetic win-rates. Only verifiable evidence.
        </p>
      </div>

      <div style="padding: 16px 24px; background: #050a10; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #475569; text-align: center; font-family: monospace;">
        VouchEdge · Dartmouth, NS, Canada 🇨🇦 · <a href="${baseUrl}/" style="color: #38bdf8; text-decoration: none;">vouchedge.xyz</a>
      </div>
    </div>
  `;

  if (apiKey) {
    sgMail.setApiKey(apiKey);
    await sgMail.send({
      to: toEmail,
      from: fromEmail,
      subject: `[VouchEdge] Transmission Access Granted`,
      html,
      text: `Transmission Access Granted. Welcome to VouchEdge Engineering Logs. Read our latest updates at ${baseUrl}/blog`,
    });
  } else {
    console.log(`[newsletter] Dev simulation: Sent Welcome Email to ${toEmail}`);
  }
}

export async function broadcastBlogPost(slug: string): Promise<{ sentCount: number; recipients: string[] }> {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) {
    throw new Error(`Blog post with slug '${slug}' not found.`);
  }

  const subscribers = await getActiveSubscribers();
  if (subscribers.length === 0) {
    return { sentCount: 0, recipients: [] };
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.CONTACT_EMAIL || "support@vouchedge.xyz";
  const baseUrl = getSafePublicOrigin();
  const postUrl = `${baseUrl}/blog/${post.slug}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000000; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
      <div style="padding: 32px 24px; background: linear-gradient(180deg, #050f18 0%, #000000 100%); border-bottom: 1px solid rgba(34, 211, 238, 0.2);">
        <div style="font-family: monospace; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">
          // NEW TRANSMISSION · ${post.tag.toUpperCase()}
        </div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; line-height: 1.3;">
          ${post.title}
        </h1>
        <div style="margin-top: 8px; font-family: monospace; font-size: 11px; color: #64748b;">
          ${post.date} · BY ${post.author.toUpperCase()}
        </div>
      </div>

      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">
          ${post.excerpt}
        </p>

        <div style="margin: 28px 0; text-align: center;">
          <a href="${postUrl}" style="display: inline-block; background: #22d3ee; color: #000000; font-family: monospace; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; text-decoration: none; border-radius: 4px;">
            Read Full Transmission →
          </a>
        </div>
      </div>

      <div style="padding: 16px 24px; background: #050a10; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #475569; text-align: center; font-family: monospace;">
        VouchEdge · Dartmouth, NS, Canada 🇨🇦 · <a href="${baseUrl}/" style="color: #38bdf8; text-decoration: none;">vouchedge.xyz</a>
      </div>
    </div>
  `;

  if (apiKey) {
    sgMail.setApiKey(apiKey);
    const messages = subscribers.map((email) => ({
      to: email,
      from: fromEmail,
      subject: `[VouchEdge Transmission] ${post.title}`,
      html,
      text: `${post.title}\n\n${post.excerpt}\n\nRead more at ${postUrl}`,
    }));

    await sgMail.send(messages);
  } else {
    console.log(`[newsletter] Dev broadcast simulation of '${post.title}' to ${subscribers.length} subscribers:`, subscribers);
  }

  return { sentCount: subscribers.length, recipients: subscribers };
}
