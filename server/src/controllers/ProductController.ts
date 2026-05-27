import { Request, Response } from 'express'
import { db } from '../config/database'
import { products, productImages, productVariants, productDetailImages, categories, orderItems, orders } from '../db/schema'
import { eq, and, like, sql, desc, asc, sum } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'

export const ProductController = {
  list: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, sort = 'newest', series, category, search, lang = 'zh' } = req.query as any
      const offset = (page - 1) * limit

      const conditions = [eq(products.isActive, 1)]
      if (series) conditions.push(eq(products.series, series))
      if (category) conditions.push(eq(products.categoryId, category))
      if (search) conditions.push(like(products.nameEn, `%${search}%`))

      let orderBy = desc(products.sortOrder)
      if (sort === 'price_asc') orderBy = asc(products.basePrice)
      if (sort === 'price_desc') orderBy = desc(products.basePrice)

      const productList = await db
        .select({
          id: products.id,
          nameEn: products.nameEn,
          nameZh: products.nameZh,
          slug: products.slug,
          descriptionEn: products.descriptionEn,
          descriptionZh: products.descriptionZh,
          series: products.series,
          material: products.material,
          basePrice: products.basePrice,
          isBestseller: products.isBestseller,
          createdAt: products.createdAt,
        })
        .from(products)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset)

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(...conditions))
      const total = Number(countResult[0].count)

      const productsWithImages = await Promise.all(
        productList.map(async (product) => {
          const images = await db
            .select({ url: productImages.url, altText: productImages.altText, isPrimary: productImages.isPrimary })
            .from(productImages)
            .where(eq(productImages.productId, product.id))
            .orderBy(productImages.sortOrder)

          const variants = await db
            .select({
              id: productVariants.id,
              colorName: productVariants.colorName,
              colorHex: productVariants.colorHex,
              size: productVariants.size,
              priceAdjustment: productVariants.priceAdjustment,
              stockQuantity: productVariants.stockQuantity,
            })
            .from(productVariants)
            .where(eq(productVariants.productId, product.id))

          return {
            ...product,
            images,
            variants,
            name: lang === 'zh' ? product.nameZh : product.nameEn,
            description: lang === 'zh' ? product.descriptionZh : product.descriptionEn,
          }
        })
      )

      res.json({
        success: true,
        data: {
          products: productsWithImages,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      console.error('Product list error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } })
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const productId = req.params.id as string
      const lang = req.query.lang as string || 'zh'

      let productResult = await db.select().from(products).where(eq(products.id, productId)).limit(1)

      if (productResult.length === 0) {
        productResult = await db.select().from(products).where(eq(products.slug, productId)).limit(1)
      }

      if (productResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } })
        return
      }

      const product = productResult[0]

      const images = await db
        .select({ url: productImages.url, altText: productImages.altText, isPrimary: productImages.isPrimary, sortOrder: productImages.sortOrder })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder)

      const variants = await db
        .select({
          id: productVariants.id,
          colorName: productVariants.colorName,
          colorHex: productVariants.colorHex,
          size: productVariants.size,
          sku: productVariants.sku,
          priceAdjustment: productVariants.priceAdjustment,
          stockQuantity: productVariants.stockQuantity,
        })
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))

      const detailImages = await db
        .select({
          image: productDetailImages.image,
          title: productDetailImages.title,
          description: productDetailImages.description,
        })
        .from(productDetailImages)
        .where(eq(productDetailImages.productId, product.id))
        .orderBy(productDetailImages.sortOrder)

      res.json({
        success: true,
        data: {
          ...product,
          images,
          variants,
          detailImages,
          name: lang === 'zh' ? product.nameZh : product.nameEn,
          description: lang === 'zh' ? product.descriptionZh : product.descriptionEn,
          story: lang === 'zh' ? product.storyZh : product.storyEn,
        },
      })
    } catch (error) {
      console.error('Get product error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' } })
    }
  },

  getBySlug: async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string
      const lang = req.query.lang as string || 'zh'

      const productResult = await db.select().from(products).where(eq(products.slug, slug)).limit(1)

      if (productResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } })
        return
      }

      const product = productResult[0]

      const images = await db
        .select({ url: productImages.url, altText: productImages.altText, isPrimary: productImages.isPrimary, sortOrder: productImages.sortOrder })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder)

      const variants = await db
        .select({
          id: productVariants.id,
          colorName: productVariants.colorName,
          colorHex: productVariants.colorHex,
          size: productVariants.size,
          sku: productVariants.sku,
          priceAdjustment: productVariants.priceAdjustment,
          stockQuantity: productVariants.stockQuantity,
        })
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))

      const detailImages = await db
        .select({
          image: productDetailImages.image,
          title: productDetailImages.title,
          description: productDetailImages.description,
        })
        .from(productDetailImages)
        .where(eq(productDetailImages.productId, product.id))
        .orderBy(productDetailImages.sortOrder)

      res.json({
        success: true,
        data: {
          ...product,
          images,
          variants,
          detailImages,
          name: lang === 'zh' ? product.nameZh : product.nameEn,
          description: lang === 'zh' ? product.descriptionZh : product.descriptionEn,
          story: lang === 'zh' ? product.storyZh : product.storyEn,
        },
      })
    } catch (error) {
      console.error('Get product by slug error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' } })
    }
  },

  getBestsellers: async (req: Request, res: Response) => {
    try {
      const lang = req.query.lang as string || 'en'
      const limit = parseInt(req.query.limit as string) || 8

      const productsResult = await db
        .select({
          id: products.id,
          nameEn: products.nameEn,
          nameZh: products.nameZh,
          slug: products.slug,
          basePrice: products.basePrice,
        })
        .from(products)
        .where(and(eq(products.isActive, 1), eq(products.isBestseller, 1)))
        .orderBy(products.sortOrder)
        .limit(limit)

      const productsWithImages = await Promise.all(
        productsResult.map(async (product) => {
          const images = await db
            .select({ url: productImages.url, altText: productImages.altText })
            .from(productImages)
            .where(and(eq(productImages.productId, product.id), eq(productImages.isPrimary, 1)))
            .limit(1)

          return {
            ...product,
            image: images[0]?.url,
            name: lang === 'zh' ? product.nameZh : product.nameEn,
          }
        })
      )

      res.json({ success: true, data: { products: productsWithImages } })
    } catch (error) {
      console.error('Get bestsellers error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bestsellers' } })
    }
  },

  getCategories: async (req: Request, res: Response) => {
    try {
      const lang = req.query.lang as string || 'en'

      const categoriesResult = await db
        .select({
          id: categories.id,
          nameEn: categories.nameEn,
          nameZh: categories.nameZh,
          slug: categories.slug,
          parentId: categories.parentId,
          imageUrl: categories.imageUrl,
          sortOrder: categories.sortOrder,
        })
        .from(categories)
        .where(eq(categories.isActive, 1))
        .orderBy(categories.sortOrder)

      res.json({
        success: true,
        data: {
          categories: categoriesResult.map((cat) => ({
            ...cat,
            name: lang === 'zh' ? cat.nameZh : cat.nameEn,
          })),
        },
      })
    } catch (error) {
      console.error('Get categories error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' } })
    }
  },

  getSeries: async (req: Request, res: Response) => {
    try {
      const seriesResult = await db.selectDistinct({ series: products.series }).from(products).where(eq(products.isActive, 1))

      res.json({
        success: true,
        data: {
          series: seriesResult.map((s: { series: string }) => s.series),
        },
      })
    } catch (error) {
      console.error('Get series error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch series' } })
    }
  },

  adminList: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, search, series, isActive = 'all' } = req.query as any
      const offset = (page - 1) * limit

      const conditions = []
      if (series) conditions.push(eq(products.series, series))
      if (isActive === 'true') conditions.push(eq(products.isActive, 1))
      if (isActive === 'false') conditions.push(eq(products.isActive, 0))
      if (search) conditions.push(like(products.nameEn, `%${search}%`))

      const productList = await db
        .select({
          id: products.id,
          nameEn: products.nameEn,
          nameZh: products.nameZh,
          slug: products.slug,
          series: products.series,
          basePrice: products.basePrice,
          isBestseller: products.isBestseller,
          isActive: products.isActive,
          sortOrder: products.sortOrder,
          categoryId: products.categoryId,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          descriptionEn: products.descriptionEn,
          descriptionZh: products.descriptionZh,
          storyEn: products.storyEn,
          storyZh: products.storyZh,
          material: products.material,
          careInstructions: products.careInstructions,
          metaTitleEn: products.metaTitleEn,
          metaTitleZh: products.metaTitleZh,
          metaDescriptionEn: products.metaDescriptionEn,
          metaDescriptionZh: products.metaDescriptionZh,
        })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
      const total = Number(countResult[0].count)

      const productsWithDetails = await Promise.all(
        productList.map(async (product) => {
          const images = await db
            .select({ url: productImages.url, altText: productImages.altText, isPrimary: productImages.isPrimary })
            .from(productImages)
            .where(eq(productImages.productId, product.id))
            .orderBy(productImages.sortOrder)

          const variants = await db
            .select({
              id: productVariants.id,
              colorName: productVariants.colorName,
              colorHex: productVariants.colorHex,
              size: productVariants.size,
              sku: productVariants.sku,
              priceAdjustment: productVariants.priceAdjustment,
              stockQuantity: productVariants.stockQuantity,
              lowStockThreshold: productVariants.lowStockThreshold,
              isActive: productVariants.isActive,
            })
            .from(productVariants)
            .where(eq(productVariants.productId, product.id))

          const category = product.categoryId
            ? await db
                .select({ id: categories.id, nameEn: categories.nameEn, nameZh: categories.nameZh })
                .from(categories)
                .where(eq(categories.id, product.categoryId))
                .limit(1)
            : []

          const salesResult = await db
            .select({ total: sum(orderItems.quantity).mapWith(Number) })
            .from(orderItems)
            .leftJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(
              eq(orderItems.productId, product.id),
              eq(orders.status, 'delivered')
            ))

          return {
            ...product,
            images,
            variants,
            category: category[0] || null,
            sales: salesResult[0]?.total || 0,
          }
        })
      )

      res.json({
        success: true,
        data: {
          products: productsWithDetails,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      })
    } catch (error) {
      console.error('Admin product list error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } })
    }
  },

  adminGetById: async (req: Request, res: Response) => {
    try {
      const productId = req.params.id as string

      const productResult = await db.select().from(products).where(eq(products.id, productId)).limit(1)

      if (productResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } })
        return
      }

      const product = productResult[0]

      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder)

      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))

      const detailImages = await db
        .select({
          image: productDetailImages.image,
          title: productDetailImages.title,
          description: productDetailImages.description,
        })
        .from(productDetailImages)
        .where(eq(productDetailImages.productId, product.id))
        .orderBy(productDetailImages.sortOrder)

      const category = product.categoryId
        ? await db
            .select({ id: categories.id, nameEn: categories.nameEn, nameZh: categories.nameZh })
            .from(categories)
            .where(eq(categories.id, product.categoryId))
            .limit(1)
        : []

      const salesResult = await db
        .select({ total: sum(orderItems.quantity).mapWith(Number) })
        .from(orderItems)
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(orderItems.productId, product.id),
          eq(orders.status, 'delivered')
        ))

      res.json({
        success: true,
        data: {
          ...product,
          images,
          variants,
          detailImages,
          category: category[0] || null,
          sales: salesResult[0]?.total || 0,
        },
      })
    } catch (error) {
      console.error('Admin get product error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' } })
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { images: imageData, variants: variantData, detailImages: detailImageData, ...productData } = req.body

      const existingSlug = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, productData.slug))
        .limit(1)

      if (existingSlug.length > 0) {
        res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'A product with this slug already exists' } })
        return
      }

      const productId = uuidv4()

      await db.insert(products).values({
        id: productId,
        ...productData,
        isBestseller: productData.isBestseller ? 1 : 0,
      })

      if (imageData && imageData.length > 0) {
        await db.insert(productImages).values(
          imageData.map((img: any, index: number) => ({
            id: uuidv4(),
            productId,
            url: img.url,
            altText: img.altText || null,
            sortOrder: img.sortOrder ?? index,
            isPrimary: img.isPrimary ? 1 : 0,
          }))
        )
      }

      if (detailImageData && detailImageData.length > 0) {
        await db.insert(productDetailImages).values(
          detailImageData.map((d: any, index: number) => ({
            id: uuidv4(),
            productId,
            image: d.image,
            title: d.title,
            description: d.description,
            sortOrder: index,
          }))
        )
      }

      if (variantData && variantData.length > 0) {
        await db.insert(productVariants).values(
          variantData.map((v: any) => ({
            id: uuidv4(),
            productId,
            colorName: v.colorName,
            colorHex: v.colorHex || null,
            size: v.size,
            sku: v.sku,
            priceAdjustment: String(v.priceAdjustment || 0),
            stockQuantity: v.stockQuantity || 0,
            lowStockThreshold: v.lowStockThreshold || 5,
            isActive: v.isActive !== false ? 1 : 0,
          }))
        )
      }

      const created = await db.select().from(products).where(eq(products.id, productId)).limit(1)
      const images = await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.sortOrder)
      const variants = await db.select().from(productVariants).where(eq(productVariants.productId, productId))
      const detailImages = await db.select({
        image: productDetailImages.image,
        title: productDetailImages.title,
        description: productDetailImages.description,
      }).from(productDetailImages).where(eq(productDetailImages.productId, productId)).orderBy(productDetailImages.sortOrder)

      res.status(201).json({
        success: true,
        data: { ...created[0], images, variants, detailImages },
      })
    } catch (error) {
      console.error('Create product error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' } })
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const productId = req.params.id as string

      const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1)
      if (existing.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } })
        return
      }

      const { images: imageData, variants: variantData, detailImages: detailImageData, ...productData } = req.body

      if (productData.slug) {
        const slugConflict = await db
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.slug, productData.slug), sql`${products.id} != ${productId}`))
          .limit(1)

        if (slugConflict.length > 0) {
          res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'A product with this slug already exists' } })
          return
        }
      }

      if (Object.keys(productData).length > 0) {
        const updateData: any = { ...productData }
        if (typeof updateData.isBestseller === 'boolean') {
          updateData.isBestseller = updateData.isBestseller ? 1 : 0
        }
        if (typeof updateData.isActive === 'boolean') {
          updateData.isActive = updateData.isActive ? 1 : 0
        }
        await db.update(products).set(updateData).where(eq(products.id, productId))
      }

      if (imageData !== undefined) {
        await db.delete(productImages).where(eq(productImages.productId, productId))
        if (imageData.length > 0) {
          await db.insert(productImages).values(
            imageData.map((img: any, index: number) => ({
              id: uuidv4(),
              productId,
              url: img.url,
              altText: img.altText || null,
              sortOrder: img.sortOrder ?? index,
              isPrimary: img.isPrimary ? 1 : 0,
            }))
          )
        }
      }

      if (detailImageData !== undefined) {
        await db.delete(productDetailImages).where(eq(productDetailImages.productId, productId))
        if (detailImageData.length > 0) {
          await db.insert(productDetailImages).values(
            detailImageData.map((d: any, index: number) => ({
              id: uuidv4(),
              productId,
              image: d.image,
              title: d.title,
              description: d.description,
              sortOrder: index,
            }))
          )
        }
      }

      if (variantData !== undefined) {
        await db.delete(productVariants).where(eq(productVariants.productId, productId))
        if (variantData.length > 0) {
          await db.insert(productVariants).values(
            variantData.map((v: any) => ({
              id: uuidv4(),
              productId,
              colorName: v.colorName,
              colorHex: v.colorHex || null,
              size: v.size,
              sku: v.sku,
              priceAdjustment: String(v.priceAdjustment || 0),
              stockQuantity: v.stockQuantity || 0,
              lowStockThreshold: v.lowStockThreshold || 5,
              isActive: v.isActive !== false ? 1 : 0,
            }))
          )
        }
      }

      const updated = await db.select().from(products).where(eq(products.id, productId)).limit(1)
      const images = await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.sortOrder)
      const variants = await db.select().from(productVariants).where(eq(productVariants.productId, productId))
      const detailImages = await db.select({
        image: productDetailImages.image,
        title: productDetailImages.title,
        description: productDetailImages.description,
      }).from(productDetailImages).where(eq(productDetailImages.productId, productId)).orderBy(productDetailImages.sortOrder)

      res.json({
        success: true,
        data: { ...updated[0], images, variants, detailImages },
      })
    } catch (error) {
      console.error('Update product error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update product' } })
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const productId = req.params.id as string

      const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1)
      if (existing.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } })
        return
      }

      await db.update(products).set({ isActive: 0 }).where(eq(products.id, productId))

      res.json({ success: true, data: { message: 'Product deactivated successfully' } })
    } catch (error) {
      console.error('Delete product error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete product' } })
    }
  },
}
