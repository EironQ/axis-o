import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { dashboardService, DashboardStats, RevenueData, OrderStatusDistribution, RecentOrder } from '@/services/dashboard'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [orderStatusDistribution, setOrderStatusDistribution] = useState<OrderStatusDistribution[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const result = await dashboardService.getStats()
      if (result.success && result.data) {
        setStats(result.data)
        setRevenueData(result.data.revenueData || [])
        setOrderStatusDistribution(result.data.orderStatusDistribution || [])
        setRecentOrders(result.data.recentOrders || [])
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatRevenue = (value: number) => {
    if (value >= 10000) {
      return `$${(value / 10000).toFixed(1)}万`
    }
    return `$${value.toLocaleString('en-US')}`
  }

  const getMaxRevenue = () => {
    if (revenueData.length === 0) return 1
    const max = Math.max(...revenueData.map((d) => d.revenue))
    return max || 1
  }

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case '待处理': return 'bg-yellow-100 text-yellow-700'
      case '已付款':
      case '处理中': return 'bg-blue-100 text-blue-700'
      case '已发货': return 'bg-indigo-100 text-indigo-700'
      case '已完成': return 'bg-green-100 text-green-700'
      case '已取消': return 'bg-gray-100 text-gray-700'
      case '已退款': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C89460] border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">总订单数</p>
            <p className="text-3xl font-bold text-gray-800">
              {stats ? stats.totalOrders.toLocaleString('zh-CN') : '-'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">总收入</p>
            <p className="text-3xl font-bold text-gray-800">
              {stats ? formatRevenue(stats.totalRevenue) : '-'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">用户总数</p>
            <p className="text-3xl font-bold text-gray-800">
              {stats ? stats.totalUsers.toLocaleString('zh-CN') : '-'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">商品总数</p>
            <p className="text-3xl font-bold text-gray-800">
              {stats ? stats.totalProducts.toLocaleString('zh-CN') : '-'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">收入趋势（{new Date().getFullYear()}年）</h2>
            {revenueData.length > 0 ? (
              <div className="flex items-end justify-between h-48 gap-2">
                {revenueData.map((item) => {
                  const maxRevenue = getMaxRevenue()
                  const height = item.revenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 4) : 0
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        {formatRevenue(item.revenue)}
                      </div>
                      <div
                        className="w-full bg-[#C89460] rounded-t-lg transition-all duration-300 hover:bg-[#B07A4A]"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                暂无收入数据
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">订单状态分布</h2>
            {orderStatusDistribution.length > 0 ? (
              <div className="space-y-4">
                {orderStatusDistribution.map((item) => (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.status}</span>
                      <span className="font-medium text-gray-800">
                        {item.percentage}%（{item.count}）
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                暂无订单数据
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">最近订单</h2>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">订单编号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">客户</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">金额</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.customer}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.total}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                暂无订单
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
