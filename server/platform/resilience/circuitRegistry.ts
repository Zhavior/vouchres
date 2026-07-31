import {
  CircuitBreaker,
  type CircuitBreakerOptions,
} from "../../lib/sports/circuitBreaker";

const circuits = new Map<string, CircuitBreaker>();

export function getCircuit(
  name: string,
  options: Omit<CircuitBreakerOptions, "name">
): CircuitBreaker {
  let circuit = circuits.get(name);

  if (!circuit) {
    circuit = new CircuitBreaker({
      name,
      failureThreshold: options.failureThreshold ?? 5,
      windowMs: options.windowMs ?? 60000,
      cooldownMs: options.cooldownMs ?? 30000,
    });

    circuits.set(name, circuit);
  }

  return circuit;
}
