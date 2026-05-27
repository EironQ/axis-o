const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

import { mockAddresses, MockAddress } from '@/data/mockData'

export interface Address {
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

export interface CreateAddressRequest {
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
  isDefault?: boolean
}

export interface UpdateAddressRequest {
  type?: 'shipping' | 'billing'
  firstName?: string
  lastName?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phone?: string
  isDefault?: boolean
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

function handleAuthError(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }
}

function mockAddrToAddress(addr: MockAddress): Address {
  return {
    id: addr.id,
    userId: 'user-001',
    type: 'shipping',
    firstName: addr.name.split(' ')[0] || addr.name,
    lastName: addr.name.split(' ').slice(1).join(' ') || '',
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

let nextAddrId = 100

function createMockAddress(data: CreateAddressRequest): Address {
  if (data.isDefault) {
    mockAddresses.forEach((a) => { a.isDefault = false })
  }
  const newMock: MockAddress = {
    id: `addr-${Date.now()}-${nextAddrId++}`,
    name: `${data.firstName} ${data.lastName}`.trim(),
    phone: data.phone || '',
    province: data.state || '',
    city: data.city,
    district: '',
    street: data.line1,
    postalCode: data.postalCode,
    isDefault: data.isDefault || false,
  }
  mockAddresses.push(newMock)
  return mockAddrToAddress(newMock)
}

export const addressService = {
  getAll: async (): Promise<ApiResponse<Address[]>> => {
    if (USE_MOCK) {
      const addresses = mockAddresses.map(mockAddrToAddress)
      return { success: true, data: addresses }
    }
    const res = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    handleAuthError(res)
    const json = await res.json()
    if (json.success && json.data) {
      return { success: true, data: json.data.addresses || json.data }
    }
    return json
  },

  getById: async (id: string): Promise<ApiResponse<Address>> => {
    if (USE_MOCK) {
      const addr = mockAddresses.find((a) => a.id === id)
      if (!addr) return { success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } }
      return { success: true, data: mockAddrToAddress(addr) }
    }
    const res = await fetch(`${API_BASE_URL}/addresses/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    handleAuthError(res)
    return res.json()
  },

  create: async (data: CreateAddressRequest): Promise<ApiResponse<Address>> => {
    if (USE_MOCK) {
      const address = createMockAddress(data)
      return { success: true, data: address }
    }
    const res = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    handleAuthError(res)
    return res.json()
  },

  update: async (id: string, data: UpdateAddressRequest): Promise<ApiResponse<Address>> => {
    if (USE_MOCK) {
      const index = mockAddresses.findIndex((a) => a.id === id)
      if (index === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } }
      if (data.isDefault) {
        mockAddresses.forEach((a) => { a.isDefault = false })
      }
      const existing = mockAddresses[index]
      if (data.firstName !== undefined) {
        const newName = `${data.firstName} ${data.lastName || ''}`.trim()
        mockAddresses[index] = {
          ...existing,
          name: newName,
          phone: data.phone ?? existing.phone,
          city: data.city ?? existing.city,
          street: data.line1 ?? existing.street,
          postalCode: data.postalCode ?? existing.postalCode,
          province: data.state ?? existing.province,
          isDefault: data.isDefault ?? existing.isDefault,
        }
      } else {
        mockAddresses[index] = {
          ...existing,
          phone: data.phone ?? existing.phone,
          city: data.city ?? existing.city,
          street: data.line1 ?? existing.street,
          postalCode: data.postalCode ?? existing.postalCode,
          province: data.state ?? existing.province,
          isDefault: data.isDefault ?? existing.isDefault,
        }
      }
      return { success: true, data: mockAddrToAddress(mockAddresses[index]) }
    }
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v != null && v !== '')
    )
    const res = await fetch(`${API_BASE_URL}/addresses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(clean),
    })
    handleAuthError(res)
    return res.json()
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    if (USE_MOCK) {
      const index = mockAddresses.findIndex((a) => a.id === id)
      if (index === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } }
      mockAddresses.splice(index, 1)
      return { success: true, data: { message: 'Address deleted' } }
    }
    const res = await fetch(`${API_BASE_URL}/addresses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    handleAuthError(res)
    return res.json()
  },

  setDefault: async (id: string): Promise<ApiResponse<Address>> => {
    if (USE_MOCK) {
      const addr = mockAddresses.find((a) => a.id === id)
      if (!addr) return { success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } }
      mockAddresses.forEach((a) => { a.isDefault = false })
      addr.isDefault = true
      return { success: true, data: mockAddrToAddress(addr) }
    }
    const res = await fetch(`${API_BASE_URL}/addresses/${id}/default`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    })
    handleAuthError(res)
    return res.json()
  },
}
