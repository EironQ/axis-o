import { Request, Response } from 'express'
import { db } from '../config/database'
import { banners } from '../db/schema'
import { eq, desc, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'

function parseBanner(b: any) {
  return {
    ...b,
    tags: typeof b.tags === 'string' ? (() => { try { return JSON.parse(b.tags) } catch { return [] } })() : b.tags || [],
  }
}

export const BannerController = {
  getActive: async (_req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(banners)
        .where(eq(banners.isActive, 1))
        .orderBy(asc(banners.sortOrder))

      const data = result.map(parseBanner)

      res.json({ success: true, data })
    } catch (error) {
      console.error('Get active banners error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch banners' } })
    }
  },

  adminList: async (_req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(banners)
        .orderBy(asc(banners.sortOrder), desc(banners.createdAt))

      res.json({ success: true, data: result.map(parseBanner) })
    } catch (error) {
      console.error('Admin list banners error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch banners' } })
    }
  },

  adminGetById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const result = await db
        .select()
        .from(banners)
        .where(eq(banners.id, id))
        .limit(1)

      if (result.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Banner not found' } })
        return
      }

      res.json({ success: true, data: parseBanner(result[0]) })
    } catch (error) {
      console.error('Admin get banner error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch banner' } })
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { image, title, subtitle, link, linkText, tags, sortOrder, isActive } = req.body

      const id = uuidv4()
      await db.insert(banners).values({
        id,
        image: image || '',
        title: title || '',
        subtitle: subtitle || '',
        link: link || '/products',
        linkText: linkText || 'Shop Now',
        tags: tags ? JSON.stringify(tags) : null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
      })

      const created = await db.select().from(banners).where(eq(banners.id, id)).limit(1)

      res.status(201).json({ success: true, data: parseBanner(created[0]) })
    } catch (error) {
      console.error('Create banner error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create banner' } })
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const existing = await db.select().from(banners).where(eq(banners.id, id)).limit(1)
      if (existing.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Banner not found' } })
        return
      }

      const { image, title, subtitle, link, linkText, tags, sortOrder, isActive } = req.body

      const updateData: Record<string, any> = { updatedAt: new Date() }
      if (image !== undefined) updateData.image = image
      if (title !== undefined) updateData.title = title
      if (subtitle !== undefined) updateData.subtitle = subtitle
      if (link !== undefined) updateData.link = link
      if (linkText !== undefined) updateData.linkText = linkText
      if (tags !== undefined) updateData.tags = JSON.stringify(tags)
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder
      if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0

      await db.update(banners).set(updateData).where(eq(banners.id, id))

      const updated = await db.select().from(banners).where(eq(banners.id, id)).limit(1)

      res.json({ success: true, data: parseBanner(updated[0]) })
    } catch (error) {
      console.error('Update banner error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update banner' } })
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const existing = await db.select().from(banners).where(eq(banners.id, id)).limit(1)
      if (existing.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Banner not found' } })
        return
      }

      await db.delete(banners).where(eq(banners.id, id))

      res.json({ success: true, message: 'Banner deleted' })
    } catch (error) {
      console.error('Delete banner error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete banner' } })
    }
  },
}
