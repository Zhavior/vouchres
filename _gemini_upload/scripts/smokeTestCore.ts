const baseUrl = (process.env.SMOKE_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = [
  "/api/health",
  "/api/mlb/players/count",
  "/api/mlb/players/search?q=judge",
  "/api/parlays",
  "/api/system/core-health",
];

async function checkJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" },
  });
  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (contentType.includes("text/html") || bodyText.trim().startsWith("<!doctype html") || bodyText.trim().startsWith("<html")) {
    throw new Error(`${path} returned React/HTML instead of JSON.`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`${path} returned non-JSON content-type: ${contentType || "missing"}.`);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    throw new Error(`${path} returned invalid JSON.`);
  }

  return {
    path,
    status: response.status,
    ok: response.ok,
    body,
  };
}

async function main() {
  const results = [];
  for (const path of checks) {
    results.push(await checkJson(path));
  }

  for (const result of results) {
    console.log(`${result.path} -> ${result.status} JSON`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
