#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT) || 3000;

const requiredPublic = [
  'public/favicon.svg',
  'public/favicon 2.svg',
  'public/favicon.png',
];

let ok = true;

console.log('[dev:doctor] VouchEdge local dev check\n');

for (const rel of requiredPublic) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) {
    console.log(`  ✓ ${rel}`);
  } else {
    console.log(`  ✗ missing ${rel} — run: git pull`);
    ok = false;
  }
}

const envLocal = path.join(root, '.env.local');
if (fs.existsSync(envLocal)) {
  const text = fs.readFileSync(envLocal, 'utf8');
  if (/^NODE_ENV\s*=\s*production/m.test(text)) {
    console.log('\n  ⚠ NODE_ENV=production in .env.local blocks Vite dev mode.');
    console.log('    npm run dev forces development — or remove that line from .env.local.');
  }
  if (!/VITE_SUPABASE_URL|SUPABASE_URL/.test(text)) {
    console.log('\n  ⚠ Supabase URL missing in .env.local — login will not work (server still boots).');
  }
} else {
  console.log('\n  ⚠ .env.local not found — copy from .env.example for auth.');
}

console.log(`\n[dev:doctor] Next steps:`);
console.log(`  1. npm run dev:stop          # free port ${port}`);
console.log(`  2. npm run dev               # start server`);
console.log(`  3. open http://localhost:${port}`);
if (!ok) {
  console.log('\n[dev:doctor] Fix missing files above, then retry.');
  process.exit(1);
}
console.log('\n[dev:doctor] Ready — run npm run dev');
