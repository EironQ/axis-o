const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface Banner {
  id: string
  image: string
  title: string
  subtitle: string
  link: string
  linkText: string
  tags: string[] | null
  sortOrder: number
  isActive: number
  createdAt: string
  updatedAt: string
}

const getToken = () => localStorage.getItem('adminToken')

export const bannerService = {
  list: async (): Promise<{ success: boolean; data?: Banner[]; error?: { message: string } }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      return await response.json()
    } catch (err: any) {
      return { success: false, error: { message: err.message } }
    }
  },

  getById: async (id: string): Promise<{ success: boolean; data?: Banner; error?: { message: string } }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      return await response.json()
    } catch (err: any) {
      return { success: false, error: { message: err.message } }
    }
  },

  create: async (data: Partial<Banner>): Promise<{ success: boolean; data?: Banner; error?: { message: string } }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      })
      return await response.json()
    } catch (err: any) {
      return { success: false, error: { message: err.message } }
    }
  },

  update: async (id: string, data: Partial<Banner>): Promise<{ success: boolean; data?: Banner; error?: { message: string } }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      })
      return await response.json()
    } catch (err: any) {
      return { success: false, error: { message: err.message } }
    }
  },

  delete: async (id: string): Promise<{ success: boolean; error?: { message: string } }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      return await response.json()
    } catch (err: any) {
      return { success: false, error: { message: err.message } }
    }
  },
}
