import { readFileSync } from "node:fs";

const bundlePath = new URL("../dist/server.cjs", import.meta.url);
const bundle = readFileSync(bundlePath, "utf8");

const forbiddenRequires = ["vite"];
const violations = forbiddenRequires.filter((dependency) =>
  bundle.includes(`require("${dependency}")`) || bundle.includes(`require('${dependency}')`),
);

if (violations.length > 0) {
  console.error(
    `[verify-server-bundle] Production bundle statically requires ESM-only dependencies: ${violations.join(", ")}`,
  );
  process.exit(1);
}

console.log("[verify-server-bundle] Production server bundle is safe to load as CommonJS.");
