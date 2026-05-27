import { Request, Response } from 'express'
import { db } from '../config/database'
import { wishlistItems, products, productImages } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'

export const WishlistController = {
  list: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const lang = req.query.lang as string || 'en'

      const wishlistResult = await db
        .select({
          id: wishlistItems.id,
          productId: wishlistItems.productId,
          nameEn: products.nameEn,
          nameZh: products.nameZh,
          slug: products.slug,
          basePrice: products.basePrice,
          createdAt: wishlistItems.createdAt,
        })
        .from(wishlistItems)
        .innerJoin(products, eq(wishlistItems.productId, products.id))
        .where(eq(wishlistItems.userId, userId))
        .orderBy(wishlistItems.createdAt)

      const wishlistWithImages = await Promise.all(
        wishlistResult.map(async (item) => {
          const images = await db
            .select({ url: productImages.url, isPrimary: productImages.isPrimary })
            .from(productImages)
            .where(and(eq(productImages.productId, item.productId), eq(productImages.isPrimary, 1)))
            .limit(1)

          return {
            ...item,
            image: images[0]?.url,
            name: lang === 'zh' ? item.nameZh : item.nameEn,
          }
        })
      )

      res.json({ success: true, data: { items: wishlistWithImages } })
    } catch (error) {
      console.error('Get wishlist error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch wishlist' } })
    }
  },

  addItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { productId } = req.body

      const existingItem = await db.select().from(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))).limit(1)
      if (existingItem.length > 0) {
        res.status(400).json({ success: false, error: { code: 'DUPLICATE_ITEM', message: 'Product is already in wishlist' } })
        return
      }

      const wishlistId = uuidv4()
      await db.insert(wishlistItems).values({
        id: wishlistId,
        userId,
        productId,
        createdAt: new Date(),
      })

      res.status(201).json({ success: true, data: { id: wishlistId, productId } })
    } catch (error) {
      console.error('Add wishlist item error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add item to wishlist' } })
    }
  },

  removeItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const itemId = req.params.id as string

      await db.delete(wishlistItems).where(and(eq(wishlistItems.id, itemId), eq(wishlistItems.userId, userId)))

      res.json({ success: true, data: null })
    } catch (error) {
      console.error('Remove wishlist item error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove item from wishlist' } })
    }
  },

  removeByProduct: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const productId = req.params.productId as string

      await db.delete(wishlistItems).where(and(eq(wishlistItems.productId, productId), eq(wishlistItems.userId, userId)))

      res.json({ success: true, data: null })
    } catch (error) {
      console.error('Remove wishlist item by product error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove item from wishlist' } })
    }
  },

  clear: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId

      await db.delete(wishlistItems).where(eq(wishlistItems.userId, userId))

      res.json({ success: true, data: null })
    } catch (error) {
      console.error('Clear wishlist error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to clear wishlist' } })
    }
  },

  checkProduct: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const productId = req.params.productId as string

      const exists = await db.select().from(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))).limit(1)

      res.json({ success: true, data: { isInWishlist: exists.length > 0 } })
    } catch (error) {
      console.error('Check wishlist product error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check wishlist' } })
    }
  },
}
