import type { Product } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const getToken = () => localStorage.getItem('adminToken')

const adminRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }
  return response.json()
}

export interface AdminProduct extends Product {
  stock: number
  sales: number
  createdAt: string
  updatedAt: string
  categoryId: string
  careInstructions: string
}

function apiProductToAdminProduct(apiProduct: any): AdminProduct {
  const totalStock = apiProduct.variants?.reduce(
    (sum: number, v: any) => sum + (v.stockQuantity || 0),
    0
  ) ?? 0

  return {
    id: apiProduct.id,
    name: apiProduct.nameZh || apiProduct.nameEn,
    nameEn: apiProduct.nameEn,
    nameZh: apiProduct.nameZh,
    series: apiProduct.series,
    description: apiProduct.descriptionZh || apiProduct.descriptionEn || '',
    descriptionEn: apiProduct.descriptionEn || '',
    descriptionZh: apiProduct.descriptionZh || '',
    price: Number(apiProduct.basePrice),
    colors: (apiProduct.variants || []).filter((v: any, i: number, arr: any[]) =>
      arr.findIndex((x: any) => x.colorName === v.colorName) === i
    ).map((v: any) => ({
      name: v.colorName,
      hex: v.colorHex || '#000000',
      imageIndex: 0,
    })),
    sizes: [...new Set((apiProduct.variants || []).map((v: any) => v.size))] as string[],
    material: apiProduct.material || '',
    images: (apiProduct.images || []).map((img: any) => img.url),
    story: apiProduct.storyEn || '',
    storyEn: apiProduct.storyEn || '',
    storyZh: apiProduct.storyZh || '',
    isBestSeller: Boolean(apiProduct.isBestseller),
    category: apiProduct.category?.nameEn || '',
    categoryId: apiProduct.category?.id || '',
    slug: apiProduct.slug,
    isActive: Boolean(apiProduct.isActive),
    sortOrder: apiProduct.sortOrder || 0,
    metaTitleEn: apiProduct.metaTitleEn || null,
    metaTitleZh: apiProduct.metaTitleZh || null,
    metaDescriptionEn: apiProduct.metaDescriptionEn || null,
    metaDescriptionZh: apiProduct.metaDescriptionZh || null,
    careInstructions: apiProduct.careInstructions || '',
    detailImages: apiProduct.detailImages || [],
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
    stock: totalStock,
    sales: apiProduct.sales || 0,
  }
}

