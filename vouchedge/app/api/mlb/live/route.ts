import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ ok: true, confidence: 84.4, line: "-118" });
}
