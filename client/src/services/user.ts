const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

import { handleAuthError, createAuthHeaders } from './authHelper'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  avatarUrl?: string | null
  role: string
  preferredLanguage: string
  preferredCurrency: string
  createdAt: string
  updatedAt?: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  preferredLanguage?: string
  preferredCurrency?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
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

export const userService = {
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    const res = await fetchWithAuth(`${API_BASE_URL}/auth/profile`)
    return res.json()
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> => {
    const res = await fetchWithAuth(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.json()
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    const res = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.json()
  },
}
