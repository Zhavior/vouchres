import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const [liveRes, boardRes] = await Promise.allSettled([
      fetch(`${origin}/api/mlb/live`, { cache: "no-store" }),
      fetch(`${origin}/api/mlb/hr-board/today?previewLimit=3`, {
        cache: "no-store",
      }),
    ]);

    const live =
      liveRes.status === "fulfilled" && liveRes.value.ok
        ? await liveRes.value.json()
        : {};

    const board =
      boardRes.status === "fulfilled" && boardRes.value.ok
        ? await boardRes.value.json()
        : { rows: [] };

    const rows = board.rows ?? board.data?.rows ?? [];

    return NextResponse.json({
      hero: {
        gamesTonight: live.gamesTonight ?? null,
        lastUpdated: new Date().toISOString(),
        confidence: live.confidence ?? null,
      },

      pulse: [
        `${rows.length} HR candidates loaded`,
        "AI models synchronized",
        "Community tracking tonight's slate",
      ],

      featuredVouches: rows.slice(0, 3),

      stats: {
        games: live.gamesTonight ?? 0,
        candidates: rows.length,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        hero: {},
        pulse: [],
        featuredVouches: [],
        stats: {},
      },
      { status: 500 }
    );
  }
}
