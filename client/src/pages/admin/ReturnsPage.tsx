import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'
import { uploadService } from '@/services/uploadService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ReturnItem {
  id: string
  returnId: string
  orderItemId: string
  productId: string
  variantId: string
  productName: string
  variantDescription?: string
  quantity: number
  newVariantId?: string
  newProductName?: string
  imageUrl?: string | null
}

export interface ReturnLog {
  id: string
  returnId: string
  action: 'created' | 'status_changed' | 'note_added' | 'image_added' | 'refund_initiated' | 'refund_completed'
  fromStatus?: string
  toStatus?: string
  operatorId?: string
  operatorType: 'user' | 'admin' | 'system'
  note?: string
  createdAt: string
}

export interface ReturnRequest {
  id: string
  orderId: string
  userId: string
  type: 'return' | 'exchange' | 'refund'
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled'
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'arrived_late' | 'other'
  reasonDetail?: string
  images?: string[]
  adminNote?: string
  processedBy?: string
  processedAt?: string
  refundAmount?: number
  refundReason?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  items?: ReturnItem[]
  logs?: ReturnLog[]
  orderNumber?: string
  userName?: string
  orderTotal?: number
  orderCurrency?: string
  paymentProvider?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已批准', className: 'bg-blue-100 text-blue-700' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
  processing: { label: '处理中', className: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
}

const typeConfig: Record<string, { label: string; className: string }> = {
  return: { label: '退货', className: 'bg-orange-100 text-orange-700' },
  exchange: { label: '换货', className: 'bg-teal-100 text-teal-700' },
  refund: { label: '退款', className: 'bg-pink-100 text-pink-700' },
}

const reasonConfig: Record<string, string> = {
  defective: '商品质量问题',
  wrong_item: '发错商品',
  not_as_described: '与描述不符',
  changed_mind: '个人原因',
  arrived_late: '送达超时',
  other: '其他原因',
}

const paymentProviderLabels: Record<string, string> = {
  paypal: 'PayPal',
  lianlianpay: 'LianLian Pay',
}

function getAuthHeaders() {
  const token = localStorage.getItem('adminToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function AdminReturnsPage() {
  const navigate = useNavigate()
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | 'refund'>('approve')
  const [refundAmount, setRefundAmount] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
      return
    }
  }, [navigate])

  const loadReturns = useCallback(async (page: number, status: string, search: string) => {
    setIsLoading(true)
    try {
      const url = new URL(`${API_BASE_URL}/admin/returns`, window.location.origin)
      url.searchParams.set('page', String(page))
      url.searchParams.set('limit', '20')
      if (status && status !== 'all') url.searchParams.set('status', status)
      if (search) url.searchParams.set('search', search)

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }
      const json = await res.json()
      if (json.success) {
        setReturns(json.data || [])
        setTotalPages(json.pagination?.totalPages || 1)
        setTotalCount(json.pagination?.total || 0)
      } else {
        showToast('error', json.error?.message || '加载失败')
      }
    } catch {
      showToast('error', '网络错误')
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadReturns(1, statusFilter, searchTerm)
  }, [statusFilter, loadReturns])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1)
      loadReturns(1, statusFilter, searchTerm)
    }, 400)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchTerm])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadReturns(page, statusFilter, searchTerm)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const openDetail = async (returnItem: ReturnRequest) => {
    setShowDetail(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/returns/${returnItem.id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }
      const json = await res.json()
      if (json.success && json.data) {
        setSelectedReturn(json.data)
      } else {
        setSelectedReturn(returnItem)
        showToast('error', json.error?.message || '加载详情失败')
      }
    } catch {
      setSelectedReturn(returnItem)
      showToast('error', '网络错误，请稍后重试')
    }
    setDetailLoading(false)
  }

  const closeDetail = () => {
    setShowDetail(false)
    setSelectedReturn(null)
  }

  const handleAction = async () => {
    if (!selectedReturn) return

    setIsProcessing(true)
    let status: ReturnRequest['status']
    let message = ''

    switch (actionType) {
      case 'approve':
        status = 'approved'
        message = '已批准退换货申请'
        break
      case 'reject':
        status = 'rejected'
        message = '已拒绝退换货申请'
        break
      case 'complete':
        status = 'completed'
        message = '退换货处理已完成'
        break
      case 'refund': {
        const amount = parseFloat(refundAmount)
        if (!amount || amount <= 0) {
          showToast('error', '请输入有效退款金额')
          setIsProcessing(false)
          return
        }
        try {
          const body: Record<string, unknown> = { refundAmount: amount }
          if (adminNote) body.adminNote = adminNote
          const res = await fetch(`${API_BASE_URL}/admin/returns/${selectedReturn.id}/refund`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
          })
          if (res.status === 401) {
            localStorage.removeItem('adminToken')
            navigate('/admin/login')
            return
          }
          const json = await res.json()
          if (json.success) {
            setReturns((prev) =>
              prev.map((r) => (r.id === selectedReturn.id ? { ...r, status: 'completed', refundAmount: amount } : r))
            )
            setSelectedReturn((prev) => (prev ? { ...prev, status: 'completed', refundAmount: amount } : null))
            setShowActionModal(false)
            setAdminNote('')
            setRefundAmount('')
            setRefundReason('')
            showToast('success', '退款处理完成')
          } else {
            showToast('error', json.error?.message || '退款失败')
          }
        } catch {
          showToast('error', '网络错误')
        } finally {
          setIsProcessing(false)
        }
        return
      }
      default:
        setIsProcessing(false)
        return
    }

    try {
      const body: Record<string, unknown> = { status }
      if (adminNote) body.adminNote = adminNote
      if (actionType === 'reject' && refundReason) body.refundReason = refundReason

      const res = await fetch(`${API_BASE_URL}/admin/returns/${selectedReturn.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }
      const json = await res.json()
      if (json.success) {
        setReturns((prev) =>
          prev.map((r) => (r.id === selectedReturn.id ? { ...r, status } : r))
        )
        setSelectedReturn((prev) => (prev ? { ...prev, status, adminNote } : null))
        setShowActionModal(false)
        setAdminNote('')
        setRefundReason('')
        showToast('success', message)
      } else {
        showToast('error', json.error?.message || '操作失败')
      }
    } catch {
      showToast('error', '网络错误')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
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
            placeholder="搜索订单号或申请编号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已批准</option>
            <option value="rejected">已拒绝</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <span className="text-sm text-gray-500">共 {totalCount} 条退换货申请</span>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">已退款金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">暂无退换货申请</td>
                  </tr>
                ) : (
                  returns.map((returnItem) => (
                    <tr key={returnItem.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {returnItem.orderNumber || returnItem.orderId}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {returnItem.userName || returnItem.userId}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeConfig[returnItem.type]?.className}`}>
                          {typeConfig[returnItem.type]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {reasonConfig[returnItem.reason] || returnItem.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[returnItem.status]?.className}`}>
                          {statusConfig[returnItem.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {returnItem.refundAmount !== undefined && returnItem.refundAmount !== null && returnItem.refundAmount > 0 ? (
                          <span className="text-sm font-medium text-red-600">${Number(returnItem.refundAmount).toLocaleString()}</span>
                        ) : (
                          <span className="text-sm text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(returnItem.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetail(returnItem)}
                          className="px-3 py-1 text-sm text-[#C89460] hover:bg-[#FFF5E6] rounded transition-colors"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">第 {currentPage} / {totalPages} 页</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-800">退换货详情</h3>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C89460] border-t-transparent"></div>
              </div>
            ) : selectedReturn ? (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeConfig[selectedReturn.type]?.className}`}>
                    {typeConfig[selectedReturn.type]?.label}申请
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig[selectedReturn.status]?.className}`}>
                    {statusConfig[selectedReturn.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">订单号</p>
                    <p className="text-sm font-medium text-gray-900">{selectedReturn.orderNumber || selectedReturn.orderId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">用户</p>
                    <p className="text-sm font-medium text-gray-900">{selectedReturn.userName || selectedReturn.userId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">申请时间</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedReturn.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">原因</p>
                    <p className="text-sm text-gray-900">{reasonConfig[selectedReturn.reason] || selectedReturn.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">更新时间</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedReturn.updatedAt)}</p>
                  </div>
                  {selectedReturn.orderTotal !== undefined && selectedReturn.orderTotal !== null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">订单金额</p>
                      <p className="text-sm font-medium text-gray-900">
                        ${Number(selectedReturn.orderTotal).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedReturn.paymentProvider && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">支付方式</p>
                      <p className="text-sm font-medium text-gray-900">
                        {paymentProviderLabels[selectedReturn.paymentProvider] || selectedReturn.paymentProvider}
                      </p>
                    </div>
                  )}
                  {selectedReturn.refundAmount !== undefined && selectedReturn.refundAmount !== null && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">退款金额</p>
                      <p className="text-sm font-medium text-red-600">${Number(selectedReturn.refundAmount).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedReturn.reasonDetail && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">详细说明</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">{selectedReturn.reasonDetail}</p>
                  </div>
                )}

                {selectedReturn.items && selectedReturn.items.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">申请商品 ({selectedReturn.items.length} 件)</h4>
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">商品</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">规格</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">数量</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedReturn.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                    {item.imageUrl ? (
                                      <img src={uploadService.getImageUrl(item.imageUrl)} alt={item.productName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无图</div>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.variantDescription || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">×{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">申请商品</h4>
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-6 text-center">暂无商品信息</p>
                  </div>
                )}

                {selectedReturn.images && selectedReturn.images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">凭证图片</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedReturn.images.map((image, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img src={image} alt={`凭证 ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReturn.adminNote && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">管理员备注</h4>
                    <p className="text-sm text-gray-600 bg-yellow-50 rounded-lg p-4">{selectedReturn.adminNote}</p>
                  </div>
                )}

                {selectedReturn.logs && selectedReturn.logs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">处理日志</h4>
                    <div className="space-y-2">
                      {selectedReturn.logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-[6px] flex-shrink-0" />
                          <div>
                            <p className="text-gray-700">
                              {log.action === 'created' && '创建申请'}
                              {log.action === 'status_changed' && `状态变更: ${log.fromStatus} → ${log.toStatus}`}
                              {log.action === 'note_added' && '添加备注'}
                              {log.action === 'image_added' && '上传图片'}
                              {log.action === 'refund_initiated' && '发起退款'}
                              {log.action === 'refund_completed' && '退款完成'}
                              {log.note && ` - ${log.note}`}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  {selectedReturn.status === 'pending' && (
                    <>
                      <button
                        onClick={() => { setActionType('approve'); setShowActionModal(true) }}
                        className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      >
                        批准
                      </button>
                      <button
                        onClick={() => { setActionType('reject'); setShowActionModal(true) }}
                        className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        拒绝
                      </button>
                    </>
                  )}
                  {selectedReturn.status === 'approved' && (
                    <>
                      <button
                        onClick={() => { setActionType('refund'); setShowActionModal(true) }}
                        className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        退款
                      </button>
                      <button
                        onClick={() => { setActionType('complete'); setShowActionModal(true) }}
                        className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        完成处理
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {actionType === 'approve' && '批准申请'}
                {actionType === 'reject' && '拒绝申请'}
                {actionType === 'complete' && '完成处理'}
                {actionType === 'refund' && '确认退款'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">管理员备注</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                  placeholder="选填"
                />
              </div>
              {actionType === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">拒绝原因 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                    placeholder="请填写拒绝原因"
                  />
                </div>
              )}
              {actionType === 'refund' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">退款金额 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                    placeholder="请输入退款金额"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAction}
                  disabled={isProcessing || (actionType === 'reject' && !refundReason) || (actionType === 'refund' && (!refundAmount || parseFloat(refundAmount) <= 0))}
                  className={`flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 ${
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    actionType === 'refund' ? 'bg-red-600 hover:bg-red-700' :
                    actionType === 'complete' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isProcessing ? '处理中...' : (
                    actionType === 'approve' ? '确认批准' :
                    actionType === 'reject' ? '确认拒绝' :
                    actionType === 'refund' ? '确认退款' : '确认完成'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
