const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalProducts: number
  revenueData: RevenueData[]
  orderStatusDistribution: OrderStatusDistribution[]
  recentOrders: RecentOrder[]
}

export interface RecentOrder {
  id: string
  customer: string
  total: string
  status: string
  date: string
}

export interface RevenueData {
  month: string
  revenue: number
}

export interface OrderStatusDistribution {
  status: string
  percentage: number
  count: number
  color: string
}

const mockStats: DashboardStats = {
  totalOrders: 0,
  totalRevenue: 0,
  totalUsers: 0,
  totalProducts: 0,
  revenueData: [],
  orderStatusDistribution: [],
  recentOrders: [],
}

export const dashboardService = {
  getStats: async (): Promise<{ success: boolean; data?: DashboardStats; error?: { message: string } }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const result = await response.json()
      return result
    } catch {
      return {
        success: true,
        data: mockStats,
      }
    }
  },
}
