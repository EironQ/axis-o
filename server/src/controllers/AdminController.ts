import { Request, Response } from 'express'
import { db } from '../config/database'
import { users, orders, products } from '../db/schema'
import { eq, and, count, sum, desc, sql } from 'drizzle-orm'
import { hashPassword, comparePassword } from '../utils/password'
import { signAccessToken, signRefreshToken } from '../utils/jwt'
import { env } from '../config/env'
import { v4 as uuidv4 } from '../utils/uuid'

export const AdminController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      const userResult = await db.select().from(users).where(
        and(
          eq(users.email, email),
          eq(users.status, 'active')
        )
      ).limit(1)

      if (userResult.length === 0) {
        res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
        return
      }

      const user = userResult[0]

      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } })
        return
      }

      const isValidPassword = await comparePassword(password, user.passwordHash)

      if (!isValidPassword) {
        res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
        return
      }

      const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role }, env.JWT_ADMIN_EXPIRES_IN)
      const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role })

      await db.update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id))

      res.json({
        success: true,
        data: {
          adminId: user.id,
          email: user.email,
          role: user.role,
          accessToken,
          refreshToken,
        },
      })
    } catch (error) {
      console.error('Admin login error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Login failed' } })
    }
  },

  getDashboard: async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear()

      const [orderStats, revenueStats, userStats, productStats, statusDistribution, monthlyRevenue, recentOrdersResult] = await Promise.all([
        db.select({ count: count() }).from(orders),
        db.select({ total: sum(orders.total) }).from(orders),
        db.select({ count: count() }).from(users).where(eq(users.status, 'active')),
        db.select({ count: count() }).from(products).where(eq(products.isActive, 1)),
        db
          .select({
            status: orders.status,
            count: count().mapWith(Number),
          })
          .from(orders)
          .groupBy(orders.status),
        db
          .select({
            month: sql`MONTH(${orders.createdAt})`.mapWith(Number),
            revenue: sql`CAST(SUM(${orders.total}) AS DECIMAL(10,2))`.mapWith(Number),
          })
          .from(orders)
          .where(sql`YEAR(${orders.createdAt}) = ${currentYear}`)
          .groupBy(sql`MONTH(${orders.createdAt})`)
          .orderBy(sql`MONTH(${orders.createdAt})`),
        db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            total: orders.total,
            createdAt: orders.createdAt,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(orders)
          .leftJoin(users, eq(orders.userId, users.id))
          .orderBy(desc(orders.createdAt))
          .limit(5),
      ])

      const totalOrders = orderStats[0]?.count || 0
      const totalRevenue = Number(revenueStats[0]?.total) || 0
      const totalUsers = userStats[0]?.count || 0
      const totalProducts = productStats[0]?.count || 0

      const statusMap: Record<string, string> = {
        pending: '待处理',
        paid: '已付款',
        processing: '处理中',
        shipped: '已发货',
        delivered: '已完成',
        cancelled: '已取消',
        refunded: '已退款',
      }
      const statusColors: Record<string, string> = {
        pending: 'bg-yellow-400',
        paid: 'bg-blue-300',
        processing: 'bg-indigo-400',
        shipped: 'bg-blue-400',
        delivered: 'bg-green-400',
        cancelled: 'bg-gray-400',
        refunded: 'bg-red-400',
      }
      const totalOrderCount = statusDistribution.reduce((acc, cur) => acc + cur.count, 0) || 1
      const orderStatusDistribution = statusDistribution.map((item) => ({
        status: statusMap[item.status] || item.status,
        count: item.count,
        percentage: Math.round((item.count / totalOrderCount) * 100),
        color: statusColors[item.status] || 'bg-gray-400',
      }))

      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      const revenueByMonth = monthNames.map((name, index) => {
        const found = monthlyRevenue.find((item) => item.month === index + 1)
        return {
          month: name,
          revenue: found ? Number(found.revenue) : 0,
        }
      })

      const orderStatusMap: Record<string, string> = {
        pending: '待处理',
        paid: '已付款',
        processing: '处理中',
        shipped: '已发货',
        delivered: '已完成',
        cancelled: '已取消',
        refunded: '已退款',
      }
      const recentOrders = recentOrdersResult.map((order) => ({
        id: order.orderNumber,
        customer: `${order.lastName}${order.firstName}`,
        total: `¥${Number(order.total).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: orderStatusMap[order.status] || order.status,
        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '',
      }))

      res.json({
        success: true,
        data: {
          totalOrders,
          totalRevenue,
          totalUsers,
          totalProducts,
          revenueData: revenueByMonth,
          orderStatusDistribution,
          recentOrders,
        },
      })
    } catch (error) {
      console.error('Get dashboard error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get dashboard data' } })
    }
  },
}