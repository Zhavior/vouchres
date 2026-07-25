import fg from "fast-glob";
import fs from "node:fs";

const groups: Record<string, string[]> = {};

const files = await fg(["**/*"], {
  ignore: [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/coverage/**",
    "**/.aurora/**",
  ],
});

for (const file of files) {
  const parts = file.split("/");

  let feature = "misc";

  if (parts.includes("player")) feature = "player";
  else if (parts.includes("parlay") || parts.includes("parlays")) feature = "parlay";
  else if (parts.includes("hr")) feature = "hr";
  else if (parts.includes("social")) feature = "social";
  else if (parts.includes("auth")) feature = "auth";
  else if (parts.includes("mlb")) feature = "mlb";
  else if (parts.includes("nba")) feature = "nba";

  (groups[feature] ??= []).push(file);
}

fs.mkdirSync(".aurora", { recursive: true });

fs.writeFileSync(
  ".aurora/index.json",
  JSON.stringify(groups, null, 2)
);

console.log(`✅ Indexed ${files.length} files`);
console.log(`✅ Wrote .aurora/index.json`);
