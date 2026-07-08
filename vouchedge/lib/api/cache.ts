export const cacheHeaders = {
  noStore: {
    "Cache-Control": "no-store, max-age=0",
  },
  shortLive: {
    "Cache-Control": "s-maxage=30, stale-while-revalidate=300",
  },
  mediumLive: {
    "Cache-Control": "s-maxage=300, stale-while-revalidate=1800",
  },
};
