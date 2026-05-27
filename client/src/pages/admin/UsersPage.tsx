import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { adminUserService, AdminUser, AdminUserOrder, AdminUserAddress } from '@/services/adminUserService'

type TabType = 'info' | 'orders' | 'addresses'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [userOrders, setUserOrders] = useState<AdminUserOrder[]>([])
  const [userAddresses, setUserAddresses] = useState<AdminUserAddress[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadUsers = useCallback(async (page: number, search: string, role: string, status: string) => {
    setIsLoading(true)
    try {
      const result = await adminUserService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        role: role !== 'all' ? role : undefined,
        status: status !== 'all' ? status : undefined,
      })
      if (result.success) {
        setUsers(result.data.users)
        setTotalPages(result.data.pagination.totalPages)
        setTotalCount(result.data.pagination.total)
      }
    } catch (err: any) {
      showToast('error', err.message || '加载用户失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers(1, searchTerm, roleFilter, statusFilter)
  }, [roleFilter, statusFilter, loadUsers])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1)
      loadUsers(1, searchTerm, roleFilter, statusFilter)
    }, 400)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchTerm])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadUsers(page, searchTerm, roleFilter, statusFilter)
  }

  const handleViewDetail = async (user: AdminUser) => {
    setSelectedUser(user)
    setActiveTab('info')
    setShowDetailModal(true)
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleUpdateUser = async (id: string, updates: Partial<AdminUser>) => {
    const result = await adminUserService.update(id, updates)
    if (result.success && result.data) {
      setUsers((prev) => prev.map((u) => (u.id === id ? result.data! : u)))
      setShowEditModal(false)
      setSelectedUser(null)
      showToast('success', '用户信息已更新')
    } else {
      showToast('error', result.error?.message || '更新失败')
    }
  }

  const handleDisableUser = async (id: string, newStatus: 'active' | 'inactive' | 'banned') => {
    const result = await adminUserService.disable(id, newStatus)
    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)))
      showToast('success', `用户状态已更新为「${getStatusLabel(newStatus)}」`)
    } else {
      showToast('error', result.error?.message || '操作失败')
    }
  }

  const loadUserOrders = async (userId: string, page: number = 1) => {
    setOrdersLoading(true)
    try {
      const result = await adminUserService.getOrders(userId, { page, limit: 5 })
      if (result.success) {
        setUserOrders(result.data.orders)
        setOrdersTotalPages(Number(result.data.pagination.totalPages))
        setOrdersCurrentPage(page)
      }
    } catch (err: any) {
      showToast('error', err.message || '加载订单失败')
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadUserAddresses = async (userId: string) => {
    setAddressesLoading(true)
    try {
      const result = await adminUserService.getAddresses(userId)
      if (result.success) {
        setUserAddresses(result.data.addresses)
      }
    } catch (err: any) {
      showToast('error', err.message || '加载地址失败')
    } finally {
      setAddressesLoading(false)
    }
  }

  useEffect(() => {
    if (showDetailModal && selectedUser && activeTab === 'orders') {
      loadUserOrders(selectedUser.id)
    } else if (showDetailModal && selectedUser && activeTab === 'addresses') {
      loadUserAddresses(selectedUser.id)
    }
  }, [showDetailModal, selectedUser, activeTab])

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '正常',
      inactive: '未激活',
      banned: '已封禁',
      pending: '待处理',
      paid: '已付款',
      processing: '处理中',
      shipped: '已发货',
      delivered: '已完成',
      cancelled: '已取消',
      refunded: '已退款',
    }
    return labels[status] || status
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      customer: '客户',
      admin: '管理员',
      super_admin: '超级管理员',
    }
    return labels[role] || role
  }

  const getAddressTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      shipping: '收货地址',
      billing: '账单地址',
    }
    return labels[type] || type
  }

  const getCountryLabel = (code: string) => {
    const countries: Record<string, string> = {
      CN: '中国',
      US: '美国',
      JP: '日本',
      KR: '韩国',
      GB: '英国',
      DE: '德国',
      FR: '法国',
    }
    return countries[code] || code
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const formatPrice = (price: number, currency: string) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  return (
    <AdminLayout>
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="搜索邮箱或姓名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
          >
            <option value="all">全部角色</option>
            <option value="customer">客户</option>
            <option value="admin">管理员</option>
            <option value="super_admin">超级管理员</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
          >
            <option value="all">全部状态</option>
            <option value="active">正常</option>
            <option value="inactive">未激活</option>
            <option value="banned">已封禁</option>
          </select>
        </div>
        <span className="text-sm text-gray-500">共 {totalCount} 位用户</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C89460] border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">语言</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">最后登录</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">暂无用户数据</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.phone && <p className="text-sm text-gray-400">{user.phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-700' :
                          user.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {user.preferredLanguage === 'zh' ? '中文' : 'English'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(user)}
                            className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            详情
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1 text-xs text-[#C89460] hover:bg-[#C89460]/10 rounded transition-colors"
                          >
                            编辑
                          </button>
                          {user.role !== 'super_admin' && (
                            <select
                              value={user.status}
                              onChange={(e) => handleDisableUser(user.id, e.target.value as any)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#C89460]"
                            >
                              <option value="active">正常</option>
                              <option value="inactive">未激活</option>
                              <option value="banned">封禁</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">用户详情</h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <button onClick={() => { setShowDetailModal(false); setSelectedUser(null) }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'info' ? 'text-[#C89460] border-b-2 border-[#C89460] bg-[#C89460]/5' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                基本信息
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'orders' ? 'text-[#C89460] border-b-2 border-[#C89460] bg-[#C89460]/5' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                订单记录
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'addresses' ? 'text-[#C89460] border-b-2 border-[#C89460] bg-[#C89460]/5' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                收货地址
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">姓名</label>
                      <p className="text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">邮箱</label>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">手机号</label>
                      <p className="text-gray-900">{selectedUser.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">角色</label>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        selectedUser.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                        selectedUser.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">状态</label>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        selectedUser.status === 'active' ? 'bg-green-100 text-green-700' :
                        selectedUser.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getStatusLabel(selectedUser.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">语言偏好</label>
                      <p className="text-gray-900">{selectedUser.preferredLanguage === 'zh' ? '中文' : 'English'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">货币偏好</label>
                      <p className="text-gray-900">{selectedUser.preferredCurrency}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">注册时间</label>
                      <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">最后登录</label>
                      <p className="text-gray-900">{formatDate(selectedUser.lastLoginAt)}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  {ordersLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-[#C89460] border-t-transparent"></div>
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">该用户暂无订单</div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {userOrders.map((order) => (
                          <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">订单号: {order.orderNumber}</p>
                                <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">{formatPrice(order.total, order.currency)}</p>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'paid' ? 'bg-purple-100 text-purple-700' :
                                  order.status === 'cancelled' || order.status === 'refunded' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-center items-center gap-2">
                          <button
                            onClick={() => {
                              const newPage = ordersCurrentPage - 1
                              if (newPage >= 1) {
                                loadUserOrders(selectedUser.id, newPage)
                              }
                            }}
                            disabled={ordersCurrentPage <= 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            上一页
                          </button>
                          <span className="px-3 py-1 text-sm text-gray-600">
                            第 {ordersCurrentPage} / {ordersTotalPages} 页
                          </span>
                          <button
                            onClick={() => {
                              const newPage = ordersCurrentPage + 1
                              if (newPage <= ordersTotalPages) {
                                loadUserOrders(selectedUser.id, newPage)
                              }
                            }}
                            disabled={ordersCurrentPage >= ordersTotalPages}
                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            下一页
                          </button>
                        </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  {addressesLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-[#C89460] border-t-transparent"></div>
                    </div>
                  ) : userAddresses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">该用户暂无收货地址</div>
                  ) : (
                    <div className="space-y-4">
                      {userAddresses.map((address) => (
                        <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              address.type === 'shipping' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {getAddressTypeLabel(address.type)}
                            </span>
                            {address.isDefault === 1 && (
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                默认地址
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">{address.firstName} {address.lastName}</p>
                          <p className="text-gray-500 text-sm">{address.phone}</p>
                          <p className="text-gray-700 text-sm mt-1">
                            {address.line1}
                            {address.line2 && `, ${address.line2}`}
                          </p>
                          <p className="text-gray-700 text-sm">
                            {address.city}
                            {address.state && `, ${address.state}`}
                            {address.postalCode && ` ${address.postalCode}`}
                            {address.country && `, ${getCountryLabel(address.country)}`}
                          </p>
                          <p className="text-gray-400 text-xs mt-2">创建于 {formatDate(address.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null) }}
          onSave={(updates) => handleUpdateUser(selectedUser.id, updates)}
        />
      )}
    </AdminLayout>
  )
}

interface UserEditModalProps {
  user: AdminUser
  onClose: () => void
  onSave: (updates: Partial<AdminUser>) => void
}

function UserEditModal({ user, onClose, onSave }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    role: user.role,
    status: user.status,
    preferredLanguage: user.preferredLanguage,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">编辑用户</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名字</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓氏</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
            />
          </div>

          {user.role !== 'super_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
              >
                <option value="customer">客户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          )}

          {user.role !== 'super_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
              >
                <option value="active">正常</option>
                <option value="inactive">未激活</option>
                <option value="banned">封禁</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">语言</label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-[#C89460] text-white rounded-lg hover:bg-[#b07d4f] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}