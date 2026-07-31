import { titanRedis } from './redis'

export function getTitanDependencies() {
  return {
    redis: titanRedis,
  }
}
