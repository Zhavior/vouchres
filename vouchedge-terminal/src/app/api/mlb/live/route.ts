import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      games: [],
      updatedAt: new Date().toISOString(),
      source: "local-placeholder",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    }
  );
}
