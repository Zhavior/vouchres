import { apiOk } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiOk({
    service: "vouchedge",
    status: "healthy",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV ?? "unknown",
  });
}
