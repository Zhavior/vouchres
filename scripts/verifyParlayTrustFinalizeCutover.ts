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
  const service = read("server/services/parlays/userParlayService.ts");

  includesAll(handlers, [
    "export async function buildV3ParlayTrustFinalizePayload",
    "return finalizeParlayTrustLock(input);",
    "export async function sendV3ParlayTrustFinalizeResponse",
    'message: "Parlay is not ready to lock yet."',
  ], "V3 parlay trust finalize handlers");

  includesAll(routes, [
    '"/parlays/:id/finalize-trust-lock"',
    "sendV3ParlayTrustFinalizeResponse(req, res, { includeVersion: true })",
  ], "V3 parlay trust finalize route");

  includesAll(controller, [
    "sendV3ParlayTrustFinalizeResponse(req, res)",
  ], "legacy trust finalize cutover");

  includesAll(userRoutes, [
    '"/parlays/:id/finalize-trust-lock"',
    "finalizeParlayTrustLockHandler",
  ], "legacy trust finalize route surface");

  includesAll(service, [
    "if (!existing.committed_at) return null;",
    "if (trustLockAt > Date.now()) return null;",
    "auditAction: \"lock_trust_ledger\"",
  ], "trust finalize domain invariants");

  console.log(JSON.stringify({
    ok: true,
    mode: "parlay_trust_finalize_cutover_static_verify",
    checkedAt: new Date().toISOString(),
    verified: {
      sharedTrustFinalizeHandlerExists: true,
      v3TrustFinalizeRouteMounted: true,
      legacyTrustFinalizeUsesSharedHandler: true,
      legacyRouteSurfaceStillPresent: true,
      trustFinalizeWindowGuardPresent: true,
    },
  }, null, 2));
}

main();
