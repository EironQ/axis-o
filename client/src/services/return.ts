const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

import { getAuthToken, handleAuthError, createAuthHeaders } from './authHelper'

export interface ReturnItem {
  id: string
  returnId: string
  orderItemId: string
  productId: string
  variantId: string
  productName: string
  variantDescription?: string
  quantity: number
  newVariantId?: string
  newProductName?: string
  imageUrl?: string | null
}

export interface ReturnLog {
  id: string
  returnId: string
  action: 'created' | 'status_changed' | 'note_added' | 'image_added' | 'refund_initiated' | 'refund_completed'
  fromStatus?: string
  toStatus?: string
  operatorId?: string
  operatorType: 'user' | 'admin' | 'system'
  note?: string
  createdAt: string
}

export interface ReturnRequest {
  id: string
  orderId: string
  userId: string
  type: 'return' | 'exchange' | 'refund'
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled'
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'arrived_late' | 'other'
  reasonDetail?: string
  images?: string[]
  adminNote?: string
  processedBy?: string
  processedAt?: string
  refundAmount?: number
  refundReason?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  items?: ReturnItem[]
  logs?: ReturnLog[]
  orderNumber?: string
}

export interface CreateReturnInput {
  orderId: string
  type: 'return' | 'exchange' | 'refund'
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'arrived_late' | 'other'
  reasonDetail?: string
  images?: string[]
  items: Array<{
    orderItemId: string
    quantity: number
    newVariantId?: string
    newProductName?: string
  }>
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

export const returnService = {
  create: async (input: CreateReturnInput): Promise<ApiResponse<ReturnRequest>> => {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          id: 'mock-return-id',
          orderId: input.orderId,
          userId: 'mock-user-id',
          type: input.type,
          status: 'pending',
          reason: input.reason,
          reasonDetail: input.reasonDetail,
          images: input.images,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: input.items.map((item, index) => ({
            id: `mock-item-${index}`,
            returnId: 'mock-return-id',
            orderItemId: item.orderItemId,
            productId: `product-${index}`,
            variantId: `variant-${index}`,
            productName: 'Product Name',
            quantity: item.quantity,
            newVariantId: item.newVariantId,
            newProductName: item.newProductName,
          })),
        },
      }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/returns`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return res.json()
  },

  getAll: async (): Promise<ApiResponse<ReturnRequest[]>> => {
    if (USE_MOCK) {
      return {
        success: true,
        data: [],
      }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/returns`)
    return res.json()
  },

  getById: async (returnId: string): Promise<ApiResponse<ReturnRequest>> => {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          id: returnId,
          orderId: 'mock-order-id',
          userId: 'mock-user-id',
          type: 'return',
          status: 'pending',
          reason: 'changed_mind',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          orderNumber: 'ORD-2024-001',
        },
      }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/returns/${returnId}`)
    return res.json()
  },

  cancel: async (returnId: string): Promise<ApiResponse<ReturnRequest>> => {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          id: returnId,
          orderId: 'mock-order-id',
          userId: 'mock-user-id',
          type: 'return',
          status: 'cancelled',
          reason: 'changed_mind',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/returns/${returnId}/cancel`, {
      method: 'PATCH',
    })
    return res.json()
  },

  getByOrderId: async (orderId: string): Promise<ApiResponse<ReturnRequest>> => {
    if (USE_MOCK) {
      return {
        success: true,
        data: undefined,
      }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/returns/order/${orderId}`)
    return res.json()
  },
}
