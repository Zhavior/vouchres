import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { to, subject, text, html } = await request.json();
    const msg = { to, from: "support@vouchedge.xyz", subject, text, html };
    await sgMail.send(msg);
    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("SendGrid error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}