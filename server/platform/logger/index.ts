import { captureException } from '../../lib/sentry'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown> | undefined

/**
 * Minimum gap between Sentry captures for the same message key.
 *
 * A dependency outage produces the same `logger.error` thousands of times a
 * minute (see the 2026-08-05 rate-limiter incident). Forwarding every one burns
 * the Sentry quota and buries everything else, so each distinct message alerts
 * at most once per window — enough to page, not enough to flood.
 */
const SENTRY_THROTTLE_MS = 60_000

const lastCapturedAt = new Map<string, number>()

function shouldCapture(message: string, now: number): boolean {
  const previous = lastCapturedAt.get(message)
  if (previous !== undefined && now - previous < SENTRY_THROTTLE_MS) return false

  lastCapturedAt.set(message, now)

  // Bounded map: drop entries that are already outside the throttle window.
  if (lastCapturedAt.size > 500) {
    for (const [key, at] of lastCapturedAt) {
      if (now - at >= SENTRY_THROTTLE_MS) lastCapturedAt.delete(key)
    }
  }

  return true
}

function forwardToSentry(message: string, context?: LogContext): void {
  try {
    if (!shouldCapture(message, Date.now())) return

    const detail = typeof context?.error === 'string' ? `: ${context.error}` : ''
    const error = new Error(`${message}${detail}`)
    error.name = 'LoggedError'

    captureException(error, {
      tags: { source: 'logger' },
      extra: context as Record<string, unknown> | undefined,
      requestId: typeof context?.requestId === 'string' ? context.requestId : undefined,
      path: typeof context?.route === 'string' ? context.route : undefined,
    })
  } catch {
    // Never let error reporting break the code path that was reporting an error.
  }
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const line = JSON.stringify({
    level,
    message,
    ...(context ?? {}),
    at: new Date().toISOString(),
  })

  if (level === 'error') {
    console.error(line)
    forwardToSentry(message, context)
    return
  }
  if (level === 'warn') return console.warn(line)
  return console.log(line)
}

/** Test hook — clears the Sentry throttle window between cases. */
export function resetLoggerSentryThrottleForTests(): void {
  lastCapturedAt.clear()
}

export const logger = {
  debug(message: string, context?: LogContext) {
    write('debug', message, context)
  },
  info(message: string, context?: LogContext) {
    write('info', message, context)
  },
  warn(message: string, context?: LogContext) {
    write('warn', message, context)
  },
  error(message: string, context?: LogContext) {
    write('error', message, context)
  },
}
