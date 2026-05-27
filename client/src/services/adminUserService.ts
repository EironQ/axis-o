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

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'customer' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'banned'
  preferredLanguage: 'en' | 'zh'
  preferredCurrency: string
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminUserOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  currency: string
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
}

export interface AdminUserAddress {
  id: string
  type: 'shipping' | 'billing'
  firstName: string
  lastName: string
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string
  country: string
  phone: string | null
  isDefault: number
  createdAt: string
}

export interface AdminUserListResponse {
  success: boolean
  data: {
    users: AdminUser[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface AdminUserResponse {
  success: boolean
  data: AdminUser
}

export interface AdminUserOrdersResponse {
  success: boolean
  data: {
    orders: AdminUserOrder[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface AdminUserAddressesResponse {
  success: boolean
  data: {
    addresses: AdminUserAddress[]
  }
}

export const adminUserService = {
  getAll: async (params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  } = {}): Promise<AdminUserListResponse> => {
    const { page = 1, limit = 20, search, role, status } = params
    const searchParams = new URLSearchParams()
    searchParams.set('page', String(page))
    searchParams.set('limit', String(limit))
    if (search) searchParams.set('search', search)
    if (role) searchParams.set('role', role)
    if (status) searchParams.set('status', status)

    return adminRequest<AdminUserListResponse>(`/admin/users?${searchParams.toString()}`)
  },

  getById: async (id: string): Promise<AdminUserResponse> => {
    return adminRequest<AdminUserResponse>(`/admin/users/${id}`)
  },

  getOrders: async (id: string, params: { page?: number; limit?: number } = {}): Promise<AdminUserOrdersResponse> => {
    const { page = 1, limit = 10 } = params
    const searchParams = new URLSearchParams()
    searchParams.set('page', String(page))
    searchParams.set('limit', String(limit))

    return adminRequest<AdminUserOrdersResponse>(`/admin/users/${id}/orders?${searchParams.toString()}`)
  },

  getAddresses: async (id: string): Promise<AdminUserAddressesResponse> => {
    return adminRequest<AdminUserAddressesResponse>(`/admin/users/${id}/addresses`)
  },

  update: async (
    id: string,
    updates: Partial<{
      firstName: string
      lastName: string
      phone: string
      role: 'customer' | 'admin' | 'super_admin'
      status: 'active' | 'inactive' | 'banned'
      preferredLanguage: 'en' | 'zh'
      preferredCurrency: string
    }>
  ): Promise<{ success: boolean; data?: AdminUser; error?: { message: string } }> => {
    const result = await adminRequest<{ success: boolean; data: AdminUser; error?: { message: string } }>(
      `/admin/users/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    )
    return result
  },

  disable: async (id: string, status: 'active' | 'inactive' | 'banned'): Promise<{ success: boolean; data?: { id: string; status: string }; error?: { message: string } }> => {
    return adminRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}