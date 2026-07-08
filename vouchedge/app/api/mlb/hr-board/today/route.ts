import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    rows: [
      { id: "1", player: "A. Judge", team: "NYY", pitcher: "G. Cole", confidence: 84.4, line: "+410" },
      { id: "2", player: "R. Devers", team: "BOS", pitcher: "T. Houck", confidence: 81.2, line: "+360" }
    ]
  });
}
