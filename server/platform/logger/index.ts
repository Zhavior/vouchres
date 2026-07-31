type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown> | undefined

function write(level: LogLevel, message: string, context?: LogContext) {
  const line = JSON.stringify({
    level,
    message,
    ...(context ?? {}),
    at: new Date().toISOString(),
  })

  if (level === 'error') return console.error(line)
  if (level === 'warn') return console.warn(line)
  return console.log(line)
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
