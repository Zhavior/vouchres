import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  buildPregameFeatures,
  calculateMetrics,
  fitLogisticCoefficients,
  predict,
  type ChronologicalSplitConfig,
  type HistoricalStatcastRow,
} from "../server/services/mlb/hr-engine/v2/backtest";

const LABEL = "[hr-v2-backtest]";

function arg(name: string): string | null {
  const value = process.argv.find((item) => item.startsWith(`--${name}=`));
  return value ? value.slice(name.length + 3) : null;
}

function required(name: string): string {
  const value = arg(name);
  if (!value) throw new Error(`--${name}=... is required`);
  return value;
}

async function main(): Promise<void> {
  const inputPath = required("input");
  const outputPath = arg("output") ?? "artifacts/hr-engine-v2/backtest.json";
  const config: ChronologicalSplitConfig = {
    trainEnd: arg("train-end") ?? "2024-10-01",
    calibrationEnd: arg("calibration-end") ?? "2025-07-01",
  };
  const sourceRows = JSON.parse(await readFile(inputPath, "utf8")) as HistoricalStatcastRow[];
  const rows = buildPregameFeatures(sourceRows, config);
  const train = rows.filter((row) => row.split === "train");
  const calibration = rows.filter((row) => row.split === "calibration");
  const test = rows.filter((row) => row.split === "test");
  if (!train.length || !calibration.length || !test.length) {
    throw new Error(`All chronological splits need rows; train=${train.length} calibration=${calibration.length} test=${test.length}`);
  }

  const coefficients = fitLogisticCoefficients(train);
  const calibrationPredictions = calibration.map((row) => predict(row, coefficients));
  const calibrationRate = calibration.reduce((sum, row) => sum + row.homeRunOutcome, 0) / calibration.length;
  const calibrationScale = calibrationRate / Math.max(1e-9, calibrationPredictions.reduce((sum, value) => sum + value, 0) / calibration.length);
  const calibrated = (row: typeof calibration[number]) => Math.min(0.99, Math.max(0.001, predict(row, coefficients) * calibrationScale));
  const testPredictions = test.map(calibrated);
  const testRate = train.reduce((sum, row) => sum + row.homeRunOutcome, 0) / train.length;
  const report = {
    schemaVersion: "hr-v2-backtest.v1",
    model: {
      modelVersion: "hr-probability-v2-backtest-logit-v1",
      featureSchemaVersion: "pregame-history-v1",
      calibrationMethod: "heldout-prevalence-scaling",
    },
    generatedAt: new Date().toISOString(),
    sources: ["MLB Baseball Savant / Statcast Search CSV"],
    featureCutoffRule: "features use only rows before the current game date; no random split",
    split: config,
    sourceRowCount: sourceRows.length,
    rowCount: rows.length,
    splitCounts: { train: train.length, calibration: calibration.length, test: test.length },
    missingRates: Object.fromEntries([
      "exitVelocity", "launchAngle", "barrelFlag", "hardHitFlag", "pitchType", "lineupSlot",
    ].map((field) => [field, sourceRows.length ? sourceRows.filter((row) => row[field as keyof HistoricalStatcastRow] == null).length / sourceRows.length : null])),
    coefficients,
    calibration: calculateMetrics(calibration, calibrationPredictions, testRate),
    finalTest: calculateMetrics(test, testPredictions, testRate),
    dataQuality: Object.fromEntries(["HIGH", "MEDIUM", "LOW"].map((quality) => {
      const subset = test.filter((row) => row.dataQuality === quality);
      return [quality, calculateMetrics(subset, subset.map(calibrated), testRate)];
    })),
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${LABEL} wrote ${outputPath}`);
  console.log(`${LABEL} rows=${rows.length} train=${train.length} calibration=${calibration.length} test=${test.length}`);
  console.log(`${LABEL} final_test=${JSON.stringify(report.finalTest)}`);
}

main().catch((error) => {
  console.error(`${LABEL} failed:`, error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
