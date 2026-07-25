import fg from "fast-glob";

const feature = (process.argv[3] ?? "").toLowerCase();

if (!feature) {
  console.log("Usage: npm run aurora feature -- <name>");
  process.exit(1);
}

const files = await fg(["**/*"], {
  ignore: [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/coverage/**",
  ],
});

const groups: Record<string, string[]> = {
  Pages: [],
  Components: [],
  Hooks: [],
  Services: [],
  Tests: [],
  Routes: [],
  Other: [],
};

for (const file of files) {
  if (!file.toLowerCase().includes(feature)) continue;

  if (file.includes("/pages/")) groups.Pages.push(file);
  else if (file.includes("/components/")) groups.Components.push(file);
  else if (file.includes("/hooks/")) groups.Hooks.push(file);
  else if (file.includes("/services/")) groups.Services.push(file);
  else if (file.includes("/tests/") || file.includes(".test.")) groups.Tests.push(file);
  else if (file.includes("/routes/")) groups.Routes.push(file);
  else groups.Other.push(file);
}

console.log(`\n=== ${feature.toUpperCase()} ===\n`);

for (const [name, list] of Object.entries(groups)) {
  if (!list.length) continue;
  console.log(`${name} (${list.length})`);
  list.forEach(f => console.log(`  • ${f}`));
  console.log("");
}
