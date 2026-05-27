import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { User } from '@axis-o/shared'

interface TokenPayload {
  userId: string
  email: string
  role: User['role']
}

export function signAccessToken(payload: TokenPayload, expiresIn?: string): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn || env.JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1]
}
