import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      players: [],
      updatedAt: new Date().toISOString(),
      source: "local-placeholder",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}
