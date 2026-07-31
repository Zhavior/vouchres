import { isUpstashEnabled } from "../../lib/upstashRedis";

export const RateLimitPolicy = {
  failClosedOnRedisError(): boolean {
    return process.env.NODE_ENV === "production" && isUpstashEnabled();
  },
};
