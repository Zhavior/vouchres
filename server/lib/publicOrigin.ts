/**
 * Trusted public site origin for OG/share/proof absolute URLs.
 * Never trust req Host in production — that enables host-header injection.
 */
export function getSafePublicOrigin(): string {
  const raw =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    "";

  const stripped = String(raw).trim().replace(/\/+$/, "");
  if (stripped.startsWith("http://") || stripped.startsWith("https://")) {
    try {
      const u = new URL(stripped);
      if (u.hostname && u.hostname !== "null") {
        return `${u.protocol}//${u.host}`;
      }
    } catch {
      // fall through
    }
  }

  if (stripped) {
    console.warn(
      `[publicOrigin] invalid FRONTEND/SITE URL "${stripped}" — falling back to http://localhost:3000`,
    );
  } else if (process.env.NODE_ENV === "production") {
    console.warn(
      "[publicOrigin] FRONTEND_URL (or SITE_URL) unset in production — falling back to http://localhost:3000",
    );
  }

  return "http://localhost:3000";
}
