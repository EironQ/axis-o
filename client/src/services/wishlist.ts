const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

import { createAuthHeaders } from './authHelper'

export interface WishlistItem {
  id: string
  userId: string
  productId: string
  product?: Product
  createdAt: string
}

export interface Product {
  id: string
  nameEn: string
  nameZh: string
  slug: string
  descriptionEn?: string
  descriptionZh?: string
  basePrice: number
  isBestseller: boolean
  isActive: boolean
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
    const { refreshAccessToken, handleAuthError } = await import('./authHelper')
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

export const wishlistService = {
  getAll: async (): Promise<ApiResponse<WishlistItem[]>> => {
    const res = await fetchWithAuth(`${API_BASE_URL}/wishlist`)
    return res.json()
  },

  add: async (productId: string): Promise<ApiResponse<WishlistItem>> => {
    const res = await fetchWithAuth(`${API_BASE_URL}/wishlist`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
    })
    return res.json()
  },

  remove: async (productId: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await fetchWithAuth(`${API_BASE_URL}/wishlist/${productId}`, {
      method: 'DELETE',
    })
    return res.json()
  },

  clear: async (): Promise<ApiResponse<{ message: string }>> => {
    const res = await fetchWithAuth(`${API_BASE_URL}/wishlist/clear`, {
      method: 'DELETE',
    })
    return res.json()
  },
}
