import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Ошибка валидации данных',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message })
  }
  console.error('Необработанная ошибка:', err)
  return res.status(500).json({ message: 'Внутренняя ошибка сервера' })
}

// Обёртка для async-обработчиков, чтобы ошибки уходили в errorHandler
import type { RequestHandler } from 'express'
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
