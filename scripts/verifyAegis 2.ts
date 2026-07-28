import "../server/v3/modules/parlays/aegisContracts";
import { listAegisContracts } from "../server/aegis/registry";
import { AEGIS_OWNERSHIP } from "../server/aegis/ownership";

const contracts = listAegisContracts();
const contractKeys = new Set(contracts.map((contract) => `${contract.name}@${contract.version}`));
const failures: string[] = [];

for (const contract of contracts) {
  if (!contract.name || !Number.isInteger(contract.version) || contract.version < 1) {
    failures.push(`invalid contract identity: ${contract.name}@${contract.version}`);
  }
  if (contract.allowedActors.length === 0) failures.push(`${contract.name} has no allowed actors`);
  if (!contract.authorizationPolicy) failures.push(`${contract.name} has no authorization policy`);
  if (!contract.idempotency.keySource) failures.push(`${contract.name} has no idempotency declaration`);
  if (contract.kind === "command" && contract.audit === "none") {
    failures.push(`${contract.name} is a command without audit requirements`);
  }
}

for (const owner of AEGIS_OWNERSHIP) {
  if (!owner.capability || !owner.domain || !owner.canonicalHandler) {
    failures.push(`incomplete ownership record: ${owner.capability || "unknown"}`);
  }
  if (!owner.canonicalOperation.includes("planned") && !contractKeys.has(owner.canonicalOperation)) {
    failures.push(`${owner.capability} references unregistered ${owner.canonicalOperation}`);
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  contracts: [...contractKeys].sort(),
  ownershipRecords: AEGIS_OWNERSHIP.length,
  migratedCapabilities: AEGIS_OWNERSHIP.filter((record) => !record.canonicalOperation.includes("planned")).map((record) => record.capability),
}, null, 2));
