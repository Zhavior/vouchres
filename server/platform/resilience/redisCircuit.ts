import { getCircuit } from "./circuitRegistry";

export const redisCircuit = getCircuit("redis", {
  failureThreshold: 5,
  windowMs: 60000,
  cooldownMs: 30000,
});
