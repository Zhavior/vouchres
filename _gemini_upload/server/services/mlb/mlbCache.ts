/** Shared TTL cache instances for MLB data. */
import { TTLCache, TTL } from "../../lib/cache";

export const scheduleCache = new TTLCache<unknown>(TTL.schedule);
export const gameFeedCache = new TTLCache<unknown>(TTL.liveFeed);
export const reportCache = new TTLCache<unknown>(TTL.dailyReport);
