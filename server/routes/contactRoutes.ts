import { Router } from "express";
import type { Response } from "express";
import sgMail from "@sendgrid/mail";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import type { RequestWithContext } from "../middleware/requestContext";
import { generationLimiter } from "../middleware/rateLimit";

export const contactRoutes = Router();

contactRoutes.post(
  "/contact",
  generationLimiter,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const { email, subject, message } = req.body ?? {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new AppError({
        status: 400,
        code: "invalid_email",
        message: "A valid email address is required.",
      });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      throw new AppError({
        status: 400,
        code: "invalid_message",
        message: "Message payload cannot be empty.",
      });
    }

    const cleanSubject = String(subject || "General Inquiry").trim();
    const cleanEmail = email.trim();
    const cleanMessage = String(message).trim();

    const apiKey = process.env.SENDGRID_API_KEY;
    const recipientEmail = process.env.CONTACT_EMAIL || "support@vouchedge.xyz";

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      const msg = {
        to: recipientEmail,
        from: recipientEmail, // Verified sender in SendGrid
        replyTo: cleanEmail,
        subject: `[VouchEdge Contact] ${cleanSubject} - from ${cleanEmail}`,
        text: `New Transmission from VouchEdge Contact Form:\n\nFrom: ${cleanEmail}\nSubject: ${cleanSubject}\n\nMessage:\n${cleanMessage}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #e2e8f0; border-radius: 12px; padding: 24px; border: 1px solid #1e293b;">
            <h2 style="color: #38bdf8; margin-top: 0;">New Transmission Received</h2>
            <p style="color: #94a3b8; font-size: 14px;"><strong>From:</strong> <a href="mailto:${cleanEmail}" style="color: #38bdf8;">${cleanEmail}</a></p>
            <p style="color: #94a3b8; font-size: 14px;"><strong>Subject:</strong> ${cleanSubject}</p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
            <h3 style="color: #f8fafc; font-size: 16px;">Payload:</h3>
            <div style="background: #020617; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; color: #f1f5f9; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${cleanMessage}</div>
            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Transmitted securely via VouchEdge System Node.</p>
          </div>
        `,
      };

      try {
        await sgMail.send(msg);
      } catch (err: any) {
        console.error("[contact] SendGrid error:", err?.response?.body || err?.message || err);
        // If SendGrid key is present but failing, log error
      }
    } else {
      console.log(`[contact] (Dev / No SENDGRID_API_KEY) Received message from ${cleanEmail} [${cleanSubject}]:`, cleanMessage);
    }

    return res.json(
      apiOkFlat(req, {
        delivered: true,
        message: "Transmission received and logged.",
      })
    );
  })
);

// Retain compatibility with existing send-email pattern if called directly
contactRoutes.post(
  "/send-email",
  generationLimiter,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const { to, subject, text, html } = req.body ?? {};
    const apiKey = process.env.SENDGRID_API_KEY;

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      await sgMail.send({
        to: to || "support@vouchedge.xyz",
        from: "support@vouchedge.xyz",
        subject: subject || "VouchEdge Notification",
        text: text || "",
        html: html || text || "",
      });
      return res.json(apiOkFlat(req, { success: true, message: "Email sent successfully" }));
    } else {
      console.log(`[send-email] Dev mode simulation to ${to}: ${subject}`);
      return res.json(apiOkFlat(req, { success: true, message: "Simulated in dev (no API key)" }));
    }
  })
);
