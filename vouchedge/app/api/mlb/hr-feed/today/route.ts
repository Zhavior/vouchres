import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: [
      { id: "1", player: "A. Judge", team: "NYY", confidence: 84.4, line: "+410" },
      { id: "2", player: "R. Devers", team: "BOS", confidence: 81.2, line: "+360" }
    ]
  });
}
