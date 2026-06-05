const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || ''

const getToken = () => localStorage.getItem('adminToken')

export const uploadService = {
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))

    const token = getToken()
    const response = await fetch(`${API_BASE}/upload/products`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.error?.message || error.message || 'Upload failed')
    }

    const result = await response.json()
    return result.data.urls
  },

  uploadBanner: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const token = getToken()
    const response = await fetch(`${API_BASE}/upload/banner`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.error?.message || error.message || 'Upload failed')
    }

    const result = await response.json()
    return result.data.url
  },

  getImageUrl: (path: string): string => {
    if (path.startsWith('http')) return path
    if (path.startsWith('/uploads/')) {
      return `${IMAGE_BASE_URL}${path}`
    }
    if (path.startsWith('/')) return path
    return `/${path}`
  },
}
