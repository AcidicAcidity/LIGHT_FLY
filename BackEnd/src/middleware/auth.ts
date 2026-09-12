import type { NextFunction, Request, Response } from 'express'
import { verifyToken, type JwtPayload } from '../lib/jwt.js'
import type { Role } from '../db/schema.js'

// Расширяем тип Request полем user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Требуется авторизация' })
  }
  try {
    req.user = verifyToken(header.slice(7))
    next()
  } catch {
    return res.status(401).json({ message: 'Недействительный или просроченный токен' })
  }
}

// Проверка роли (после authRequired)
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостаточно прав' })
    }
    next()
  }
}
