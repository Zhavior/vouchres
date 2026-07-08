import type { NextRequest } from "next/server";
import { clampPreviewLimit, proxyBackendGet } from "@/lib/api/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const previewLimit = clampPreviewLimit(request.nextUrl.searchParams.get("previewLimit"));
  return proxyBackendGet(`/api/mlb/hr-board/today?previewLimit=${previewLimit}`);
}
