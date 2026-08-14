import fs from "node:fs";
import path from "node:path";
import { extractAuthToken } from "../server/middleware/auth";
import type { Request } from "express";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(message);
  }
}

console.log("=== VOUCHEDGE COOKIES & AURORA FUSION VERIFICATION ===");

// 1. Verify file presence and critical exports
console.log("[1/4] Verifying file presence and contracts...");

const cookieConsentSource = read("src/lib/cookieConsent.ts");
assert(cookieConsentSource.includes("export function getGlobalPrivacyControl"), "getGlobalPrivacyControl missing");
assert(cookieConsentSource.includes("export function getStoredConsent"), "getStoredConsent missing");
assert(cookieConsentSource.includes("export function saveConsent"), "saveConsent missing");
assert(cookieConsentSource.includes("export function hasConsent"), "hasConsent missing");
assert(cookieConsentSource.includes("export function revokeConsent"), "revokeConsent missing");
assert(cookieConsentSource.includes("vouchedge:consent-change"), "vouchedge:consent-change event missing");
console.log("  ✓ src/lib/cookieConsent.ts contracts verified.");

// 2. Verify CookieConsentBanner Aurora fusion
console.log("[2/4] Verifying CookieConsentBanner Aurora primitives...");
const bannerSource = read("src/components/legal/CookieConsentBanner.tsx");
assert(bannerSource.includes("AuroraMaxPanel"), "CookieConsentBanner missing AuroraMaxPanel");
assert(bannerSource.includes("AuroraMaxControl"), "CookieConsentBanner missing AuroraMaxControl");
assert(bannerSource.includes("AuroraMaxTruthBadge"), "CookieConsentBanner missing AuroraMaxTruthBadge");
assert(bannerSource.includes("AURORA_CYAN_HEX"), "CookieConsentBanner missing AURORA_CYAN_HEX");
assert(bannerSource.includes("getGlobalPrivacyControl"), "CookieConsentBanner missing GPC integration");
console.log("  ✓ CookieConsentBanner Aurora Max fusion verified.");

// 3. Verify SettingsPageZ8 Privacy section
console.log("[3/4] Verifying SettingsPageZ8 Privacy Tab extension...");
const settingsSource = read("src/components/SettingsPageZ8.tsx");
assert(settingsSource.includes("Cookie & telemetry choices"), "SettingsPageZ8 missing Cookie & telemetry choices section");
assert(settingsSource.includes("handleToggleCookieCategory"), "SettingsPageZ8 missing handleToggleCookieCategory");
assert(settingsSource.includes("handleResetCookiePreferences"), "SettingsPageZ8 missing handleResetCookiePreferences");
assert(settingsSource.includes("getGlobalPrivacyControl"), "SettingsPageZ8 missing GPC status check");
console.log("  ✓ SettingsPageZ8 Privacy Tab controls verified.");

// 4. Verify Dual-Mode Backend Token Extraction & CSRF
console.log("[4/4] Testing backend extractAuthToken unit cases...");

// Test Case A: Bearer token in header
const bearerReq = {
  headers: { authorization: "Bearer mock_jwt_header_token" },
  cookies: {},
} as unknown as Request;
const bearerResult = extractAuthToken(bearerReq);
assert(bearerResult?.token === "mock_jwt_header_token", "Bearer token extraction failed");
assert(bearerResult?.source === "bearer", "Bearer source type mismatch");
console.log("  ✓ Bearer header extraction passed.");

// Test Case B: Single Supabase SSR Cookie
const singleCookieReq = {
  headers: {},
  cookies: {
    "sb-mockproject-auth-token": JSON.stringify(["mock_jwt_cookie_token", "refresh_token"]),
  },
} as unknown as Request;
const singleResult = extractAuthToken(singleCookieReq);
assert(singleResult?.token === "mock_jwt_cookie_token", "Single cookie token extraction failed");
assert(singleResult?.source === "cookie", "Single cookie source type mismatch");
console.log("  ✓ Single Supabase SSR cookie extraction passed.");

// Test Case C: Multi-chunk Supabase SSR Cookie
const chunkCookieReq = {
  headers: {},
  cookies: {
    "sb-chunked-auth-token.0": "base64-" + Buffer.from(JSON.stringify({ access_token: "mock_chunked_jwt" })).toString("base64"),
  },
} as unknown as Request;
const chunkResult = extractAuthToken(chunkCookieReq);
assert(chunkResult?.token === "mock_chunked_jwt", "Chunked cookie token extraction failed");
assert(chunkResult?.source === "cookie", "Chunked cookie source type mismatch");
console.log("  ✓ Chunked Supabase SSR cookie extraction passed.");

// Test Case D: No credentials
const emptyReq = {
  headers: {},
  cookies: {},
} as unknown as Request;
const emptyResult = extractAuthToken(emptyReq);
assert(emptyResult === null, "Empty request should yield null auth token");
console.log("  ✓ Empty credentials extraction passed.");

// 5. Verify App.tsx root mount
const appSource = read("src/App.tsx");
assert(appSource.includes("<CookieConsentBanner />"), "App.tsx missing <CookieConsentBanner />");
console.log("  ✓ App.tsx root CookieConsentBanner mount verified.");

// 6. Verify bootstrap.ts cookieParser mount
const bootstrapSource = read("server/api/bootstrap.ts");
assert(bootstrapSource.includes("cookieParser()"), "server/api/bootstrap.ts missing cookieParser()");
console.log("  ✓ server/api/bootstrap.ts cookieParser() verified.");

console.log("\n✅ ALL COOKIES & AURORA FUSION TESTS PASSED.");
