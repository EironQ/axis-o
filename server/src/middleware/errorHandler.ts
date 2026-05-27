import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message, err.stack)

  const statusCode = (err as any).statusCode || 500
  const code = (err as any).code || 'INTERNAL_ERROR'

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: statusCode === 500 ? 'Internal server error' : err.message,
    },
  })
}

export class AppError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode: number = 400, code: string = 'APP_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}
