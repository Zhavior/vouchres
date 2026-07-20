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
    "export async function buildV3ParlayTrustCommitPayload",
    "return commitParlayTrustLedger(input);",
    "export async function sendV3ParlayTrustCommitResponse",
  ], "V3 parlay trust commit handlers");

  includesAll(routes, [
    '"/parlays/:id/commit-trust"',
    "sendV3ParlayTrustCommitResponse(req, res, { includeVersion: true })",
  ], "V3 parlay trust commit route");

  includesAll(controller, [
    "sendV3ParlayTrustCommitResponse(req, res)",
  ], "legacy trust commit cutover");

  includesAll(userRoutes, [
    '"/parlays/:id/commit-trust"',
    "commitParlayTrustHandler",
  ], "legacy trust commit route surface");

  includesAll(service, [
    "Complete canonical leg identity before locking to the trust ledger.",
    "action: \"commit_trust_pending\"",
  ], "trust commit domain invariants");

  console.log(JSON.stringify({
    ok: true,
    mode: "parlay_trust_commit_cutover_static_verify",
    checkedAt: new Date().toISOString(),
    verified: {
      sharedTrustCommitHandlerExists: true,
      v3TrustCommitRouteMounted: true,
      legacyTrustCommitUsesSharedHandler: true,
      legacyRouteSurfaceStillPresent: true,
      trustCommitIdentityGuardPresent: true,
    },
  }, null, 2));
}

main();
