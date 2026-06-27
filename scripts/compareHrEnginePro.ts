import { buildHrBoardResponse } from "../server/services/mlb/hr-engine";

const PRODUCTION_URL = "https://vouchres.vercel.app/api/mlb/hr-board/today?previewLimit=50";
const BAD_PAIRINGS = new Set([
  "Pete Alonso|BAL",
  "Willson Contreras|BOS",
  "Bo Bichette|NYM",
  "Alex Bregman|CHC",
  "Brandon Lowe|PIT",
  "Rhys Hoskins|CLE",
  "Rob Refsnyder|SEA",
]);

type AnyBoard = {
  runtime?: string;
  source?: string;
  projectedCandidates?: Array<{
    playerName?: string;
    team?: string;
    opponentPitcherName?: string | null;
  } & Record<string, unknown>>;
  previewMeta?: {
    eligiblePreviewPoolCount?: number;
    scoredPreviewPoolCount?: number;
    projectedPreviewCount?: number;
  };
};

function normalizeBoard(raw: any): AnyBoard {
  return raw?.payload ?? raw ?? {};
}

function keyOf(row: { playerName?: string; team?: string }) {
  return `${row.playerName ?? ""}|${row.team ?? ""}`;
}

function top20(board: AnyBoard) {
  return (board.projectedCandidates ?? []).slice(0, 20);
}

function countBy(
  rows: AnyBoard["projectedCandidates"],
  selector: (row: NonNullable<AnyBoard["projectedCandidates"]>[number]) => string
) {
  const counts = new Map<string, number>();

  for (const row of rows ?? []) {
    const key = selector(row) || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function printBoardHeader(label: string, board: AnyBoard) {
  console.log(`\n=== ${label} ===`);
  console.log("runtime:", board.runtime ?? "unknown");
  console.log("source:", board.source ?? "unknown");
  console.log("projectedCandidates:", board.projectedCandidates?.length ?? 0);
  console.log("eligiblePreviewPoolCount:", board.previewMeta?.eligiblePreviewPoolCount ?? "n/a");
  console.log("scoredPreviewPoolCount:", board.previewMeta?.scoredPreviewPoolCount ?? "n/a");
}

function formatTop20Row(
  index: number,
  row: { playerName?: string; team?: string; opponentPitcherName?: string | null } | undefined
) {
  return `${String(index + 1).padStart(2, "0")}. ${row?.playerName ?? "Unknown"} | ${row?.team ?? "?"} | ${
    row?.opponentPitcherName ?? "None"
  }`;
}

function printTop20SideBySide(localRows: AnyBoard["projectedCandidates"], productionRows: AnyBoard["projectedCandidates"]) {
  const leftHeader = "HR Engine Pro v2 Top 20";
  const rightHeader = "Production Top 20";
  const leftWidth = 54;

  console.log(`\n${leftHeader.padEnd(leftWidth)} | ${rightHeader}`);

  for (let index = 0; index < 20; index += 1) {
    const left = formatTop20Row(index, localRows?.[index]);
    const right = formatTop20Row(index, productionRows?.[index]);
    console.log(`${left.padEnd(leftWidth)} | ${right}`);
  }
}

function printDistribution(label: string, rows: AnyBoard["projectedCandidates"]) {
  console.log(`\n${label} Top 20 distribution`);
  console.log(
    "by team:",
    countBy(rows, (row) => row.team ?? "unknown")
      .map(([key, count]) => `${key}:${count}`)
      .join(", ")
  );
  console.log(
    "by gamePk:",
    countBy(rows, (row) => String(row.gamePk ?? "unknown"))
      .map(([key, count]) => `${key}:${count}`)
      .join(", ")
  );
  console.log(
    "by opponentPitcherName:",
    countBy(rows, (row) => row.opponentPitcherName ?? "None")
      .map(([key, count]) => `${key}:${count}`)
      .join(", ")
  );
  console.log(
    "by venue:",
    countBy(rows, (row) => String(row.venue ?? "unknown"))
      .map(([key, count]) => `${key}:${count}`)
      .join(", ")
  );
}

async function fetchProductionBoard() {
  const response = await fetch(PRODUCTION_URL);
  const raw = await response.json();
  return normalizeBoard(raw);
}

async function main() {
  const localBoard = normalizeBoard(
    await buildHrBoardResponse({
      previewLimit: 50,
    })
  );

  const productionBoard = await fetchProductionBoard();

  const localTop20 = top20(localBoard);
  const productionTop20 = top20(productionBoard);

  const localKeys = new Set(localTop20.map(keyOf));
  const productionKeys = new Set(productionTop20.map(keyOf));
  const overlapCount = [...localKeys].filter((key) => productionKeys.has(key)).length;

  const missingPitchers = [
    ...localTop20.map((row) => ({ source: "HR Engine Pro v2", ...row })),
    ...productionTop20.map((row) => ({ source: "production", ...row })),
  ].filter((row) => !row.opponentPitcherName);

  const suspiciousRows = [
    ...localTop20.map((row) => ({ source: "HR Engine Pro v2", ...row })),
    ...productionTop20.map((row) => ({ source: "production", ...row })),
  ].filter((row) => BAD_PAIRINGS.has(keyOf(row)));

  printBoardHeader("HR Engine Pro v2", localBoard);
  printBoardHeader("Production", productionBoard);

  console.log("\nOverlap count by playerName + team:", overlapCount);

  console.log("\nRows in either Top 20 with missing opponentPitcherName:");
  if (missingPitchers.length === 0) {
    console.log(" - none");
  } else {
    for (const row of missingPitchers) {
      console.log(` - [${row.source}] ${row.playerName ?? "Unknown"} | ${row.team ?? "?"}`);
    }
  }

  console.log("\nSuspicious known bad pairs if present:");
  if (suspiciousRows.length === 0) {
    console.log(" - none");
  } else {
    for (const row of suspiciousRows) {
      console.log(` - [${row.source}] ${row.playerName ?? "Unknown"} | ${row.team ?? "?"}`);
    }
  }

  printTop20SideBySide(localTop20, productionTop20);
  printDistribution("HR Engine Pro v2", localTop20);
  printDistribution("Production", productionTop20);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
