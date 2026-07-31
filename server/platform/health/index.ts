import { getTitanDependencies } from '../dependency'

export interface TitanDependencySnapshot {
  name: string
  health: unknown
  metrics: unknown
}

export async function getTitanDependencySnapshots(): Promise<TitanDependencySnapshot[]> {
  const { redis } = getTitanDependencies()

  return [
    {
      name: 'redis',
      health: await redis.health(),
      metrics: redis.metrics(),
    },
  ]
}
