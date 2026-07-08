import { NextResponse } from "next/server";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Temporary backend login until real DB/auth is connected.
    // Accepts any valid-looking email + password length >= 6.
    if (!email.includes("@") || password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: "demo-user",
        email,
        plan: "pro",
      },
      token: `vouchedge_demo_${Date.now()}`,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid login request." },
      { status: 400 }
    );
  }
}
