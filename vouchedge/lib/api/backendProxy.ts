import { NextResponse } from "next/server";
import { cacheHeaders } from "./cache";

/** Express / Vite backend origin — never the Next.js app itself. */
export function getBackendOrigin(): string {
  const raw =
    process.env.VOUCHEDGE_API_ORIGIN ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:3000";

  return raw.replace(/\/$/, "");
}

export function clampPreviewLimit(raw: string | null | undefined, fallback = 50): number {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(10, Math.min(350, Math.round(parsed)));
}

export async function proxyBackendGet(path: string, init?: RequestInit): Promise<NextResponse> {
  const url = `${getBackendOrigin()}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    const contentType = res.headers.get("content-type") ?? "application/json";
    const body = contentType.includes("application/json") ? await res.json() : await res.text();

    return NextResponse.json(body, {
      status: res.status,
      headers: res.ok ? cacheHeaders.shortLive : cacheHeaders.noStore,
    });
  } catch (error) {
    console.error(`[backend-proxy] GET ${path} failed`, error);
    return NextResponse.json(
      {
        ok: false,
        error: "Backend unavailable",
        message: error instanceof Error ? error.message : "Proxy fetch failed",
      },
      { status: 502, headers: cacheHeaders.noStore },
    );
  }
}
