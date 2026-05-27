const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const wishlistService = {
  getAll: async (): Promise<ApiResponse<WishlistItem[]>> => {
    const res = await fetch(`${API_BASE_URL}/wishlist`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    return res.json()
  },

  add: async (productId: string): Promise<ApiResponse<WishlistItem>> => {
    const res = await fetch(`${API_BASE_URL}/wishlist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId }),
    })
    return res.json()
  },

  remove: async (productId: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return res.json()
  },

  clear: async (): Promise<ApiResponse<{ message: string }>> => {
    const res = await fetch(`${API_BASE_URL}/wishlist/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return res.json()
  },
}
