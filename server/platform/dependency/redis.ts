import {
  isUpstashEnabled,
  redisDel,
  redisGet,
  redisGetJson,
  redisIncr,
  redisPing,
  redisReleaseLock,
  redisSet,
  redisSetJson,
} from '../../lib/upstashRedis'
import { logger } from '../logger'
import { redisCircuit } from '../resilience/redisCircuit'
import { RedisError } from '../errors/RedisError'

export interface RedisDependencyMetrics {
  totalCalls: number
  totalFailures: number
  totalFallbacks: number
  circuitState: string
  lastErrorKind: string | null
  lastErrorAt: string | null
}

export interface RedisDependencyHealth {
  name: 'redis'
  enabled: boolean
  reachable: boolean
  circuitOpen: boolean
  degraded: boolean
  lastErrorKind: string | null
  lastErrorAt: string | null
}

export interface TitanRedis {
  isEnabled(): boolean
  get(key: string): Promise<string | null>
  getJson<T>(key: string): Promise<T | null>
  set(key: string, value: string, options?: { exSeconds?: number; nx?: boolean }): Promise<boolean>
  setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
  incr(key: string, ttlSeconds: number): Promise<number | null>
  ping(): Promise<boolean>
  releaseLock(key: string, token: string): Promise<boolean>
  health(): Promise<RedisDependencyHealth>
  metrics(): RedisDependencyMetrics
}

function classifyRedisError(error: unknown): RedisError {
  if (error instanceof RedisError) return error

  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || /timeout|aborted/i.test(error.message)) {
      return new RedisError('timeout', error.message)
    }
    return new RedisError('unknown', error.message)
  }

  return new RedisError('unknown', String(error))
}

class TitanRedisDependency implements TitanRedis {
  private totalCalls = 0
  private totalFailures = 0
  private totalFallbacks = 0
  private lastErrorKind: string | null = null
  private lastErrorAt: string | null = null

  isEnabled(): boolean {
    return isUpstashEnabled()
  }

  private async guarded<T>(operation: string, run: () => Promise<T>): Promise<T> {
    this.totalCalls += 1

    if (!this.isEnabled()) return run()

    if (redisCircuit.getState() === 'open') {
      this.totalFallbacks += 1
      throw new RedisError('network', 'Redis circuit open during operation')
    }

    try {
      const result = await run()
      redisCircuit.recordSuccess()
      return result
    } catch (error) {
      const redisError = classifyRedisError(error)
      this.totalFailures += 1
      this.lastErrorKind = redisError.kind
      this.lastErrorAt = new Date().toISOString()
      redisCircuit.recordFailure()

      logger.warn('dependency.redis.failure', {
        operation,
        kind: redisError.kind,
        message: redisError.message,
      })

      throw redisError
    }
  }

  async get(key: string): Promise<string | null> {
    return this.guarded('get', () => redisGet(key))
  }

  async getJson<T>(key: string): Promise<T | null> {
    return this.guarded('getJson', () => redisGetJson<T>(key))
  }

  async set(
    key: string,
    value: string,
    options?: { exSeconds?: number; nx?: boolean },
  ): Promise<boolean> {
    return this.guarded('set', () => redisSet(key, value, options))
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    return this.guarded('setJson', () => redisSetJson(key, value, ttlSeconds))
  }

  async del(key: string): Promise<void> {
    return this.guarded('del', () => redisDel(key))
  }

  async incr(key: string, ttlSeconds: number): Promise<number | null> {
    return this.guarded('incr', () => redisIncr(key, ttlSeconds))
  }

  async ping(): Promise<boolean> {
    return this.guarded('ping', () => redisPing())
  }

  async releaseLock(key: string, token: string): Promise<boolean> {
    return this.guarded('releaseLock', () => redisReleaseLock(key, token))
  }

  async health(): Promise<RedisDependencyHealth> {
    const enabled = this.isEnabled()
    const circuitOpen = redisCircuit.getState() === 'open'

    if (!enabled) {
      return {
        name: 'redis',
        enabled: false,
        reachable: false,
        circuitOpen,
        degraded: false,
        lastErrorKind: this.lastErrorKind,
        lastErrorAt: this.lastErrorAt,
      }
    }

    try {
      const reachable = await this.ping()
      return {
        name: 'redis',
        enabled: true,
        reachable,
        circuitOpen,
        degraded: circuitOpen || !reachable,
        lastErrorKind: this.lastErrorKind,
        lastErrorAt: this.lastErrorAt,
      }
    } catch {
      return {
        name: 'redis',
        enabled: true,
        reachable: false,
        circuitOpen,
        degraded: true,
        lastErrorKind: this.lastErrorKind,
        lastErrorAt: this.lastErrorAt,
      }
    }
  }

  metrics(): RedisDependencyMetrics {
    return {
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalFallbacks: this.totalFallbacks,
      circuitState: redisCircuit.getState(),
      lastErrorKind: this.lastErrorKind,
      lastErrorAt: this.lastErrorAt,
    }
  }
}

export const titanRedis = new TitanRedisDependency()
