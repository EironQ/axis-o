import { Request, Response } from 'express'
import { db } from '../config/database'
import { cartItems, productVariants, products, productImages } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'

export const CartController = {
  getCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId

      const cartResult = await db
        .select({
          id: cartItems.id,
          variantId: cartItems.variantId,
          quantity: cartItems.quantity,
          productId: productVariants.productId,
          colorName: productVariants.colorName,
          colorHex: productVariants.colorHex,
          size: productVariants.size,
          priceAdjustment: productVariants.priceAdjustment,
          stockQuantity: productVariants.stockQuantity,
          productNameEn: products.nameEn,
          productNameZh: products.nameZh,
          productName: products.nameZh,
          slug: products.slug,
          basePrice: products.basePrice,
          material: products.material,
        })
        .from(cartItems)
        .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(eq(cartItems.userId, userId))

      const cartItemsWithImages = await Promise.all(
        cartResult.map(async (item) => {
          const images = await db
            .select({ url: productImages.url })
            .from(productImages)
            .where(and(eq(productImages.productId, item.productId), eq(productImages.isPrimary, 1)))
            .limit(1)

          const price = parseFloat(item.basePrice.toString()) + parseFloat(item.priceAdjustment.toString())

          return {
            ...item,
            image: images[0]?.url,
            price,
            totalPrice: price * item.quantity,
          }
        })
      )

      const totalItems = cartItemsWithImages.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = cartItemsWithImages.reduce((sum, item) => sum + item.totalPrice, 0)

      res.json({
        success: true,
        data: {
          items: cartItemsWithImages,
          totalItems,
          totalPrice: parseFloat(totalPrice.toFixed(2)),
        },
      })
    } catch (error) {
      console.error('Get cart error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch cart' } })
    }
  },

  addItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { variantId, quantity = 1 } = req.body

      const variant = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1)
      if (variant.length === 0) {
        res.status(404).json({ success: false, error: { code: 'VARIANT_NOT_FOUND', message: 'Product variant not found' } })
        return
      }

      const existingItem = await db
        .select({ id: cartItems.id, quantity: cartItems.quantity })
        .from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)))
        .limit(1)

      if (existingItem.length > 0) {
        const newQuantity = existingItem[0].quantity + quantity
        await db.update(cartItems).set({ quantity: newQuantity, updatedAt: new Date() }).where(eq(cartItems.id, existingItem[0].id))

        res.json({ success: true, data: { id: existingItem[0].id, quantity: newQuantity } })
      } else {
        const cartItemId = uuidv4()
        await db.insert(cartItems).values({
          id: cartItemId,
          userId,
          variantId,
          quantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        res.status(201).json({ success: true, data: { id: cartItemId, quantity } })
      }
    } catch (error) {
      console.error('Add cart item error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add item to cart' } })
    }
  },

  updateItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const itemId = req.params.id as string
      const { quantity } = req.body

      if (quantity === 0) {
        await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
        res.json({ success: true, data: null })
        return
      }

      await db.update(cartItems).set({ quantity, updatedAt: new Date() }).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      res.json({ success: true, data: { id: itemId, quantity } })
    } catch (error) {
      console.error('Update cart item error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update cart item' } })
    }
  },

  removeItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const itemId = req.params.id as string

      await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      res.json({ success: true, data: null })
    } catch (error) {
      console.error('Remove cart item error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove cart item' } })
    }
  },

  clearCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId

      await db.delete(cartItems).where(eq(cartItems.userId, userId))
      res.json({ success: true, data: null })
    } catch (error) {
      console.error('Clear cart error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to clear cart' } })
    }
  },
}
