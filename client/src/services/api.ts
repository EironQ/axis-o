const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

import { products } from '@/data/products'

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

const getAuthToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token') || null

const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken && !isRefreshing) {
        isRefreshing = true
        try {
          const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })
          const data = await res.json()
          if (data.success && data.data?.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken)
            onTokenRefreshed(data.data.accessToken)
            isRefreshing = false
            const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
              ...options,
              headers: { ...headers, Authorization: `Bearer ${data.data.accessToken}` },
            })
            if (retryResponse.ok) {
              return retryResponse.json()
            }
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
        }
        isRefreshing = false
      }
      const authKeys = ['accessToken', 'refreshToken', 'token']
      authKeys.forEach((key) => localStorage.removeItem(key))
      const lang = localStorage.getItem('preferred_language') || 'zh'
      window.location.href = `/${lang}/login`
      throw new Error('Session expired')
    }
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }))
    let msg = error?.error?.message || error?.message || 'Request failed'
    if (error?.error?.details && Array.isArray(error.error.details)) {
      msg += ': ' + error.error.details.map((d: any) => d.message).join(', ')
    }
    throw new Error(msg)
  }

  return response.json()
}

export interface CartItemResponse {
  id: string
  variantId: string
  quantity: number
  productId: string
  colorName: string
  colorHex: string
  size: string
  priceAdjustment: number
  stockQuantity: number
  productNameEn: string
  productNameZh: string
  productName: string
  slug: string
  basePrice: number
  material: string
  image: string | null
  price: number
  totalPrice: number
}

export interface CartResponse {
  success: boolean
  data: {
    items: CartItemResponse[]
    totalItems: number
    totalPrice: number
  }
}

