/**
 * Deploy checklist step 5 — Supabase Authentication URL Configuration.
 *
 * Applies (or dry-runs) production Site URL + redirect allow-list via the
 * Supabase Management API, and prints the Vite env mirror checklist.
 *
 * Usage:
 *   npm run configure:supabase-auth-urls              # dry-run (default)
 *   npm run configure:supabase-auth-urls -- --apply     # PATCH remote project
 *   npm run configure:supabase-auth-urls -- --verify    # GET + compare (no write)
 *
 * Required for --apply / --verify:
 *   SUPABASE_ACCESS_TOKEN — https://supabase.com/dashboard/account/tokens
 *   SUPABASE_PROJECT_REF  — optional when SUPABASE_URL is set (extracts subdomain)
 *
 * Optional:
 *   FRONTEND_URL          — production SPA origin (default https://vouchedge.app)
 *   SUPABASE_STAGING_URL  — extra origin for staging previews
 *   --site-url=<origin>   — force Site URL (wins over FRONTEND_URL / .env.local)
 */

import dotenv from "dotenv";
import path from "node:path";

// Load files without clobbering vars already set in the shell.
dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const MANAGEMENT_API = "https://api.supabase.com/v1";

export interface AuthUrlConfig {
  siteUrl: string;
  uriAllowList: string;
  redirectEntries: string[];
}

export function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return trimmed;
  }
}

export function extractProjectRef(supabaseUrl: string): string | null {
  try {
    const host = new URL(supabaseUrl).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function buildAuthUrlConfig(opts?: {
  frontendUrl?: string;
  stagingUrl?: string;
  extraOrigins?: string[];
}): AuthUrlConfig {
  const productionOrigin = normalizeOrigin(
    opts?.frontendUrl ?? process.env.FRONTEND_URL ?? "https://vouchedge.app",
  );
  const stagingOrigin = normalizeOrigin(opts?.stagingUrl ?? process.env.SUPABASE_STAGING_URL ?? "");
  const devOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

  const origins = new Set<string>();
  if (productionOrigin) {
    origins.add(productionOrigin);
    if (productionOrigin.startsWith("https://") && !productionOrigin.includes("://www.")) {
      origins.add(productionOrigin.replace("://", "://www."));
    }
  }
  if (stagingOrigin) origins.add(stagingOrigin);
  for (const origin of devOrigins) origins.add(origin);
  for (const extra of opts?.extraOrigins ?? []) {
    const normalized = normalizeOrigin(extra);
    if (normalized) origins.add(normalized);
  }

  const redirectEntries: string[] = [];
  for (const origin of origins) {
    redirectEntries.push(`${origin}/**`);
    redirectEntries.push(`${origin}/auth/callback`);
  }

  // Vercel preview deployments (optional — safe wildcard for this repo)
  redirectEntries.push("https://*.vercel.app/**");

  const uniqueEntries = [...new Set(redirectEntries)];
  return {
    siteUrl: productionOrigin || "https://vouchedge.app",
    uriAllowList: uniqueEntries.join(","),
    redirectEntries: uniqueEntries,
  };
}

function parseAllowList(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function listsMatch(expected: string[], actual: string[]): boolean {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  for (const entry of expectedSet) {
    if (!actualSet.has(entry)) return false;
  }
  return true;
}

async function managementFetch(
  projectRef: string,
  token: string,
  method: "GET" | "PATCH",
  body?: Record<string, string>,
) {
  const response = await fetch(`${MANAGEMENT_API}/projects/${projectRef}/config/auth`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      (json && typeof json.message === "string" && json.message)
      || text
      || `HTTP ${response.status}`;
    throw new Error(`Supabase Management API ${method} failed: ${message}`);
  }

  return json ?? {};
}

export async function verifySupabaseAuthUrls(
  projectRef: string,
  token: string,
  expected: AuthUrlConfig,
): Promise<{ ok: boolean; remote: { siteUrl: string; uriAllowList: string[] }; missing: string[] }> {
  const remote = await managementFetch(projectRef, token, "GET");
  const siteUrl = typeof remote.site_url === "string" ? remote.site_url : "";
  const uriAllowList = parseAllowList(remote.uri_allow_list);
  const missing = expected.redirectEntries.filter((entry) => !uriAllowList.includes(entry));
  const ok = normalizeOrigin(siteUrl) === normalizeOrigin(expected.siteUrl) && listsMatch(expected.redirectEntries, uriAllowList);
  return { ok, remote: { siteUrl, uriAllowList }, missing };
}

export async function applySupabaseAuthUrls(
  projectRef: string,
  token: string,
  config: AuthUrlConfig,
): Promise<Record<string, unknown>> {
  return managementFetch(projectRef, token, "PATCH", {
    site_url: config.siteUrl,
    uri_allow_list: config.uriAllowList,
  });
}

function resolveProjectRef(): string {
  const explicit = process.env.SUPABASE_PROJECT_REF?.trim();
  if (explicit) return explicit;

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const extracted = extractProjectRef(supabaseUrl);
  if (extracted) return extracted;

  throw new Error(
    "Set SUPABASE_PROJECT_REF or SUPABASE_URL (https://<ref>.supabase.co) to identify the project.",
  );
}

/** Read `--name=value` or `--name value` from process.argv. */
export function readCliValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim() || undefined;
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) {
    const next = process.argv[index + 1];
    if (next && !next.startsWith("--")) return next.trim() || undefined;
  }
  return undefined;
}

function printDryRun(config: AuthUrlConfig, projectRef: string | null) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "dry_run",
        projectRef,
        patch: {
          site_url: config.siteUrl,
          uri_allow_list: config.uriAllowList,
        },
        redirectEntries: config.redirectEntries,
        viteEnvMirror: {
          VITE_SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "<your-project-url>",
          VITE_SUPABASE_ANON_KEY: "<anon-key-from-supabase-dashboard>",
          note: "Set the same URL + anon key on Vercel (frontend) and Render only needs server keys.",
        },
        dashboard: {
          path: "Authentication → URL Configuration",
          siteUrl: config.siteUrl,
          redirectUrls: config.redirectEntries,
        },
        applyCommand:
          "SUPABASE_ACCESS_TOKEN=<token> npm run configure:supabase-auth-urls -- --apply --site-url=https://vouchedge.app",
      },
      null,
      2,
    ),
  );
}

