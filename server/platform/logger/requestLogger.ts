import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { logger } from './index'

type RequestWithId = Request & { requestId?: string }

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now()
  const requestId = req.header('x-request-id') || crypto.randomUUID().toString()

  res.setHeader('x-request-id', requestId)
  ;(req as RequestWithId).requestId = requestId

  res.on('finish', () => {
    logger.info('request.completed', {
      requestId,
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    })
  })

  next()
}
