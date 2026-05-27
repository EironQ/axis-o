import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { adminOrderService, AdminOrder, AdminOrderItem } from '@/services/adminOrderService'
import { uploadService } from '@/services/uploadService'

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadOrders = useCallback(async (page: number, status: string, search: string) => {
    setIsLoading(true)
    try {
      const result = await adminOrderService.getAll({ page, limit: 20, status, search })
      if (result.success) {
        setOrders(result.data.orders)
        setTotalPages(result.data.totalPages)
        setTotalCount(result.data.total)
      }
    } catch (err: any) {
      showToast('error', err.message || '加载订单失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders(1, statusFilter, searchTerm)
  }, [statusFilter, loadOrders])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1)
      loadOrders(1, statusFilter, searchTerm)
    }, 400)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchTerm])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadOrders(page, statusFilter, searchTerm)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleStatusUpdate = async (id: string, newStatus: AdminOrder['status']) => {
    const result = await adminOrderService.updateStatus(id, newStatus)
    if (result.success && result.data) {
      setOrders((prev) => prev.map((o) => (o.id === id ? result.data! : o)))
      if (selectedOrder?.id === id) setSelectedOrder(result.data)
      showToast('success', `订单状态已更新为「${adminOrderService.getStatusLabel(newStatus)}」`)
    } else {
      showToast('error', result.error?.message || '状态更新失败')
    }
  }

  const openDetail = async (order: AdminOrder) => {
    setShowDetail(true)
    setDetailLoading(true)
    const result = await adminOrderService.getById(order.id)
    if (result.success && result.data) {
      setSelectedOrder(result.data)
    } else {
      setSelectedOrder(order)
    }
    setDetailLoading(false)
  }

  const closeDetail = () => {
    setShowDetail(false)
    setSelectedOrder(null)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`
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
            placeholder="搜索订单号或客户名..."
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
            <option value="pending">待处理</option>
            <option value="paid">已付款</option>
            <option value="processing">处理中</option>
            <option value="shipped">已发货</option>
            <option value="delivered">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="refunded">已退款</option>
          </select>
        </div>
        <span className="text-sm text-gray-500">共 {totalCount} 条订单</span>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">支付方式</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">下单时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">暂无订单数据</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {adminOrderService.getPaymentLabel(order.paymentMethod) || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${adminOrderService.getStatusColor(order.status)}`}>
                          {adminOrderService.getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetail(order)}
                            className="px-3 py-1 text-sm text-[#C89460] hover:bg-[#FFF5E6] rounded transition-colors"
                          >
                            详情
                          </button>
                          {order.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusUpdate(order.id, 'paid')} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">收款</button>
                              <button onClick={() => handleStatusUpdate(order.id, 'processing')} className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors">处理</button>
                            </>
                          )}
                          {order.status === 'paid' && (
                            <button onClick={() => handleStatusUpdate(order.id, 'processing')} className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors">处理</button>
                          )}
                          {order.status === 'processing' && (
                            <button onClick={() => handleStatusUpdate(order.id, 'shipped')} className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition-colors">发货</button>
                          )}
                          {order.status === 'shipped' && (
                            <button onClick={() => handleStatusUpdate(order.id, 'delivered')} className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors">完成</button>
                          )}
                          {(order.status === 'pending' || order.status === 'paid' || order.status === 'processing') && (
                            <button onClick={() => handleStatusUpdate(order.id, 'cancelled')} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors">取消</button>
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
              <h3 className="text-lg font-semibold text-gray-800">订单详情</h3>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C89460] border-t-transparent"></div>
              </div>
            ) : selectedOrder ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">订单号</p>
                    <p className="text-sm font-medium text-gray-900">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">状态</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${adminOrderService.getStatusColor(selectedOrder.status)}`}>
                        {adminOrderService.getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">客户</p>
                    <p className="text-sm font-medium text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">支付方式</p>
                    <p className="text-sm text-gray-900">{adminOrderService.getPaymentLabel(selectedOrder.paymentMethod) || '-'}</p>
                  </div>
                  {selectedOrder.paymentTransactionId && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">支付流水号</p>
                      <p className="text-sm font-mono text-gray-900 break-all">{selectedOrder.paymentTransactionId}</p>
                    </div>
                  )}
                  {selectedOrder.paymentStatus && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">支付状态</p>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.paymentStatus === 'succeeded' ? '支付成功' :
                         selectedOrder.paymentStatus === 'pending' ? '待支付' :
                         selectedOrder.paymentStatus === 'processing' ? '处理中' :
                         selectedOrder.paymentStatus === 'failed' ? '支付失败' :
                         selectedOrder.paymentStatus === 'refunded' ? '已退款' :
                         selectedOrder.paymentStatus === 'partially_refunded' ? '部分退款' : selectedOrder.paymentStatus}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">下单时间</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">更新时间</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                  {selectedOrder.paidAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">付款时间</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedOrder.paidAt)}</p>
                    </div>
                  )}
                  {selectedOrder.shippedAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">发货时间</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedOrder.shippedAt)}</p>
                    </div>
                  )}
                  {selectedOrder.deliveredAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">送达时间</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedOrder.deliveredAt)}</p>
                    </div>
                  )}
                  {selectedOrder.trackingNumber && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">物流单号</p>
                      <p className="text-sm font-medium text-[#C89460]">{selectedOrder.trackingNumber}</p>
                    </div>
                  )}
                  {selectedOrder.note && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">备注</p>
                      <p className="text-sm text-gray-900">{selectedOrder.note}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">商品明细 ({selectedOrder.items.length} 件)</h4>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">商品</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">规格</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">单价</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">数量</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">小计</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                  {item.image ? (
                                    <img src={uploadService.getImageUrl(item.image)} alt={item.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无图</div>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.colorName}{item.size ? ` / ${item.size}` : ''}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(item.price)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">×{item.quantity}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">配送地址</h4>
                    {selectedOrder.shippingAddress ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-900">{selectedOrder.shippingAddress.name}</p>
                          <p className="text-xs text-gray-500">{selectedOrder.shippingAddress.phone}</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {[selectedOrder.shippingAddress.province, selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.district].filter(Boolean).join(' ')}
                        </p>
                        <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.street}</p>
                        <p className="text-xs text-gray-500">{selectedOrder.shippingAddress.postalCode}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">暂无地址信息</p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">账单地址</h4>
                    {selectedOrder.billingAddress ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-900">{selectedOrder.billingAddress.name}</p>
                          <p className="text-xs text-gray-500">{selectedOrder.billingAddress.phone}</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {[selectedOrder.billingAddress.province, selectedOrder.billingAddress.city, selectedOrder.billingAddress.district].filter(Boolean).join(' ')}
                        </p>
                        <p className="text-sm text-gray-600">{selectedOrder.billingAddress.street}</p>
                        <p className="text-xs text-gray-500">{selectedOrder.billingAddress.postalCode}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">同配送地址</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">费用明细</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">商品小计</span>
                      <span className="text-gray-900">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">运费</span>
                      <span className="text-gray-900">{selectedOrder.shipping > 0 ? formatPrice(selectedOrder.shipping) : '免运费'}</span>
                    </div>
                    {selectedOrder.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">税费</span>
                        <span className="text-gray-900">{formatPrice(selectedOrder.taxAmount)}</span>
                      </div>
                    )}
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">折扣</span>
                        <span className="text-green-600">-{formatPrice(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                      <span className="font-semibold text-gray-800">合计</span>
                      <span className="font-semibold text-[#C89460] text-lg">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">更新订单状态</h4>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(selectedOrder.id, s)}
                        disabled={selectedOrder.status === s}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          selectedOrder.status === s
                            ? 'bg-[#C89460] text-white border-[#C89460]'
                            : 'border-gray-300 text-gray-600 hover:border-[#C89460] hover:text-[#C89460]'
                        }`}
                      >
                        {adminOrderService.getStatusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-gray-400">订单数据加载失败</div>
            )}

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={closeDetail} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
