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

export interface Category {
  id: string
  nameEn: string
  nameZh: string
  slug: string
  parentId?: string
  imageUrl?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const categoryService = {
  getAll: async (): Promise<{ success: boolean; data: Category[] }> => {
    const result = await adminRequest<{ success: boolean; data: { categories: Category[]; pagination: any } }>('/categories')
    return { success: result.success, data: result.data?.categories || [] }
  },
}
