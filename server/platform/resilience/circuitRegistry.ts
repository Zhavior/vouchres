import { CircuitBreaker, type CircuitBreakerOptions } from '../../lib/sports/circuitBreaker'

const registry = new Map<string, CircuitBreaker>()

export function getCircuit(
  name: string,
  options?: Omit<CircuitBreakerOptions, 'name'>,
): CircuitBreaker {
  const existing = registry.get(name)
  if (existing) return existing

  const created = new CircuitBreaker({
    name,
    failureThreshold: options?.failureThreshold,
    windowMs: options?.windowMs,
    cooldownMs: options?.cooldownMs,
  })

  registry.set(name, created)
  return created
}

export const getOrCreateCircuitBreaker = getCircuit

export function getCircuitBreaker(name: string): CircuitBreaker | undefined {
  return registry.get(name)
}

export function getCircuitRegistrySnapshot() {
  return Array.from(registry.entries()).map(([name, breaker]) => ({
    name,
    state: breaker.getState(),
  }))
}
