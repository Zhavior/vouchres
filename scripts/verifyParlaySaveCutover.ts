import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function includesAll(source: string, snippets: string[], label: string): void {
  for (const snippet of snippets) {
    assert(source.includes(snippet), `${label} missing: ${snippet}`);
  }
}

function main() {
  const handlers = read("server/v3/modules/parlays/handlers.ts");
  const routes = read("server/v3/modules/parlays/routes.ts");
  const controller = read("server/controllers/parlayController.ts");
  const userRoutes = read("server/routes/parlay/parlayUserRoutes.ts");

  includesAll(handlers, [
    "export async function buildV3ParlaySavePayload",
    "return saveUserParlay({",
    "export async function sendV3ParlaySaveResponse",
  ], "V3 parlay save handlers");

  includesAll(routes, [
    '"/parlays/save"',
    "requireLegalConfirmed",
    "validate({ body: SaveMeParlaySchema })",
    "sendV3ParlaySaveResponse(req, res, { includeVersion: true })",
  ], "V3 parlay save route");

  includesAll(controller, [
    "sendV3ParlaySaveResponse(req, res)",
  ], "legacy controller cutover");

  includesAll(userRoutes, [
    '"/parlays/save"',
    "saveMeParlayHandler",
  ], "legacy save route surface");

  console.log(JSON.stringify({
    ok: true,
    mode: "parlay_save_cutover_static_verify",
    checkedAt: new Date().toISOString(),
    verified: {
      sharedSaveHandlerExists: true,
      v3SaveRouteMounted: true,
      legacySaveControllerUsesSharedHandler: true,
      legacyRouteSurfaceStillPresent: true,
    },
  }, null, 2));
}

main();
