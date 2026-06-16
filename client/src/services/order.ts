const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

import type { MockOrder } from '@/data/mockData'
import { mockOrders } from '@/data/mockData'
import { handleAuthError, createAuthHeaders } from './authHelper'

export interface OrderAddress {
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

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  currency: string
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  total: number
  shippingMethod?: string
  notes?: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
  hasReturnRequest?: boolean
  items?: OrderItem[]
  shippingAddress?: OrderAddress | null
  billingAddress?: OrderAddress | null
  payment?: {
    provider: string
    transactionId: string | null
    status: string
    amount: string
    currency: string
    feeAmount: string | null
    createdAt: string
  } | null
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId: string
  productName: string
  variantDescription?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  image?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: createAuthHeaders(),
  })

  if (res.status === 401) {
    const { refreshAccessToken } = await import('./authHelper')
    const newToken = await refreshAccessToken()
    if (newToken) {
      return fetch(url, {
        ...options,
        headers: createAuthHeaders(),
      })
    } else {
      handleAuthError()
      throw new Error('Unauthorized')
    }
  }

  return res
}

function mapMockOrder(mockOrder: MockOrder): Order {
  return {
    id: mockOrder.id,
    orderNumber: mockOrder.orderNumber,
    userId: '',
    status: mockOrder.status as Order['status'],
    currency: 'USD',
    subtotal: mockOrder.subtotal,
    shippingCost: mockOrder.shipping,
    taxAmount: mockOrder.taxAmount || 0,
    discountAmount: mockOrder.discountAmount || 0,
    total: mockOrder.total,
    shippingMethod: 'standard',
    notes: mockOrder.note,
    createdAt: mockOrder.createdAt,
    updatedAt: mockOrder.updatedAt,
    items: mockOrder.items.map((item) => ({
      id: item.id,
      orderId: mockOrder.id,
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
      firstName: mockOrder.shippingAddress.name,
      lastName: '',
      line1: mockOrder.shippingAddress.street,
      city: mockOrder.shippingAddress.city,
      state: mockOrder.shippingAddress.province,
      postalCode: mockOrder.shippingAddress.postalCode,
      country: 'CN',
      phone: mockOrder.shippingAddress.phone,
    },
    billingAddress: {
      firstName: mockOrder.billingAddress.name,
      lastName: '',
      line1: mockOrder.billingAddress.street,
      city: mockOrder.billingAddress.city,
      state: mockOrder.billingAddress.province,
      postalCode: mockOrder.billingAddress.postalCode,
      country: 'CN',
      phone: mockOrder.billingAddress.phone,
    },
  }
}

function filterMockOrders(): MockOrder[] {
  return mockOrders
}

export const orderService = {
  getAll: async (): Promise<ApiResponse<Order[]>> => {
    if (USE_MOCK) {
      const orders = filterMockOrders().map(mapMockOrder)
      return { success: true, data: orders }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/orders`)
    const json = await res.json()
    if (json.success && json.data) {
      const ordersData = json.data.orders || json.data
      const convertedOrders = ordersData.map((order: any) => ({
        ...order,
        subtotal: Number(order.subtotal || 0),
        shippingCost: Number(order.shippingCost || 0),
        taxAmount: Number(order.taxAmount || 0),
        discountAmount: Number(order.discountAmount || 0),
        total: Number(order.total || 0),
      }))
      return { success: true, data: convertedOrders }
    }
    return json
  },

  getById: async (orderId: string): Promise<ApiResponse<Order>> => {
    if (USE_MOCK) {
      const order = mockOrders.find((o) => o.id === orderId)
      if (!order) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } }
      }
      return { success: true, data: mapMockOrder(order) }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}`)
    const json = await res.json()
    if (json.success && json.data) {
      const orderData = json.data.order || json.data
      return {
        success: true,
        data: {
          ...orderData,
          subtotal: Number(orderData.subtotal || 0),
          shippingCost: Number(orderData.shippingCost || 0),
          taxAmount: Number(orderData.taxAmount || 0),
          discountAmount: Number(orderData.discountAmount || 0),
          total: Number(orderData.total || 0),
          items: (orderData.items || []).map((item: any) => ({
            id: item.id,
            orderId: orderData.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantDescription: item.variantDescription,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice || 0),
            totalPrice: Number(item.totalPrice || 0),
            image: item.image,
          })),
        },
      }
    }
    return json
  },

  getItems: async (orderId: string): Promise<ApiResponse<OrderItem[]>> => {
    if (USE_MOCK) {
      const order = mockOrders.find((o) => o.id === orderId)
      if (!order) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } }
      }
      const items: OrderItem[] = order.items.map((item) => ({
        id: item.id,
        orderId: order.id,
        productId: item.productId,
        variantId: `${item.productId}-${item.colorName}-${item.size}`,
        productName: item.productName,
        variantDescription: `${item.colorName} / ${item.size}`,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        image: item.image,
      }))
      return { success: true, data: items }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/items`)
    return res.json()
  },

  cancel: async (orderId: string): Promise<ApiResponse<{ message: string }>> => {
    if (USE_MOCK) {
      const order = mockOrders.find((o) => o.id === orderId)
      if (!order) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } }
      }
      if (order.status !== 'pending') {
        return { success: false, error: { code: 'INVALID_STATUS', message: 'Cannot cancel this order' } }
      }
      order.status = 'cancelled'
      order.updatedAt = new Date().toISOString()
      return { success: true, data: { message: 'Order cancelled' } }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
    })
    return res.json()
  },

  confirmDelivery: async (orderId: string): Promise<ApiResponse<{ orderId: string; status: string; deliveredAt: string }>> => {
    if (USE_MOCK) {
      const order = mockOrders.find((o) => o.id === orderId)
      if (!order) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } }
      }
      if (order.status !== 'shipped') {
        return { success: false, error: { code: 'INVALID_STATUS', message: 'Cannot confirm delivery for this order' } }
      }
      order.status = 'delivered'
      order.updatedAt = new Date().toISOString()
      return { success: true, data: { orderId, status: 'delivered', deliveredAt: new Date().toISOString() } }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/confirm-delivery`, {
      method: 'PUT',
    })
    return res.json()
  },
}
