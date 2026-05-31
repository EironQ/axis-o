const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

import { mockAddresses, MockAddress } from '@/data/mockData'
import { handleAuthError, createAuthHeaders } from './authHelper'

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
    const res = await fetchWithAuth(`${API_BASE_URL}/addresses`)
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
    const res = await fetchWithAuth(`${API_BASE_URL}/addresses/${id}`)
    return res.json()
  },

  create: async (data: CreateAddressRequest): Promise<ApiResponse<Address>> => {
    if (USE_MOCK) {
      const address = createMockAddress(data)
      return { success: true, data: address }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
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
    const res = await fetchWithAuth(`${API_BASE_URL}/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clean),
    })
    return res.json()
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    if (USE_MOCK) {
      const index = mockAddresses.findIndex((a) => a.id === id)
      if (index === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } }
      mockAddresses.splice(index, 1)
      return { success: true, data: { message: 'Address deleted' } }
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/addresses/${id}`, {
      method: 'DELETE',
    })
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
    const res = await fetchWithAuth(`${API_BASE_URL}/addresses/${id}/default`, {
      method: 'PUT',
    })
    return res.json()
  },
}
