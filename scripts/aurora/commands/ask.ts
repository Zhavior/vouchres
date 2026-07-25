import fg from "fast-glob";

const query = (process.argv[3] ?? "").toLowerCase();

if (!query) {
  console.log("Usage: npm run aurora ask -- <query>");
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

const matches = files.filter((file) =>
  file.toLowerCase().includes(query)
);

console.log("");
console.log(`🔍 Results for "${query}"`);
console.log("");

if (matches.length === 0) {
  console.log("No matches found.");
} else {
  matches.forEach((file) => console.log(file));
}

console.log("");
console.log(`Found ${matches.length} file(s).`);
