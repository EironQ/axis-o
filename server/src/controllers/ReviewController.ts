import { Request, Response } from 'express'
import { db } from '../config/database'
import { reviews, products, users } from '../db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'

export const ReviewController = {
  list: async (req: Request, res: Response) => {
    try {
      const productId = req.query.productId as string
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      const conditions = [eq(reviews.status, 'approved')]
      if (productId) conditions.push(eq(reviews.productId, productId))

      const reviewList = await db
        .select({
          id: reviews.id,
          productId: reviews.productId,
          userId: reviews.userId,
          rating: reviews.rating,
          title: reviews.title,
          content: reviews.content,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db.select({ count: sql`COUNT(*)` }).from(reviews).where(and(...conditions))
      const totalCount = parseInt(countResult[0]?.count as string) || 0

      res.json({
        success: true,
        data: {
          reviews: reviewList,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
      })
    } catch (error) {
      console.error('Get reviews error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reviews' } })
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const reviewId = req.params.id as string

      const reviewResult = await db
        .select({
          id: reviews.id,
          productId: reviews.productId,
          userId: reviews.userId,
          rating: reviews.rating,
          title: reviews.title,
          content: reviews.content,
          status: reviews.status,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.id, reviewId))
        .limit(1)

      if (reviewResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } })
        return
      }

      res.json({ success: true, data: reviewResult[0] })
    } catch (error) {
      console.error('Get review error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch review' } })
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { productId, orderId, rating, title, content } = req.body

      const existingReview = await db.select().from(reviews).where(and(eq(reviews.userId, userId), eq(reviews.productId, productId))).limit(1)
      if (existingReview.length > 0) {
        res.status(400).json({ success: false, error: { code: 'DUPLICATE_REVIEW', message: 'You have already reviewed this product' } })
        return
      }

      const reviewId = uuidv4()
      await db.insert(reviews).values({
        id: reviewId,
        userId,
        productId,
        orderId,
        rating,
        title,
        content,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      res.status(201).json({ success: true, data: { id: reviewId, status: 'pending' } })
    } catch (error) {
      console.error('Create review error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create review' } })
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const reviewId = req.params.id as string
      const { rating, title, content } = req.body

      const existingReview = await db.select().from(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId))).limit(1)
      if (existingReview.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } })
        return
      }

      await db.update(reviews).set({
        rating,
        title,
        content,
        status: 'pending',
        updatedAt: new Date(),
      }).where(eq(reviews.id, reviewId))

      res.json({ success: true, data: { id: reviewId, status: 'pending' } })
    } catch (error) {
      console.error('Update review error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update review' } })
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const reviewId = req.params.id as string

      const existingReview = await db.select().from(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId))).limit(1)
      if (existingReview.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } })
        return
      }

      await db.delete(reviews).where(eq(reviews.id, reviewId))

      res.json({ success: true, data: null })
    } catch (error) {
      console.error('Delete review error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete review' } })
    }
  },

  getProductStats: async (req: Request, res: Response) => {
    try {
      const productId = req.params.productId as string

      const stats = await db
        .select({
          total: sql`COUNT(*)`,
          average: sql`AVG(rating)`,
        })
        .from(reviews)
        .where(and(eq(reviews.productId, productId), eq(reviews.status, 'approved')))

      const ratingCounts = await db
        .select({
          rating: reviews.rating,
          count: sql`COUNT(*)`,
        })
        .from(reviews)
        .where(and(eq(reviews.productId, productId), eq(reviews.status, 'approved')))
        .groupBy(reviews.rating)

      res.json({
        success: true,
        data: {
          totalReviews: parseInt(stats[0]?.total as string) || 0,
          averageRating: parseFloat(stats[0]?.average as string) || 0,
          ratingDistribution: ratingCounts.reduce((acc, r) => {
            acc[r.rating] = parseInt(r.count as string)
            return acc
          }, {} as Record<number, number>),
        },
      })
    } catch (error) {
      console.error('Get product stats error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product stats' } })
    }
  },
}
