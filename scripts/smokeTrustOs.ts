const baseUrl = (process.env.SMOKE_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const FAKE_PICK_ID = "00000000-0000-4000-8000-000000000001";

async function fetchJson(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body, text };
}

function isProofNotFoundHtml(html: string): boolean {
  return /not available|isn't available/i.test(html);
}

function looksLikeSpaShell(html: string): boolean {
  return html.includes('id="root"') || html.includes("/assets/index-") || html.includes("VouchEdge");
}

async function main() {
  console.log(`TrustOS smoke target: ${baseUrl}\n`);

  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

  const health = await fetchJson("/api/health");
  checks.push({
    name: "health",
    ok: health.response.ok,
    detail: `status ${health.response.status}`,
  });

  const proofMissing = await fetchJson(`/api/proof/parlay/${FAKE_PICK_ID}`);
  checks.push({
    name: "proof parlay missing -> 404",
    ok: proofMissing.response.status === 404,
    detail: `status ${proofMissing.response.status}`,
  });

  const otsMissing = await fetch(`${baseUrl}/api/proof/parlay/${FAKE_PICK_ID}/ots`, {
    headers: { Accept: "application/vnd.opentimestamps.ots" },
  });
  checks.push({
    name: "proof ots missing -> 404",
    ok: otsMissing.status === 404,
    detail: `status ${otsMissing.status}`,
  });

  const proofPage = await fetch(`${baseUrl}/p/${FAKE_PICK_ID}`, {
    headers: { Accept: "text/html" },
  });
  const proofHtml = await proofPage.text();
  const proofPageOk = proofPage.status === 404 && isProofNotFoundHtml(proofHtml);
  checks.push({
    name: "proof page route (server HTML 404)",
    ok: proofPageOk,
    detail: proofPageOk
      ? `status ${proofPage.status}`
      : proofPage.status === 200 && looksLikeSpaShell(proofHtml)
        ? "status 200 SPA shell — restart dev server or add /p rewrite on Vercel"
        : `status ${proofPage.status}`,
  });

  const repairCron = await fetchJson("/api/cron/parlays/repair-identity?dryRun=true&limit=1");
  checks.push({
    name: "repair-identity cron auth gate",
    ok: repairCron.response.status === 401,
    detail: repairCron.response.status === 404
      ? "status 404 — restart dev server or deploy PR #61"
      : `status ${repairCron.response.status}`,
  });

  const anchorCron = await fetchJson("/api/cron/parlays/anchor-ots?limit=1");
  checks.push({
    name: "anchor-ots cron auth gate",
    ok: anchorCron.response.status === 401,
    detail: anchorCron.response.status === 404
      ? "status 404 — restart dev server or deploy PR #61"
      : `status ${anchorCron.response.status}`,
  });

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} · ${check.name} · ${check.detail}`);
  }

  const apiChecks = checks.filter((check) =>
    check.name.startsWith("health")
    || check.name.startsWith("proof parlay")
    || check.name.startsWith("proof ots"),
  );
  const apiPassed = apiChecks.every((check) => check.ok);

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    console.log("");
    if (apiPassed) {
      console.log("Core TrustOS API checks passed. Remaining failures are usually:");
      console.log("  • Dev server not restarted after git checkout → run: npm run dev");
      console.log("  • Vercel /p/:id rewrite missing → merge latest vercel.json from PR #61");
    }
    throw new Error(`TrustOS smoke failed (${failed.length}/${checks.length})`);
  }

  console.log(`\nTrustOS smoke passed (${checks.length} checks) against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
