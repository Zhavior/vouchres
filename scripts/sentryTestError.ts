import path from "node:path";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });

const args = process.argv.slice(2);
const useFrontend = args.includes("--frontend");
const message =
  args.filter((arg) => arg !== "--frontend").join(" ").trim() ||
  "VouchEdge Sentry terminal test error";

const dsn = (useFrontend ? process.env.VITE_SENTRY_DSN : process.env.SENTRY_DSN)?.trim()
  || process.env.VITE_SENTRY_DSN?.trim()
  || process.env.SENTRY_DSN?.trim();

const environment =
  process.env.SENTRY_ENVIRONMENT?.trim()
  || process.env.VITE_SENTRY_ENV?.trim()
  || process.env.NODE_ENV
  || "development";

async function main() {
  if (!dsn) {
    console.error("[sentry:test] No DSN found.");
    console.error("Add one of these to .env.local:");
    console.error("  VITE_SENTRY_DSN=...   # frontend / javascript-react project");
    console.error("  SENTRY_DSN=...        # backend Express project");
    console.error("");
    console.error("Usage:");
    console.error("  npm run sentry:test");
    console.error("  npm run sentry:test -- --frontend");
    console.error('  npm run sentry:test -- "Custom test message"');
    process.exit(1);
  }

  const target = useFrontend || dsn === process.env.VITE_SENTRY_DSN?.trim()
    ? "frontend (VITE_SENTRY_DSN)"
    : "backend (SENTRY_DSN)";

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: 0,
  });

  const error = new Error(message);
  const eventId = Sentry.captureException(error, {
    tags: { source: "sentry:test-cli" },
  });

  const flushed = await Sentry.flush(5000);
  if (!flushed) {
    console.error("[sentry:test] Timed out waiting for Sentry to send the event.");
    process.exit(1);
  }

  console.log(`[sentry:test] Sent test error to ${target}`);
  console.log(`[sentry:test] Message: ${message}`);
  if (eventId) {
    console.log(`[sentry:test] Event id: ${eventId}`);
  }
  console.log("[sentry:test] Check your Sentry project issues dashboard in ~30 seconds.");
}

main().catch((err) => {
  console.error("[sentry:test] Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
