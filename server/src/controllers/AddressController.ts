import { Request, Response } from 'express'
import { db } from '../config/database'
import { addresses } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'

export const AddressController = {
  list: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId

      const addressList = await db
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
          updatedAt: addresses.updatedAt,
        })
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(addresses.isDefault, addresses.createdAt)

      res.json({ success: true, data: addressList })
    } catch (error) {
      console.error('Get addresses error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch addresses' } })
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const addressId = req.params.id as string

      const addressResult = await db
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
        })
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
        .limit(1)

      if (addressResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } })
        return
      }

      res.json({ success: true, data: addressResult[0] })
    } catch (error) {
      console.error('Get address error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch address' } })
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { type = 'shipping', firstName, lastName, line1, line2, city, state, postalCode, country, phone, isDefault = false } = req.body

      if (isDefault) {
        await db.update(addresses).set({ isDefault: 0, updatedAt: new Date() }).where(eq(addresses.userId, userId))
      }

      const addressId = uuidv4()
      await db.insert(addresses).values({
        id: addressId,
        userId,
        type,
        firstName,
        lastName,
        line1,
        line2,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault: isDefault ? 1 : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      res.status(201).json({ success: true, data: { id: addressId } })
    } catch (error) {
      console.error('Create address error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create address' } })
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const addressId = req.params.id as string
      const { type, firstName, lastName, line1, line2, city, state, postalCode, country, phone, isDefault } = req.body

      const existingAddress = await db.select().from(addresses).where(and(eq(addresses.id, addressId), eq(addresses.userId, userId))).limit(1)
      if (existingAddress.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } })
        return
      }

      if (isDefault) {
        await db.update(addresses).set({ isDefault: 0, updatedAt: new Date() }).where(eq(addresses.userId, userId))
      }

      const updateData: Partial<typeof addresses.$inferInsert> = {
        updatedAt: new Date(),
      }

      if (type) updateData.type = type
      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (line1) updateData.line1 = line1
      if (line2) updateData.line2 = line2
      if (city) updateData.city = city
      if (state) updateData.state = state
      if (postalCode) updateData.postalCode = postalCode
      if (country) updateData.country = country
      if (phone) updateData.phone = phone
      if (isDefault !== undefined) updateData.isDefault = isDefault ? 1 : 0

      await db.update(addresses).set(updateData).where(eq(addresses.id, addressId))

      res.json({ success: true, data: { id: addressId } })
    } catch (error) {
      console.error('Update address error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update address' } })
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const addressId = req.params.id as string

      const existingAddress = await db.select().from(addresses).where(and(eq(addresses.id, addressId), eq(addresses.userId, userId))).limit(1)
      if (existingAddress.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } })
        return
      }

      await db.delete(addresses).where(eq(addresses.id, addressId))

      res.json({ success: true, data: null })
    } catch (error) {
      console.error('Delete address error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete address' } })
    }
  },

  setDefault: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const addressId = req.params.id as string

      const existingAddress = await db.select().from(addresses).where(and(eq(addresses.id, addressId), eq(addresses.userId, userId))).limit(1)
      if (existingAddress.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } })
        return
      }

      await db.transaction(async (tx) => {
        await tx.update(addresses).set({ isDefault: 0, updatedAt: new Date() }).where(eq(addresses.userId, userId))
        await tx.update(addresses).set({ isDefault: 1, updatedAt: new Date() }).where(eq(addresses.id, addressId))
      })

      res.json({ success: true, data: { id: addressId, isDefault: true } })
    } catch (error) {
      console.error('Set default address error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to set default address' } })
    }
  },
}
