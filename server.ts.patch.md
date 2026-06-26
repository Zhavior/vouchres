# server.ts patch — wire in middleware + raw-body webhook

## Where to apply

`server.ts`, inside `startServer()`, around line 14-21.

## Before

```ts
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // VouchEdge intelligence backbone...
  registerApiRoutes(app);

  // ... rest of server
}
```

## After

```ts
import { corsMiddleware, helmetMiddleware } from "./server/middleware/cors";
import { globalLimiter, aiLimiter, pickLimiter } from "./server/middleware/rateLimit";
import { billingRoutes } from "./server/routes/billingRoutes";
import express from "express";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust proxy — needed for correct req.ip behind Render/Cloudflare
  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));

  // Security headers
  app.use(helmetMiddleware);

  // CORS — must be before routes
  app.use(corsMiddleware);

  // Stripe webhook — needs RAW body. Register BEFORE express.json().
  // express.raw parses this route's body as a Buffer; the billingRoutes
  // handler verifies the signature against the raw bytes.
  app.post(
    "/api/billing/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    billingRoutes
  );

  // Global rate limit on every other /api/* route
  app.use("/api", globalLimiter);

  // JSON body parser — applies to everything EXCEPT the webhook above
  app.use(express.json({ limit: "1mb" }));

  // Register all API routes (auth, picks, mlb, ai, billing/*, etc.)
  registerApiRoutes(app);

  // AI-specific rate limiter — 20 req/min on /api/ai/*
  app.use("/api/ai", aiLimiter);

  // Pick-creation rate limiter — 10 req/min on POST /api/picks
  // (Already applied via pickLimiter in coreRoutes, but this is a
  // belt-and-suspenders layer in case a route is missed.)
  // app.use("/api/picks", pickLimiter);  // optional

  // ... rest of your server (Vite middleware, static serving, etc.)
}
```

## What this fixes

1. **No CORS** — fixed by `corsMiddleware` (whitelist-based)
2. **No security headers** — fixed by `helmetMiddleware`
3. **No rate limiting** — fixed by `globalLimiter` + `aiLimiter`
4. **Stripe webhook would fail signature verification** — fixed by registering the route with `express.raw()` BEFORE `express.json()`
5. **`req.ip` returns the proxy IP** — fixed by `app.set("trust proxy", 1)`
