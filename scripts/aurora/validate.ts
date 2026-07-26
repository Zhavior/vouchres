import { validateAurora } from './compliance';

const result = validateAurora();

console.log('Aurora compliance');
console.log(`- tracked flows: ${result.metrics.trackedFlows}`);
console.log(`- Aurora-compliant flows: ${result.metrics.compliantFlows}`);
console.log(`- remaining Z8 token importers: ${result.metrics.z8Importers}`);

if (!result.ok) {
  console.error('\nAurora validation failed:');
  for (const issue of result.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('- status: PASS');
}
