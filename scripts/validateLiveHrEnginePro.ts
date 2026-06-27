const TODAY_URL = "https://vouchres.vercel.app/api/mlb/hr-board/today?previewLimit=50";
const DEFAULT_PRO_V2_URL = "https://vouchres.vercel.app/api/mlb/hr-board/pro-v2?previewLimit=50";
const PRO_V2_URL = process.env.PRO_V2_URL || DEFAULT_PRO_V2_URL;

const BAD_PAIRINGS = new Set([
  "Pete Alonso|BAL",
  "Willson Contreras|BOS",
  "Bo Bichette|NYM",
  "Alex Bregman|CHC",
  "Brandon Lowe|PIT",
  "Rhys Hoskins|CLE",
  "Rob Refsnyder|SEA",
]);

type LiveRow = {
  playerName?: string;
  team?: string;
  opponentPitcherName?: string | null;
  gamePk?: number | string;
  scoreBreakdown?: unknown;
  recentForm?: unknown;
  [key: string]: unknown;
};

type LiveBoard = {
  url: string;
  httpStatus: number;
  protectedPreview?: boolean;
  redirectLocation?: string | null;
  status?: string;
  runtime?: string;
  source?: string;
  runtimeRoute?: string;
  projectedCandidates?: LiveRow[];
  candidates?: LiveRow[];
  count?: number;
  rankedCount?: number;
  previewMeta?: Record<string, unknown>;
  debug?: Record<string, unknown>;
  raw: any;
};

function keyOf(row: { playerName?: string; team?: string }) {
  return `${row.playerName ?? ""}|${row.team ?? ""}`;
}

function countBy(rows: LiveRow[], selector: (row: LiveRow) => string) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = selector(row) || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function formatCounts(rows: LiveRow[], selector: (row: LiveRow) => string) {
  return countBy(rows, selector)
    .map(([key, count]) => `${key}:${count}`)
    .join(", ");
}

async function fetchBoard(url: string): Promise<LiveBoard> {
  const response = await fetch(url, {
    redirect: "manual",
  });
  const text = await response.text();
  const location = response.headers.get("location");

  if (response.status >= 300 && response.status < 400) {
    return {
      url,
      httpStatus: response.status,
      protectedPreview: true,
      redirectLocation: location,
      raw: {
        redirectLocation: location,
        nonJsonBody: text,
      },
    };
  }

  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = { nonJsonBody: text };
  }

  const payload = raw?.payload ?? raw ?? {};

  return {
    url,
    httpStatus: response.status,
    protectedPreview: false,
    redirectLocation: location,
    status: payload?.status ?? raw?.status,
    runtime: payload?.runtime ?? raw?.runtime,
    source: payload?.source ?? raw?.source,
    runtimeRoute: payload?.runtimeRoute ?? raw?.runtimeRoute,
    projectedCandidates: payload?.projectedCandidates ?? raw?.projectedCandidates ?? [],
    candidates: payload?.candidates ?? raw?.candidates ?? [],
    count: payload?.count ?? raw?.count,
    rankedCount: payload?.rankedCount ?? raw?.rankedCount,
    previewMeta: payload?.previewMeta ?? raw?.previewMeta,
    debug: payload?.debug ?? raw?.debug,
    raw,
  };
}

function printTop20(rows: LiveRow[]) {
  for (const [index, row] of rows.slice(0, 20).entries()) {
    console.log(
      `${String(index + 1).padStart(2, "0")}. ${row.playerName ?? "Unknown"} | ${row.team ?? "?"} | ${
        row.opponentPitcherName ?? "None"
      }`
    );
  }
}

function printBoard(board: LiveBoard) {
  if (board.protectedPreview) {
    console.log(`\n=== ${board.url} ===`);
    console.log("httpStatus:", board.httpStatus);
    console.log("Preview route is protected by Vercel SSO/auth. Open in browser or use a public deployment URL.");
    console.log("redirectLocation:", board.redirectLocation ?? "n/a");
    return;
  }

  const projected = board.projectedCandidates ?? [];
  const candidates = board.candidates ?? [];
  const top20 = projected.slice(0, 20);
  const suspiciousRows = top20.filter((row) => BAD_PAIRINGS.has(keyOf(row)));
  const hasScoreBreakdown = top20.some((row) => row.scoreBreakdown != null);
  const hasRecentForm = top20.some((row) => row.recentForm != null);
  const badPairingAuditBlocked = board.debug?.badPairingAuditBlocked;

  console.log(`\n=== ${board.url} ===`);
  console.log("httpStatus:", board.httpStatus);
  console.log("status:", board.status ?? "unknown");
  console.log("runtime:", board.runtime ?? "unknown");
  console.log("source:", board.source ?? "unknown");
  console.log("runtimeRoute:", board.runtimeRoute ?? "n/a");
  console.log("projectedCandidates count:", projected.length);
  console.log("candidate count:", candidates.length);
  console.log("count field:", board.count ?? "n/a");
  console.log("rankedCount field:", board.rankedCount ?? "n/a");
  console.log("previewMeta:", board.previewMeta ?? "n/a");
  console.log("scoreBreakdown exists:", hasScoreBreakdown);
  console.log("recentForm exists:", hasRecentForm);
  console.log("badPairingAuditBlocked:", badPairingAuditBlocked ?? "n/a");

  console.log("\nTop 20:");
  printTop20(top20);

  console.log("\nTop 20 distribution by team:");
  console.log(formatCounts(top20, (row) => row.team ?? "unknown"));

  console.log("\nTop 20 distribution by gamePk:");
  console.log(formatCounts(top20, (row) => String(row.gamePk ?? "unknown")));

  console.log("\nSuspicious known bad pairs if present:");
  if (suspiciousRows.length === 0) {
    console.log("none");
  } else {
    for (const row of suspiciousRows) {
      console.log(`${row.playerName ?? "Unknown"} | ${row.team ?? "?"}`);
    }
  }
}

async function main() {
  const today = await fetchBoard(TODAY_URL);
  const proV2 = await fetchBoard(PRO_V2_URL);

  printBoard(today);
  printBoard(proV2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
