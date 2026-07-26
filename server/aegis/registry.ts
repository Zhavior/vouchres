import type { AegisContract } from "./contracts";

const contracts = new Map<string, AegisContract<unknown, unknown>>();

export function aegisContractKey(contract: Pick<AegisContract<unknown, unknown>, "name" | "version">): string {
  return `${contract.name}@${contract.version}`;
}

export function registerAegisContract<TInput, TOutput>(contract: AegisContract<TInput, TOutput>): void {
  const key = aegisContractKey(contract as AegisContract<unknown, unknown>);
  const existing = contracts.get(key);
  if (existing && existing !== contract) {
    throw new Error(`Duplicate Aegis contract registration: ${key}`);
  }
  contracts.set(key, contract as AegisContract<unknown, unknown>);
}

export function listAegisContracts(): AegisContract<unknown, unknown>[] {
  return [...contracts.values()].sort((a, b) => aegisContractKey(a).localeCompare(aegisContractKey(b)));
}
