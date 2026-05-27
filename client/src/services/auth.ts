const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  accessToken: string
  refreshToken: string
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminAuthResponse {
  adminId: string
  email: string
  role: string
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    return res.json()
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    return res.json()
  },

  adminLogin: async (credentials: AdminLoginRequest): Promise<ApiResponse<AdminAuthResponse>> => {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    return res.json()
  },
}