async function main() {
  const apply = process.argv.includes("--apply");
  const verifyOnly = process.argv.includes("--verify");
  const allowLocalhost = process.argv.includes("--allow-localhost");
  const siteUrlArg = readCliValue("site-url");
  const config = buildAuthUrlConfig({
    frontendUrl: siteUrlArg || process.env.FRONTEND_URL || undefined,
  });

  if ((apply || verifyOnly) && /localhost|127\.0\.0\.1/i.test(config.siteUrl) && !allowLocalhost) {
    throw new Error(
      `Refusing to ${apply ? "apply" : "verify"} with localhost Site URL (${config.siteUrl}). ` +
        "Pass --site-url=https://vouchedge.app (recommended) or --allow-localhost for intentional local-only config.",
    );
  }

  let projectRef: string | null = null;
  try {
    projectRef = resolveProjectRef();
  } catch {
    projectRef = null;
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";

  if (!apply && !verifyOnly) {
    printDryRun(config, projectRef);
    return;
  }

  if (!token) {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN is required for --apply or --verify. Create one at https://supabase.com/dashboard/account/tokens",
    );
  }
  if (!projectRef) {
    throw new Error("Could not resolve SUPABASE_PROJECT_REF from environment.");
  }

  if (verifyOnly) {
    const result = await verifySupabaseAuthUrls(projectRef, token, config);
    console.log(
      JSON.stringify(
        {
          ok: result.ok,
          mode: "verify",
          projectRef,
          expected: config,
          remote: result.remote,
          missingRedirectEntries: result.missing,
        },
        null,
        2,
      ),
    );
    if (!result.ok) process.exit(1);
    return;
  }

  await applySupabaseAuthUrls(projectRef, token, config);
  const verified = await verifySupabaseAuthUrls(projectRef, token, config);
  console.log(
    JSON.stringify(
      {
        ok: verified.ok,
        mode: "apply",
        projectRef,
        applied: {
          site_url: config.siteUrl,
          uri_allow_list: config.uriAllowList,
        },
        verified: verified.remote,
        missingRedirectEntries: verified.missing,
      },
      null,
      2,
    ),
  );
  if (!verified.ok) process.exit(1);
}

const invokedDirectly = process.argv[1]?.includes("configureSupabaseAuthUrls");

if (invokedDirectly) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ ok: false, error: message }, null, 2));
    process.exit(1);
  });
}
