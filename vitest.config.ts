import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Direct Vitest to use an isolated cache directory (.vitest-cache) instead of
  // the default node_modules/.vite, eliminating EPERM lockfile collisions on
  // timestamped temp bundles across concurrent or sandboxed test runs.
  cacheDir: ".vitest-cache",
  test: {
    globals: true,
    environment: "node",
    // @ts-expect-error vitest InlineConfig typing lags environmentMatchGlobs
    environmentMatchGlobs: [
      ["tests/**/*.test.tsx", "happy-dom"],
    ],
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["server/**/*.ts", "src/lib/**/*.ts"],
      exclude: ["**/*.test.ts", "**/node_modules/**"],
    },
    // The Supabase smoke suites reset one shared database before each case.
    // Keep files serial only when an explicit test database is configured.
    fileParallelism: !process.env.SUPABASE_URL_TEST,
    // Smoke tests use an isolated Supabase stack plus a Stripe mock.
    // Slower than unit tests — give them room.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
