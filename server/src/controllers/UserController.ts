import { Request, Response } from 'express'
import { db } from '../config/database'
import { users, orders, orderItems, addresses } from '../db/schema'
import { eq, like, sql, desc } from 'drizzle-orm'
import { hashPassword, comparePassword } from '../utils/password'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { v4 as uuidv4 } from '../utils/uuid'

export const UserController = {
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (existingUser.length > 0) {
        res.status(400).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } })
        return
      }

      const passwordHash = await hashPassword(password)
      const userId = uuidv4()

      await db.insert(users).values({
        id: userId,
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const accessToken = signAccessToken({ userId, email, role: 'customer' })
      const refreshToken = signRefreshToken({ userId, email, role: 'customer' })

      res.status(201).json({
        success: true,
        data: {
          userId,
          email,
          firstName,
          lastName,
          accessToken,
          refreshToken,
        },
      })
    } catch (error) {
      console.error('User registration error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } })
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (userResult.length === 0) {
        res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
        return
      }

      const user = userResult[0]
      const isValidPassword = await comparePassword(password, user.passwordHash)

      if (!isValidPassword) {
        res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
        return
      }

      const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role })
      const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role })

      await db.update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id))

      res.json({
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          accessToken,
          refreshToken,
        },
      })
    } catch (error) {
      console.error('User login error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Login failed' } })
    }
  },

  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        res.status(401).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Refresh token is required' } })
        return
      }

      const decoded = verifyRefreshToken(refreshToken)
      if (!decoded) {
        res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' } })
        return
      }

      const accessToken = signAccessToken(decoded)
      const newRefreshToken = signRefreshToken(decoded)

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      })
    } catch (error) {
      console.error('Refresh token error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Token refresh failed' } })
    }
  },

  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId

      const userResult = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          avatarUrl: users.avatarUrl,
          role: users.role,
          preferredLanguage: users.preferredLanguage,
          preferredCurrency: users.preferredCurrency,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (userResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
        return
      }

      res.json({ success: true, data: userResult[0] })
    } catch (error) {
      console.error('Get profile error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get profile' } })
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { firstName, lastName, phone, avatarUrl, preferredLanguage, preferredCurrency } = req.body

      const updateData: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
      }

      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (phone) updateData.phone = phone
      if (avatarUrl) updateData.avatarUrl = avatarUrl
      if (preferredLanguage) updateData.preferredLanguage = preferredLanguage
      if (preferredCurrency) updateData.preferredCurrency = preferredCurrency

      await db.update(users).set(updateData).where(eq(users.id, userId))

      const updatedUser = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          avatarUrl: users.avatarUrl,
          preferredLanguage: users.preferredLanguage,
          preferredCurrency: users.preferredCurrency,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      res.json({ success: true, data: updatedUser[0] })
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } })
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { currentPassword, newPassword } = req.body

      const userResult = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1)
      if (userResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
        return
      }

      const isValidPassword = await comparePassword(currentPassword, userResult[0].passwordHash)
      if (!isValidPassword) {
        res.status(401).json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } })
        return
      }

      const newPasswordHash = await hashPassword(newPassword)
      await db.update(users).set({ passwordHash: newPasswordHash, updatedAt: new Date() }).where(eq(users.id, userId))

      res.json({ success: true, data: { message: 'Password changed successfully' } })
    } catch (error) {
      console.error('Change password error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to change password' } })
    }
  },

  adminListUsers: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, search, role, status } = req.query as any
      const offset = (page - 1) * limit

      let userList: any[]
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(users)
      const total = Number(countResult[0]?.count || 0)

      if (search) {
        userList = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            phone: users.phone,
            role: users.role,
            status: users.status,
            preferredLanguage: users.preferredLanguage,
            preferredCurrency: users.preferredCurrency,
            lastLoginAt: users.lastLoginAt,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(like(users.email, `%${search}%`))
          .orderBy(users.createdAt)
          .limit(limit)
          .offset(offset)
      } else {
        userList = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            phone: users.phone,
            role: users.role,
            status: users.status,
            preferredLanguage: users.preferredLanguage,
            preferredCurrency: users.preferredCurrency,
            lastLoginAt: users.lastLoginAt,
            createdAt: users.createdAt,
          })
          .from(users)
          .orderBy(users.createdAt)
          .limit(limit)
          .offset(offset)
      }

      res.json({
        success: true,
        data: {
          users: userList,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      })
    } catch (error) {
      console.error('Admin list users error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list users' } })
    }
  },

  adminGetUserById: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id as string

      const userResult = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          avatarUrl: users.avatarUrl,
          role: users.role,
          status: users.status,
          preferredLanguage: users.preferredLanguage,
          preferredCurrency: users.preferredCurrency,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (userResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
        return
      }

      res.json({ success: true, data: userResult[0] })
    } catch (error) {
      console.error('Admin get user error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get user' } })
    }
  },

  adminGetUserOrders: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id as string
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      const userExists = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
      if (userExists.length === 0) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
        return
      }

      const orderList = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          currency: orders.currency,
          createdAt: orders.createdAt,
          shippedAt: orders.shippedAt,
          deliveredAt: orders.deliveredAt,
        })
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.userId, userId))
      const total = Number(countResult[0]?.count || 0)

      res.json({
        success: true,
        data: {
          orders: orderList,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      })
    } catch (error) {
      console.error('Admin get user orders error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get user orders' } })
    }
  },

  adminGetUserAddresses: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id as string

      const userExists = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
      if (userExists.length === 0) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
        return
      }

      const userAddresses = await db
        .select({
          id: addresses.id,
          type: addresses.type,
          firstName: addresses.firstName,
          lastName: addresses.lastName,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
          country: addresses.country,
          phone: addresses.phone,
          isDefault: addresses.isDefault,
          createdAt: addresses.createdAt,
        })
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(desc(addresses.isDefault), addresses.createdAt)

      res.json({
        success: true,
        data: {
          addresses: userAddresses,
        },
      })
    } catch (error) {
      console.error('Admin get user addresses error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get user addresses' } })
    }
  },

  adminUpdateUser: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id as string
      const { firstName, lastName, phone, role, status, preferredLanguage, preferredCurrency } = req.body

      const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
      if (existing.length === 0) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
        return
      }

      const updateData: any = { updatedAt: new Date() }
      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (phone !== undefined) updateData.phone = phone
      if (role) updateData.role = role
      if (status) updateData.status = status
      if (preferredLanguage) updateData.preferredLanguage = preferredLanguage
      if (preferredCurrency) updateData.preferredCurrency = preferredCurrency

      await db.update(users).set(updateData).where(eq(users.id, userId))

      const updatedUser = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          role: users.role,
          status: users.status,
          preferredLanguage: users.preferredLanguage,
          preferredCurrency: users.preferredCurrency,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      res.json({ success: true, data: updatedUser[0] })
    } catch (error) {
      console.error('Admin update user error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } })
    }
  },

  adminDisableUser: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id as string
      const { status } = req.body

      const existing = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
      if (existing.length === 0) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } })
        return
      }

      if (existing[0].role === 'super_admin') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot disable super admin' } })
        return
      }

      await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId))

      res.json({ success: true, data: { id: userId, status } })
    } catch (error) {
      console.error('Admin disable user error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user status' } })
    }
  },
}