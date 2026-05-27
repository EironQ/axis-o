import { Request, Response } from 'express'
import { db } from '../config/database'
import { categories, products } from '../db/schema'
import { eq, or, like, and, isNull, sql, asc, not } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'

export const CategoryController = {
  list: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, search, activeOnly } = req.query as any
      const offset = (page - 1) * limit

      const conditions: any[] = [isNull(categories.parentId)]
      if (activeOnly === 'true') {
        conditions.push(eq(categories.isActive, 1))
      }
      if (search) {
        conditions.push(
          or(
            like(categories.nameEn, `%${search}%`),
            like(categories.nameZh, `%${search}%`),
            like(categories.slug, `%${search}%`)
          )
        )
      }

      const categoryList = await db
        .select({
          id: categories.id,
          nameEn: categories.nameEn,
          nameZh: categories.nameZh,
          slug: categories.slug,
          imageUrl: categories.imageUrl,
          sortOrder: categories.sortOrder,
          isActive: categories.isActive,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .where(and(...conditions))
        .orderBy(asc(categories.sortOrder), asc(categories.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(and(...conditions))
      const total = Number(countResult[0]?.count || 0)

      res.json({
        success: true,
        data: {
          categories: categoryList,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      })
    } catch (error) {
      console.error('Get categories error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get categories' } })
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.id as string

      const categoryResult = await db
        .select({
          id: categories.id,
          nameEn: categories.nameEn,
          nameZh: categories.nameZh,
          slug: categories.slug,
          imageUrl: categories.imageUrl,
          sortOrder: categories.sortOrder,
          isActive: categories.isActive,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1)

      if (categoryResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } })
        return
      }

      const category = categoryResult[0]

      const productCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.categoryId, categoryId))

      res.json({
        success: true,
        data: {
          ...category,
          productCount: Number(productCount[0]?.count || 0),
        },
      })
    } catch (error) {
      console.error('Get category error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get category' } })
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { nameEn, nameZh, slug, imageUrl, sortOrder = 0, isActive = 1 } = req.body

      if (!nameEn || !nameZh || !slug) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and slug are required' } })
        return
      }

      const slugExists = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1)
      if (slugExists.length > 0) {
        res.status(400).json({ success: false, error: { code: 'DUPLICATE_SLUG', message: 'Slug already exists' } })
        return
      }

      const categoryId = uuidv4()
      await db.insert(categories).values({
        id: categoryId,
        nameEn,
        nameZh,
        slug,
        parentId: null,
        imageUrl,
        sortOrder,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const newCategory = await db
        .select({
          id: categories.id,
          nameEn: categories.nameEn,
          nameZh: categories.nameZh,
          slug: categories.slug,
          imageUrl: categories.imageUrl,
          sortOrder: categories.sortOrder,
          isActive: categories.isActive,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1)

      res.status(201).json({
        success: true,
        data: newCategory[0],
      })
    } catch (error) {
      console.error('Create category error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' } })
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.id as string
      const { nameEn, nameZh, slug, imageUrl, sortOrder, isActive } = req.body

      const categoryExists = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1)
      if (categoryExists.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } })
        return
      }

      if (slug) {
        const slugExists = await db
          .select({ id: categories.id })
          .from(categories)
          .where(and(eq(categories.slug, slug), not(eq(categories.id, categoryId))))
          .limit(1)
        if (slugExists.length > 0) {
          res.status(400).json({ success: false, error: { code: 'DUPLICATE_SLUG', message: 'Slug already exists' } })
          return
        }
      }

      const updates: any = { updatedAt: new Date() }
      if (nameEn !== undefined) updates.nameEn = nameEn
      if (nameZh !== undefined) updates.nameZh = nameZh
      if (slug !== undefined) updates.slug = slug
      if (imageUrl !== undefined) updates.imageUrl = imageUrl
      if (sortOrder !== undefined) updates.sortOrder = sortOrder
      if (isActive !== undefined) updates.isActive = isActive

      await db.update(categories).set(updates).where(eq(categories.id, categoryId))

      const updatedCategory = await db
        .select({
          id: categories.id,
          nameEn: categories.nameEn,
          nameZh: categories.nameZh,
          slug: categories.slug,
          imageUrl: categories.imageUrl,
          sortOrder: categories.sortOrder,
          isActive: categories.isActive,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1)

      res.json({
        success: true,
        data: updatedCategory[0],
      })
    } catch (error) {
      console.error('Update category error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' } })
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.id as string

      const categoryExists = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1)
      if (categoryExists.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } })
        return
      }

      const productCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.categoryId, categoryId))
      if (Number(productCount[0]?.count || 0) > 0) {
        res.status(400).json({ success: false, error: { code: 'HAS_PRODUCTS', message: 'Category has products, cannot delete' } })
        return
      }

      await db.delete(categories).where(eq(categories.id, categoryId))

      res.json({
        success: true,
        data: { id: categoryId },
      })
    } catch (error) {
      console.error('Delete category error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' } })
    }
  },

  toggleStatus: async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.id as string
      const { isActive } = req.body

      const categoryExists = await db.select({ id: categories.id, isActive: categories.isActive }).from(categories).where(eq(categories.id, categoryId)).limit(1)
      if (categoryExists.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } })
        return
      }

      await db.update(categories).set({ isActive, updatedAt: new Date() }).where(eq(categories.id, categoryId))

      res.json({
        success: true,
        data: { id: categoryId, isActive },
      })
    } catch (error) {
      console.error('Toggle category status error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update category status' } })
    }
  },
}