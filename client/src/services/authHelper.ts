const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

export const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

export const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

export const getAuthToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token') || null

export const getRefreshToken = () => localStorage.getItem('refreshToken')

export async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push(resolve as (token: string) => void)
    })
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return null
  }

  isRefreshing = true

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const data = await res.json()

    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken)
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken)
      }
      onTokenRefreshed(data.data.accessToken)
      isRefreshing = false
      return data.data.accessToken
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
  }

  isRefreshing = false
  return null
}

export function handleAuthError(redirectToLogin = true) {
  const authKeys = ['accessToken', 'refreshToken', 'token']
  authKeys.forEach((key) => localStorage.removeItem(key))
  if (redirectToLogin) {
    const lang = localStorage.getItem('preferred_language') || 'zh'
    window.location.href = `/${lang}/login`
  }
}

export function createAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
