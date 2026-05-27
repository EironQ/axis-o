import { Request, Response } from 'express'
import { ReturnService } from '../services/return'
import { db } from '../config/database'
import { orders } from '../db/schema'
import { eq, and } from 'drizzle-orm'

function getQueryString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export const ReturnController = {
  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { orderId, type, reason, reasonDetail, images, items } = req.body

      if (!orderId || !type || !reason || !items || items.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
        })
        return
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1)

      if (!order) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Order not found' }
        })
        return
      }

      if (!['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Order cannot be returned' }
        })
        return
      }

      const validReasons = ['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'arrived_late', 'other']
      if (!validReasons.includes(reason)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid reason' }
        })
        return
      }

      const returnData = await ReturnService.create({
        orderId,
        userId,
        type,
        reason,
        reasonDetail,
        images,
        items,
      })

      res.status(201).json({
        success: true,
        data: returnData,
      })
    } catch (error) {
      console.error('Create return error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create return request' }
      })
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const page = parseInt(getQueryString(req.query.page as string | string[]) || '1') || 1
      const limit = parseInt(getQueryString(req.query.limit as string | string[]) || '10') || 10
      const status = getQueryString(req.query.status as string | string[])

      const result = await ReturnService.list(userId, { page, limit, status })

      res.json({
        success: true,
        data: result.list,
        pagination: result.pagination,
      })
    } catch (error) {
      console.error('List returns error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch returns' }
      })
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const returnId = req.params.id as string

      const returnData = await ReturnService.getById(returnId, userId)

      if (!returnData) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Return not found' }
        })
        return
      }

      res.json({
        success: true,
        data: returnData,
      })
    } catch (error) {
      console.error('Get return error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch return' }
      })
    }
  },

  cancel: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const returnId = req.params.id as string

      const returnData = await ReturnService.getById(returnId, userId)

      if (!returnData) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Return not found' }
        })
        return
      }

      if (returnData.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Only pending returns can be cancelled' }
        })
        return
      }

      const updated = await ReturnService.update(returnId, {
        status: 'cancelled',
      }, userId, 'user')

      res.json({
        success: true,
        data: updated,
        message: 'Return cancelled successfully',
      })
    } catch (error) {
      console.error('Cancel return error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel return' }
      })
    }
  },

  adminList: async (req: Request, res: Response) => {
    try {
      const page = parseInt(getQueryString(req.query.page as string | string[]) || '1') || 1
      const limit = parseInt(getQueryString(req.query.limit as string | string[]) || '20') || 20
      const status = getQueryString(req.query.status as string | string[])
      const type = getQueryString(req.query.type as string | string[])
      const search = getQueryString(req.query.search as string | string[])

      const result = await ReturnService.adminList({ page, limit, status, type, search })

      res.json({
        success: true,
        data: result.list,
        pagination: result.pagination,
        stats: result.stats,
      })
    } catch (error) {
      console.error('Admin list returns error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch returns' }
      })
    }
  },

  adminGetById: async (req: Request, res: Response) => {
    try {
      const returnId = req.params.id as string

      const returnData = await ReturnService.getById(returnId)

      if (!returnData) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Return not found' }
        })
        return
      }

      res.json({
        success: true,
        data: returnData,
      })
    } catch (error) {
      console.error('Admin get return error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch return' }
      })
    }
  },

  adminUpdate: async (req: Request, res: Response) => {
    try {
      const returnId = req.params.id as string
      const adminId = req.user!.userId
      const { status, adminNote, refundAmount, refundReason } = req.body

      const existing = await ReturnService.getById(returnId)

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Return not found' }
        })
        return
      }

      if (status === 'rejected' && !refundReason) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Reject reason is required' }
        })
        return
      }

      const updated = await ReturnService.update(returnId, {
        status,
        adminNote,
        processedBy: adminId,
        refundAmount,
        refundReason,
      }, adminId, 'admin')

      res.json({
        success: true,
        data: updated,
        message: `Return ${status} successfully`,
      })
    } catch (error) {
      console.error('Admin update return error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update return' }
      })
    }
  },

  adminRefund: async (req: Request, res: Response) => {
    try {
      const returnId = req.params.id as string
      const adminId = req.user!.userId
      const { refundAmount } = req.body

      if (!refundAmount || refundAmount <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid refund amount is required' }
        })
        return
      }

      const returnData = await ReturnService.getById(returnId)

      if (!returnData) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Return not found' }
        })
        return
      }

      if (returnData.status !== 'approved') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Only approved returns can be refunded' }
        })
        return
      }

      const updated = await ReturnService.refund(returnId, refundAmount, adminId)

      res.json({
        success: true,
        data: updated,
        message: '退款处理完成',
      })
    } catch (error) {
      console.error('Refund error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message || 'Failed to process refund' }
      })
    }
  },
}