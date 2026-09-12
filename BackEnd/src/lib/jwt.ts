import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { Role } from '../db/schema.js'

export interface JwtPayload {
  sub: string // user id
  role: Role
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload
}