export interface AddCartItemRequest {
  variantId: string
  quantity?: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface ProductVariant {
  id: string
  colorName: string
  colorHex: string
  size: string
  priceAdjustment: string
  stockQuantity: number
}

export interface ProductImage {
  url: string
  altText?: string
  isPrimary: number
}

export interface DetailImage {
  image: string
  title: string
  description: string
}

export interface Product {
  id: string
  nameEn: string
  nameZh: string
  slug: string
  descriptionEn?: string
  descriptionZh?: string
  series: string
  material: string
  basePrice: string
  isBestseller: number
  images: ProductImage[]
  variants: ProductVariant[]
  name: string
  description: string
  story?: string
  category?: string
  detailImages?: DetailImage[]
}

export interface ProductListResponse {
  success: boolean
  data: {
    products: Product[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface ProductDetailResponse {
  success: boolean
  data: Product
}

export interface Address {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

export interface OrderItem {
  id: string
  productId: string
  variantId: string
  productName: string
  variantDescription: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderResponse {
  id: string
  orderNumber: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  currency: string
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  total: number
  shippingMethod: string
  notes?: string
  createdAt: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  shippingAddress?: Address
  billingAddress?: Address
  items?: OrderItem[]
}

export interface CreateOrderRequest {
  shippingAddressId: string
  billingAddressId: string
  shippingMethod: string
  paymentProvider: 'paypal' | 'lianlianpay'
  discountCode?: string
  notes?: string
  currency?: string
}

export interface CreateOrderResponse {
  success: boolean
  data: {
    orderId: string
    orderNumber: string
    status: string
    total: number
    currency: string
    items: number
  }
}

export interface OrderListResponse {
  success: boolean
  data: {
    orders: OrderResponse[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface GetOrderResponse {
  success: boolean
  data: OrderResponse
}

export interface UserAddress {
  id: string
  userId: string
  type: 'shipping' | 'billing'
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AddressResponse {
  success: boolean
  data: UserAddress[]
}

let mockModules: any = null

const getMockApis = async () => {
  if (!mockModules) {
    mockModules = await import('@/services/mockApi')
  }
  return mockModules
}

export const productApi = {
  list: async (params: { page?: number; limit?: number; sort?: string; series?: string; category?: string; lang?: string } = {}) => {
    if (USE_MOCK) {
      const { page = 1, limit = 100, lang = 'zh' } = params
      const mockProducts = products.map((product) => {
        const variants = []
        for (const color of product.colors) {
          for (const size of product.sizes) {
            variants.push({
              id: `${product.id}-${color.name}-${size}`,
              colorName: color.name,
              colorHex: color.hex,
              size,
              priceAdjustment: '0',
              stockQuantity: 99,
            })
          }
        }
        return {
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
          name: lang === 'zh' ? product.name : product.name.split(' ')[0] || '',
          description: product.description,
          basePrice: String(product.price),
          isBestseller: product.isBestSeller ? 1 : 0,
          isActive: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slug: product.id,
        }
      })
      const start = (page - 1) * limit
      const end = start + limit
      return {
        success: true,
        data: {
          products: mockProducts.slice(start, end),
          pagination: {
            page,
            limit,
            total: mockProducts.length,
            totalPages: Math.ceil(mockProducts.length / limit),
          },
        },
      }
    }
    const { page = 1, limit = 100, sort, series, category, lang = 'zh' } = params
    const searchParams = new URLSearchParams()
    searchParams.set('page', String(page))
    searchParams.set('limit', String(limit))
    searchParams.set('lang', lang)
    if (sort) searchParams.set('sort', sort)
    if (series) searchParams.set('series', series)
    if (category) searchParams.set('category', category)
    return request<ProductListResponse>(`/products?${searchParams.toString()}`)
  },
  getById: async (productId: string, lang: string = 'zh') => {
    if (USE_MOCK) {
      const { mockProductApi } = await getMockApis()
      const result = await mockProductApi.getById(productId)
      if (result.success) {
        return {
          ...result,
          data: {
            ...result.data,
            name: lang === 'zh' ? result.data.nameZh : result.data.nameEn,
            description: lang === 'zh' ? result.data.descriptionZh : result.data.descriptionEn,
            story: lang === 'zh' ? result.data.storyZh : result.data.storyEn,
          },
        }
      }
      return result
    }
    return request<ProductDetailResponse>(`/products/${productId}?lang=${lang}`)
  },
}

export interface Category {
  id: string
  nameEn: string
  nameZh: string
  parentId?: string
  sortOrder: number
  isActive: boolean
}

interface CategoryListResponse {
  success: boolean
  data: {
    categories: Category[]
  }
}

export const categoryApi = {
  list: async (): Promise<{ success: boolean; data: Category[] }> => {
    if (USE_MOCK) {
      return { success: true, data: [] }
    }
    const result = await request<CategoryListResponse>('/categories?activeOnly=true')
    return { success: result.success, data: result.data?.categories || [] }
  },
}

export const cartApi = {
  getCart: async () => {
    if (USE_MOCK) {
      const { mockCartApi } = await getMockApis()
      const result = await mockCartApi.getCart()
      return {
        success: true,
        data: {
          items: result.items.map((item: any) => ({
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            productId: item.productId,
            colorName: item.colorName,
            colorHex: item.colorHex,
            size: item.size,
            priceAdjustment: 0,
            stockQuantity: 99,
            productNameEn: item.productNameEn,
            productNameZh: item.productName,
            productName: item.productName,
            slug: '',
            basePrice: item.price,
            material: '',
            image: item.image,
            price: item.price,
            totalPrice: item.price * item.quantity,
          })),
          totalItems: result.totalItems,
          totalPrice: result.totalPrice,
        }
      }
    }
    return request<CartResponse>('/cart')
  },
  addItem: async (data: AddCartItemRequest) => {
    if (USE_MOCK) {
      const { mockCartApi } = await getMockApis()
      return mockCartApi.addItem(data)
    }
    return request('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateItem: async (itemId: string, data: UpdateCartItemRequest) => {
    if (USE_MOCK) {
      const { mockCartApi } = await getMockApis()
      return mockCartApi.updateItem(itemId, data)
    }
    return request(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  removeItem: async (itemId: string) => {
    if (USE_MOCK) {
      const { mockCartApi } = await getMockApis()
      return mockCartApi.removeItem(itemId)
    }
    return request(`/cart/items/${itemId}`, {
      method: 'DELETE',
    })
  },
  clearCart: async () => {
    if (USE_MOCK) {
      const { mockCartApi } = await getMockApis()
      return mockCartApi.clearCart()
    }
    return request('/cart', {
      method: 'DELETE',
    })
  },
}

export const orderApi = {
  list: async (page = 1, limit = 10) => {
    if (USE_MOCK) {
      const { mockOrderApi } = await getMockApis()
      const result = await mockOrderApi.list(page, limit)
      return {
        success: true,
        data: {
          orders: result.orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            currency: 'USD',
            subtotal: order.subtotal,
            shippingCost: order.shipping,
            taxAmount: 0,
            discountAmount: 0,
            total: order.total,
            shippingMethod: 'standard',
            createdAt: order.createdAt,
            shippingAddress: {
              firstName: order.shippingAddress.name,
              lastName: '',
              line1: order.shippingAddress.street,
              city: order.shippingAddress.city,
              state: order.shippingAddress.province,
              postalCode: order.shippingAddress.postalCode,
              country: 'CN',
              phone: order.shippingAddress.phone,
            },
          })),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        }
      }
    }
    return request<OrderListResponse>(`/orders?page=${page}&limit=${limit}`)
  },
  getById: async (orderId: string) => {
    if (USE_MOCK) {
      const { mockOrderApi } = await getMockApis()
      const order = await mockOrderApi.getById(orderId)
      if (!order) return { success: false, data: null as any }
      return {
        success: true,
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          currency: 'USD',
          subtotal: order.subtotal,
          shippingCost: order.shipping,
          taxAmount: 0,
          discountAmount: 0,
          total: order.total,
          shippingMethod: 'standard',
          notes: order.note,
          createdAt: order.createdAt,
          items: order.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: `${item.productId}-${item.colorName}-${item.size}`,
            productName: item.productName,
            variantDescription: `${item.colorName} / ${item.size}`,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            image: item.image,
          })),
          shippingAddress: {
            firstName: order.shippingAddress.name,
            lastName: '',
            line1: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.province,
            postalCode: order.shippingAddress.postalCode,
            country: 'CN',
            phone: order.shippingAddress.phone,
          },
          billingAddress: {
            firstName: order.billingAddress.name,
            lastName: '',
            line1: order.billingAddress.street,
            city: order.billingAddress.city,
            state: order.billingAddress.province,
            postalCode: order.billingAddress.postalCode,
            country: 'CN',
            phone: order.billingAddress.phone,
          },
        }
      }
    }
    return request<GetOrderResponse>(`/orders/${orderId}`)
  },
  create: async (data: CreateOrderRequest) => {
    if (USE_MOCK) {
      const { mockOrderApi } = await getMockApis()
      const order = await mockOrderApi.create(data)
      return {
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          currency: 'USD',
          items: order.items.length,
        }
      }
    }
    return request<CreateOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  cancel: async (orderId: string) => {
    if (USE_MOCK) {
      const { mockOrderApi } = await getMockApis()
      return mockOrderApi.cancel(orderId)
    }
    return request(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    })
  },
}

export const addressApi = {
  list: async () => {
    if (USE_MOCK) {
      const { mockAddressApi } = await getMockApis()
      const addresses = await mockAddressApi.list()
      return {
        success: true,
        data: addresses.map((addr: any) => ({
          id: addr.id,
          userId: 'user-001',
          type: 'shipping' as const,
          firstName: addr.name,
          lastName: '',
          line1: addr.street,
          city: addr.city,
          state: addr.province,
          postalCode: addr.postalCode,
          country: 'CN',
          phone: addr.phone,
          isDefault: addr.isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      }
    }
    return request<AddressResponse>('/addresses')
  },
  getById: async (addressId: string) => {
    if (USE_MOCK) {
      const { mockAddressApi } = await getMockApis()
      const addresses = await mockAddressApi.list()
      const addr = addresses.find((a: any) => a.id === addressId)
      if (!addr) return { success: false, data: null as any }
      return {
        success: true,
        data: {
          id: addr.id,
          userId: 'user-001',
          type: 'shipping' as const,
          firstName: addr.name,
          lastName: '',
          line1: addr.street,
          city: addr.city,
          state: addr.province,
          postalCode: addr.postalCode,
          country: 'CN',
          phone: addr.phone,
          isDefault: addr.isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    }
    return request(`/addresses/${addressId}`)
  },
}

export interface PaymentIntentResponse {
  success: boolean
  data: {
    paymentId: string
    orderId: string
    orderNumber: string
    amount: number
    currency: string
    publishableKey: string
    clientSecret: string
    paypalOrderId?: string
    lianlianpayRedirectUrl?: string
    alreadyPaid?: boolean
  }
}

export interface PayPalCaptureResponse {
  success: boolean
  data: {
    orderId: string
    status: string
    captureId: string
    message: string
  }
}

export interface RefundResponse {
  success: boolean
  data: {
    orderId: string
    status: string
    refundId: string
  }
}

export const paymentApi = {
  createIntent: async (orderId: string, provider: 'paypal' | 'lianlianpay' = 'paypal') => {
    return request<PaymentIntentResponse>(`/payments/intent/${orderId}?provider=${provider}`)
  },

  capturePayPal: async (orderId: string, paypalOrderId: string) => {
    return request<PayPalCaptureResponse>('/payments/paypal/capture', {
      method: 'POST',
      body: JSON.stringify({ orderId, paypalOrderId }),
    })
  },

  createRefund: async (orderId: string) => {
    return request<RefundResponse>(`/payments/refund/${orderId}`, {
      method: 'POST',
    })
  },

  syncStatus: async (orderId: string) => {
    return request<{ success: boolean; data: { orderId: string; status: string; message: string } }>('/payments/sync-status', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    })
  },
}