export const adminProductService = {
  getAll: async (): Promise<{ success: boolean; data: { products: AdminProduct[]; pagination: any } }> => {
    const result = await adminRequest<{ success: boolean; data: { products: any[]; pagination: any } }>(
      '/admin/products?limit=100'
    )

    return {
      success: result.success,
      data: {
        products: (result.data.products || []).map(apiProductToAdminProduct),
        pagination: result.data.pagination,
      },
    }
  },

  getById: async (id: string): Promise<{ success: boolean; data: AdminProduct | null }> => {
    const result = await adminRequest<{ success: boolean; data: any }>(`/admin/products/${id}`)
    return {
      success: result.success,
      data: result.data ? apiProductToAdminProduct(result.data) : null,
    }
  },

  create: async (product: any): Promise<{ success: boolean; data?: AdminProduct; error?: { message: string } }> => {
    const body: any = {
      nameEn: product.name || product.nameEn || '',
      nameZh: product.nameZh || product.name || '',
      slug: product.slug || (product.name || product.nameEn || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      descriptionEn: product.description || product.descriptionEn || '',
      descriptionZh: product.descriptionZh || product.description || '',
      storyEn: product.story || product.storyEn || '',
      storyZh: product.storyZh || product.story || '',
      categoryId: product.categoryId || product.category || '',
      series: product.series || 'classic',
      material: product.material || '',
      careInstructions: product.careInstructions || '',
      basePrice: product.price ?? product.basePrice ?? 0,
      isBestseller: product.isBestSeller ?? product.isBestseller ?? false,
      sortOrder: product.sortOrder ?? 0,
      metaTitleEn: product.metaTitleEn || '',
      metaTitleZh: product.metaTitleZh || '',
      metaDescriptionEn: product.metaDescriptionEn || '',
      metaDescriptionZh: product.metaDescriptionZh || '',
    }

    if (product.images && product.images.length > 0) {
      body.images = product.images.map((url: string, index: number) => ({
        url,
        altText: '',
        sortOrder: index,
        isPrimary: index === 0,
      }))
    }

    if (product.detailImages && product.detailImages.length > 0) {
      body.detailImages = product.detailImages
    }

    if ((product.colors || product.sizes) && product.colors?.length > 0 && product.sizes?.length > 0) {
      body.variants = []
      for (const color of product.colors) {
        for (const size of product.sizes) {
          body.variants.push({
            colorName: color.name || color,
            colorHex: color.hex || '#000000',
            size: size,
            sku: `${body.slug}-${(color.name || color).toLowerCase().replace(/\s+/g, '-')}-${size.toLowerCase()}`,
            priceAdjustment: 0,
            stockQuantity: product.stock || 0,
          })
        }
      }
    }

    const result = await adminRequest<{ success: boolean; data: any; error?: { message: string } }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (!result.success) {
      return { success: false, error: result.error || { message: '创建商品失败' } }
    }

    return { success: true, data: apiProductToAdminProduct(result.data) }
  },

  update: async (id: string, updates: any): Promise<{ success: boolean; data?: AdminProduct; error?: { message: string } }> => {
    const body: any = {}

    if (updates.name !== undefined) {
      body.nameEn = updates.name
      body.nameZh = updates.name
    }
    if (updates.nameEn !== undefined) body.nameEn = updates.nameEn
    if (updates.nameZh !== undefined) body.nameZh = updates.nameZh
    if (updates.description !== undefined) body.descriptionEn = updates.description
    if (updates.descriptionEn !== undefined) body.descriptionEn = updates.descriptionEn
    if (updates.descriptionZh !== undefined) body.descriptionZh = updates.descriptionZh
    if (updates.story !== undefined) body.storyEn = updates.story
    if (updates.storyEn !== undefined) body.storyEn = updates.storyEn
    if (updates.storyZh !== undefined) body.storyZh = updates.storyZh
    if (updates.categoryId !== undefined) body.categoryId = updates.categoryId
    if (updates.series !== undefined) body.series = updates.series
    if (updates.material !== undefined) body.material = updates.material
    if (updates.careInstructions !== undefined) body.careInstructions = updates.careInstructions
    if (updates.price !== undefined) body.basePrice = updates.price
    if (updates.basePrice !== undefined) body.basePrice = updates.basePrice
    if (updates.isBestSeller !== undefined) body.isBestseller = updates.isBestSeller
    if (updates.isBestseller !== undefined) body.isBestseller = updates.isBestseller
    if (updates.sortOrder !== undefined) body.sortOrder = updates.sortOrder
    if (updates.isActive !== undefined) body.isActive = updates.isActive
    if (updates.slug !== undefined) body.slug = updates.slug
    if (updates.metaTitleEn !== undefined) body.metaTitleEn = updates.metaTitleEn
    if (updates.metaTitleZh !== undefined) body.metaTitleZh = updates.metaTitleZh
    if (updates.metaDescriptionEn !== undefined) body.metaDescriptionEn = updates.metaDescriptionEn
    if (updates.metaDescriptionZh !== undefined) body.metaDescriptionZh = updates.metaDescriptionZh

    if (updates.images !== undefined) {
      body.images = updates.images.map((url: string, index: number) => ({
        url,
        altText: '',
        sortOrder: index,
        isPrimary: index === 0,
      }))
    }

    if (updates.detailImages !== undefined) {
      body.detailImages = updates.detailImages
    }

    if (updates.colors !== undefined || updates.sizes !== undefined) {
      body.variants = []
      const colors = updates.colors || []
      const sizes = updates.sizes || []
      if (colors.length > 0 && sizes.length > 0) {
        for (const color of colors) {
          for (const size of sizes) {
            body.variants.push({
              colorName: color.name || color,
              colorHex: color.hex || '#000000',
              size: size,
              sku: `${body.slug || updates.slug || ''}-${(color.name || color).toLowerCase().replace(/\s+/g, '-')}-${size.toLowerCase()}`,
              priceAdjustment: 0,
              stockQuantity: updates.stock || 0,
            })
          }
        }
      }
    }

    const result = await adminRequest<{ success: boolean; data: any; error?: { message: string } }>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })

    if (!result.success) {
      return { success: false, error: result.error || { message: '更新商品失败' } }
    }

    return { success: true, data: result.data ? apiProductToAdminProduct(result.data) : undefined }
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return adminRequest<{ success: boolean }>(`/admin/products/${id}`, { method: 'DELETE' })
  },
}
