import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const VERSION = "0.1.0";

function count(dir: string): number {
  if (!existsSync(dir)) return 0;

  let total = 0;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      total += count(full);
    } else {
      total++;
    }
  }

  return total;
}

const summary = {
  features: count("src/features"),
  components: count("src/components"),
  api: count("api"),
  tests: count("tests"),
};

console.log("");
console.log("══════════════════════════════════════");
console.log(` Aurora ${VERSION}`);
console.log("══════════════════════════════════════");
console.log("");

console.table(summary);

console.log("✓ Repository scan complete");
