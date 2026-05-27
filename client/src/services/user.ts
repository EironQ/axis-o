const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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
    return true
  }
  return false
}

export const userService = {
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (handleAuthError(res)) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } }
    return res.json()
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (handleAuthError(res)) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } }
    return res.json()
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (handleAuthError(res)) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } }
    return res.json()
  },
}
