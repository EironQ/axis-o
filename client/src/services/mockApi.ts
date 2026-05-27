import { products } from '@/data/products'
import {
  mockOrders,
  mockAddresses,
  MockOrder,
  MockCartItem,
  MockAddress,
} from '@/data/mockData'

export interface CartResponse {
  items: MockCartItem[]
  totalItems: number
  subtotal: number
}

export interface AddCartItemRequest {
  variantId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface OrderListResponse {
  orders: MockOrder[]
  total: number
  page: number
  limit: number
}

export interface CreateOrderRequest {
  shippingAddressId: string
  billingAddressId: string
  shippingMethod?: string
  paymentProvider: 'stripe' | 'paypal' | 'alipay'
  discountCode?: string
  notes?: string
  currency?: string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let currentCartItems: MockCartItem[] = []

const findProductById = (productId: string) => products.find((p) => p.id === productId)

export const mockProductApi = {
  getById: async (productId: string) => {
    await delay(300)
    const product = products.find((p) => p.id === productId)
    if (!product) {
      return { success: false, data: null }
    }
    
    const variants = []
    for (const color of product.colors) {
      for (const size of product.sizes) {
        variants.push({
          id: `${productId}-${color.name}-${size}`,
          colorName: color.name,
          colorHex: color.hex,
          size,
          priceAdjustment: '0',
          stockQuantity: 99,
        })
      }
    }
    
    return {
      success: true,
      data: {
        ...product,
        variants,
        images: product.images.map((url, index) => ({
          url,
          altText: '',
          isPrimary: index === 0 ? 1 : 0,
          sortOrder: index,
        })),
        nameEn: product.name.split(' ')[0] || '',
        nameZh: product.name,
        descriptionEn: product.description,
        descriptionZh: product.description,
        storyEn: product.story,
        storyZh: product.story,
        basePrice: String(product.price),
        isBestseller: product.isBestSeller ? 1 : 0,
        isActive: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slug: product.id,
      },
    }
  },
}

export const mockCartApi = {
  getCart: async (): Promise<CartResponse> => {
    await delay(300)
    return {
      items: currentCartItems,
      totalItems: currentCartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: currentCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }
  },

  addItem: async (data: AddCartItemRequest): Promise<{ success: boolean; data: { id: string; quantity: number } }> => {
    await delay(300)
    const existingItem = currentCartItems.find((item) => item.variantId === data.variantId)

    if (existingItem) {
      existingItem.quantity += data.quantity
      return { success: true, data: { id: existingItem.id, quantity: existingItem.quantity } }
    }

    const parts = data.variantId.split('-')
    const size = parts[parts.length - 1]
    const colorName = parts[parts.length - 2]
    const productId = parts.slice(0, -2).join('-')
    const product = findProductById(productId)
    const color = product?.colors.find((c) => c.name === colorName)

    const newItem: MockCartItem = {
      id: `cart-${Date.now()}`,
      variantId: data.variantId,
      productId,
      productNameEn: product?.nameEn || product?.name.split(' ')[0] || '',
      productName: product?.name || '',
      colorName,
      colorHex: color?.hex || '#C89460',
      size,
      price: product?.price || 0,
      quantity: data.quantity,
      image: product?.images[color?.imageIndex || 0] || '',
    }

    currentCartItems.push(newItem)
    return { success: true, data: { id: newItem.id, quantity: newItem.quantity } }
  },

  updateItem: async (itemId: string, data: UpdateCartItemRequest): Promise<{ success: boolean }> => {
    await delay(300)
    if (data.quantity < 1) {
      const index = currentCartItems.findIndex((i) => i.id === itemId)
      if (index > -1) {
        currentCartItems.splice(index, 1)
        return { success: true }
      }
      return { success: false }
    }
    const item = currentCartItems.find((i) => i.id === itemId)
    if (item) {
      item.quantity = data.quantity
      return { success: true }
    }
    return { success: false }
  },

  removeItem: async (itemId: string): Promise<{ success: boolean }> => {
    await delay(300)
    const index = currentCartItems.findIndex((i) => i.id === itemId)
    if (index > -1) {
      currentCartItems.splice(index, 1)
      return { success: true }
    }
    return { success: false }
  },

  clearCart: async (): Promise<{ success: boolean }> => {
    await delay(300)
    currentCartItems = []
    return { success: true }
  },
}

export const mockOrderApi = {
  list: async (page = 1, limit = 10): Promise<OrderListResponse> => {
    await delay(400)
    const start = (page - 1) * limit
    const orders = mockOrders.slice(start, start + limit)
    return {
      orders,
      total: mockOrders.length,
      page,
      limit,
    }
  },

  getById: async (orderId: string): Promise<MockOrder | null> => {
    await delay(300)
    return mockOrders.find((order) => order.id === orderId) || null
  },

  create: async (data: CreateOrderRequest): Promise<MockOrder> => {
    await delay(500)
    const shippingAddress = mockAddresses.find((a) => a.id === data.shippingAddressId) || mockAddresses[0]
    const billingAddress = mockAddresses.find((a) => a.id === data.billingAddressId) || mockAddresses[0]

    const validItems = currentCartItems.filter((item) => item.quantity > 0)
    const subtotal = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shippingCost = data.shippingMethod === 'express' ? 50 : 0
    const taxAmount = subtotal * 0.08
    const discountAmount = 0

    const order: MockOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `AXIS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(mockOrders.length + 1).padStart(3, '0')}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shippingAddress,
      billingAddress,
      paymentMethod: data.paymentProvider,
      items: [...validItems],
      subtotal,
      shipping: shippingCost,
      taxAmount,
      discountAmount,
      total: subtotal + shippingCost + taxAmount - discountAmount,
      note: data.notes,
    }

    mockOrders.unshift(order)
    currentCartItems = []
    return order
  },

  cancel: async (orderId: string): Promise<MockOrder | null> => {
    await delay(400)
    const order = mockOrders.find((o) => o.id === orderId)
    if (order && order.status === 'pending') {
      order.status = 'cancelled'
      order.updatedAt = new Date().toISOString()
      return order
    }
    return null
  },
}

export const mockAddressApi = {
  list: async (): Promise<MockAddress[]> => {
    await delay(200)
    return mockAddresses
  },

  getDefault: async (): Promise<MockAddress | null> => {
    await delay(200)
    return mockAddresses.find((a) => a.isDefault) || mockAddresses[0] || null
  },

  create: async (data: { type: string; firstName: string; lastName: string; line1: string; city: string; postalCode: string; country: string; phone?: string; isDefault?: boolean }): Promise<MockAddress> => {
    await delay(300)
    const newAddress: MockAddress = {
      id: `addr-${Date.now()}`,
      name: `${data.firstName} ${data.lastName}`.trim(),
      phone: data.phone || '',
      province: '',
      city: data.city,
      district: '',
      street: data.line1,
      postalCode: data.postalCode,
      isDefault: data.isDefault || false,
    }
    if (newAddress.isDefault) {
      mockAddresses.forEach((a) => { a.isDefault = false })
    }
    mockAddresses.push(newAddress)
    return newAddress
  },

  update: async (id: string, data: { type?: string; firstName?: string; lastName?: string; line1?: string; city?: string; postalCode?: string; country?: string; phone?: string; isDefault?: boolean }): Promise<MockAddress | null> => {
    await delay(300)
    const index = mockAddresses.findIndex((a) => a.id === id)
    if (index === -1) return null
    if (data.isDefault) {
      mockAddresses.forEach((a) => { a.isDefault = false })
    }
    const existing = mockAddresses[index]
    mockAddresses[index] = {
      ...existing,
      name: data.firstName !== undefined ? `${data.firstName} ${data.lastName || ''}`.trim() : existing.name,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      city: data.city !== undefined ? data.city : existing.city,
      street: data.line1 !== undefined ? data.line1 : existing.street,
      postalCode: data.postalCode !== undefined ? data.postalCode : existing.postalCode,
      isDefault: data.isDefault !== undefined ? data.isDefault : existing.isDefault,
    }
    return mockAddresses[index]
  },

  delete: async (id: string): Promise<boolean> => {
    await delay(300)
    const index = mockAddresses.findIndex((a) => a.id === id)
    if (index === -1) return false
    mockAddresses.splice(index, 1)
    return true
  },

  setDefault: async (id: string): Promise<MockAddress | null> => {
    await delay(300)
    const addr = mockAddresses.find((a) => a.id === id)
    if (!addr) return null
    mockAddresses.forEach((a) => { a.isDefault = false })
    addr.isDefault = true
    return addr
  },
}