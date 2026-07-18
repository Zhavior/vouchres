import cors from "cors";
import helmet from "helmet";

/**
 * CORS configuration.
 *
 * The current vercel.json + Render split is broken out of the box because
 * there's no CORS config. This fixes it: only allow your known frontend
 * origins. Credentials are required so the Authorization header (and any
 * future cookies) can flow cross-origin.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3005",
  "http://localhost:5173",
  "https://vouchres.vercel.app",
];

const ALLOWED_ORIGINS = Array.from(
  new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.CORS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  ])
);

function isAllowedPreviewOrigin(origin: string): boolean {
  return /^https:\/\/vouchres-[a-z0-9-]+-vouch-edge\.vercel\.app$/.test(origin);
}

export const corsMiddleware = cors({
  origin(origin, cb) {
    // Allow same-origin (no Origin header) — e.g. Render-served frontend
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || isAllowedPreviewOrigin(origin)) {
      return cb(null, true);
    }
    // Deny without throwing — cors.Error becomes an Express 500 and breaks preflight.
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "X-Client-Version",
    "X-Request-Id",
  ],
  exposedHeaders: ["X-Request-Id", "X-RateLimit-Remaining"],
  maxAge: 600, // cache preflight for 10 minutes
});

/**
 * Helmet — security headers. Strict-Transport-Security, no-sniff, etc.
 * Disable COEP/COOP if you embed third-party iframes (you probably don't).
 */
const isProd = process.env.NODE_ENV === "production";

export const helmetMiddleware = helmet({
  // HSTS + upgrade-insecure-requests break local http://localhost Vite boots
  // (browser upgrades module/HMR requests to https:// and the page stays blank).
  hsts: isProd,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: isProd
        ? ["'self'"]
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Tailwind v4 needs unsafe-inline
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://statsapi.mlb.com",
        "https://*.supabase.co",
        "https://api.stripe.com",
        // Vite HMR websocket (dev only)
        ...(isProd ? [] : ["ws://localhost:*", "ws://127.0.0.1:*", "wss://localhost:*", "wss://127.0.0.1:*"]),
      ],
      frameSrc: ["https://js.stripe.com"],
      // Disable Helmet's default upgrade-insecure-requests outside production.
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
});
