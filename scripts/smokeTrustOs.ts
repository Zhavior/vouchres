const baseUrl = (process.env.SMOKE_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

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
  return { response, body };
}

async function main() {
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

  const health = await fetchJson("/api/health");
  checks.push({
    name: "health",
    ok: health.response.ok,
    detail: `status ${health.response.status}`,
  });

  const proofMissing = await fetchJson("/api/proof/parlay/00000000-0000-4000-8000-000000000001");
  checks.push({
    name: "proof parlay missing -> 404",
    ok: proofMissing.response.status === 404,
    detail: `status ${proofMissing.response.status}`,
  });

  const otsMissing = await fetch(`${baseUrl}/api/proof/parlay/00000000-0000-4000-8000-000000000001/ots`, {
    headers: { Accept: "application/vnd.opentimestamps.ots" },
  });
  checks.push({
    name: "proof ots missing -> 404",
    ok: otsMissing.status === 404,
    detail: `status ${otsMissing.status}`,
  });

  const proofPage = await fetch(`${baseUrl}/p/00000000-0000-4000-8000-000000000001`, {
    headers: { Accept: "text/html" },
  });
  const proofHtml = await proofPage.text();
  checks.push({
    name: "proof page route",
    ok: proofPage.status === 404 && proofHtml.includes("not available"),
    detail: `status ${proofPage.status}`,
  });

  const repairCron = await fetchJson("/api/cron/parlays/repair-identity?dryRun=true&limit=1");
  checks.push({
    name: "repair-identity cron auth gate",
    ok: repairCron.response.status === 401,
    detail: `status ${repairCron.response.status}`,
  });

  const anchorCron = await fetchJson("/api/cron/parlays/anchor-ots?limit=1");
  checks.push({
    name: "anchor-ots cron auth gate",
    ok: anchorCron.response.status === 401,
    detail: `status ${anchorCron.response.status}`,
  });

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} · ${check.name} · ${check.detail}`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`TrustOS smoke failed (${failed.length}/${checks.length})`);
  }

  console.log(`TrustOS smoke passed (${checks.length} checks) against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
