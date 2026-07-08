import { proxyBackendGet } from "@/lib/api/backendProxy";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyBackendGet("/api/mlb/live");
}
