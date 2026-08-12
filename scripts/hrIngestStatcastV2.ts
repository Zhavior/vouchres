import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { HistoricalStatcastRow } from "../server/services/mlb/hr-engine/v2/backtest";

const LABEL = "[hr-v2-ingest]";
const SOURCE = "Baseball Savant Statcast Search" as const;

function arg(name: string): string | null {
  const value = process.argv.find((item) => item.startsWith(`--${name}=`));
  return value ? value.slice(name.length + 3) : null;
}

function required(name: string): string {
  const value = arg(name);
  if (!value) throw new Error(`--${name}=... is required`);
  return value;
}

function numeric(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integer(value: unknown): number | null {
  const parsed = numeric(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function hand(value: unknown): "L" | "R" | "S" | null {
  return value === "L" || value === "R" || value === "S" ? value : null;
}

function csvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (quoted && character === '"' && line[index + 1] === '"') { value += '"'; index++; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { values.push(value); value = ""; continue; }
    value += character;
  }
  values.push(value);
  return values;
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = csvLine(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(csvLine(line).map((value, index) => [headers[index], value ?? ""])));
}

function previousDate(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

function nextDate(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

function requestChunks(from: string, to: string): Array<[string, string]> {
  const chunks: Array<[string, string]> = [];
  // Savant caps large CSV responses and may silently return only the tail of a
  // long window. Six-day chunks stay below that cap for regular-season data.
  for (let cursor = from; cursor <= to;) {
    const chunkEnd = addDays(cursor, 5) < to ? addDays(cursor, 5) : to;
    chunks.push([cursor, chunkEnd]);
    cursor = addDays(chunkEnd, 1);
  }
  return chunks;
}

function statcastUrl(from: string, to: string): string {
  const params = new URLSearchParams({
    all: "true",
    type: "batter",
    hfGT: "R|",
    game_date_gt: previousDate(from),
    game_date_lt: nextDate(to),
    player_type: "batter",
    group_by: "name",
    min_pas: "0",
    min_pitches: "0",
    min_results: "0",
    sort_col: "game_date",
    sort_order: "asc",
  });
  return `https://baseballsavant.mlb.com/statcast_search/csv?${params.toString()}`;
}

function normalize(rows: Array<Record<string, string>>, retrievedAt: string, from: string, to: string): HistoricalStatcastRow[] {
  const byPa = new Map<string, Record<string, string>>();
  for (const row of rows) {
    const gameDate = row.game_date;
    if (!gameDate || gameDate < from || gameDate > to) continue;
    const gameId = row.game_pk;
    const batterId = integer(row.batter);
    const pitcherId = integer(row.pitcher);
    const atBat = row.at_bat_number;
    if (!gameDate || !gameId || !batterId || !pitcherId || !atBat) continue;
    const key = `${gameId}:${atBat}:${batterId}`;
    const previous = byPa.get(key);
    const pitchNumber = numeric(row.pitch_number) ?? 0;
    const previousPitchNumber = previous ? numeric(previous.pitch_number) ?? 0 : -1;
    if (!previous || pitchNumber >= previousPitchNumber) byPa.set(key, row);
  }

  return [...byPa.values()].map((row) => {
    const exitVelocity = numeric(row.launch_speed);
    const launchAngle = numeric(row.launch_angle);
    const pitchType = row.pitch_type || null;
    const event = (row.events || "").toLowerCase();
    const launchSpeedAngle = row.launch_speed_angle || "";
    const batterTeam = row.batting_team || (row.inning_topbot === "Top" ? row.away_team : row.inning_topbot === "Bot" ? row.home_team : "") || null;
    const opponentTeam = batterTeam === row.home_team ? row.away_team || null : batterTeam === row.away_team ? row.home_team || null : null;
    return {
      gameId: row.game_pk,
      gameDate: row.game_date,
      firstPitchAt: null,
      batterId: integer(row.batter)!,
      pitcherId: integer(row.pitcher)!,
      batterTeam,
      opponentTeam,
      parkId: row.stadium_name || row.home_team || null,
      batterHand: hand(row.stand),
      pitcherHand: row.p_throws === "L" || row.p_throws === "R" ? row.p_throws : null,
      pitchType,
      plateAppearanceId: `${row.game_pk}:${row.at_bat_number}:${row.batter}`,
      homeRunOutcome: event === "home_run" ? 1 : 0,
      exitVelocity,
      launchAngle,
      barrelFlag: launchSpeedAngle === "6" ? 1 : exitVelocity != null && launchAngle != null && exitVelocity >= 98 && launchAngle >= 26 && launchAngle <= 30 ? 1 : 0,
      hardHitFlag: exitVelocity == null ? null : exitVelocity >= 95 ? 1 : 0,
      sprayDirection: null,
      lineupSlot: null,
      startingLineupConfirmed: null,
      source: SOURCE,
      sourceRetrievedAt: retrievedAt,
      featureCutoffAt: new Date(Date.parse(`${row.game_date}T00:00:00Z`) - 1).toISOString(),
    } satisfies HistoricalStatcastRow;
  });
}

async function main(): Promise<void> {
  const from = required("from");
  const to = required("to");
  const output = arg("output") ?? "artifacts/hr-engine-v2/statcast-raw.json";
  const concurrency = Math.min(4, Math.max(1, Number(arg("concurrency") ?? "3")));
  if (!Number.isInteger(concurrency)) throw new Error("--concurrency must be an integer from 1 to 4");
  console.log(`${LABEL} downloading official Statcast CSV ${from}..${to}`);
  const retrievedAt = new Date().toISOString();
  const normalized: HistoricalStatcastRow[] = [];
  const chunks = requestChunks(from, to);
  for (let offset = 0; offset < chunks.length; offset += concurrency) {
    const batch = chunks.slice(offset, offset + concurrency);
    const results = await Promise.all(batch.map(async ([chunkFrom, chunkTo]) => {
      const url = statcastUrl(chunkFrom, chunkTo);
      console.log(`${LABEL} chunk=${chunkFrom}..${chunkTo}`);
      const response = await fetch(url, { headers: { accept: "text/csv" } });
      if (!response.ok) throw new Error(`Statcast CSV returned HTTP ${response.status} for ${chunkFrom}..${chunkTo}`);
      return normalize(parseCsv(await response.text()), retrievedAt, chunkFrom, chunkTo);
    }));
    normalized.push(...results.flat());
  }
  const deduped = new Map(normalized.map((row) => [row.plateAppearanceId, row]));
  const rows = [...deduped.values()].sort((a, b) => `${a.gameDate}:${a.plateAppearanceId}`.localeCompare(`${b.gameDate}:${b.plateAppearanceId}`));
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`${LABEL} wrote ${rows.length} plate-appearance rows to ${output}`);
}

main().catch((error) => {
  console.error(`${LABEL} failed:`, error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
