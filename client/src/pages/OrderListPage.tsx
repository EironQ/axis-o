import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Package,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Truck,
  Trash2,
  PackageOpen,
  ChevronRight,
} from 'lucide-react'
import { orderService, Order } from '@/services/order'
import { useSettings } from '@/context/SettingsContext'
import Dialog from '@/components/ui/Dialog'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  paid: { label: '已付款', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { label: '处理中', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  shipped: { label: '已发货', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  delivered: { label: '已送达', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  refunded: { label: '已退款', color: 'bg-red-100 text-red-700 border-red-200' },
}

const formatPrice = (price: number) => {
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function OrderListPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await orderService.getAll()
      if (response.success && response.data) {
        setOrders(response.data)
      } else {
        setMessage({ type: 'error', text: response.error?.message || '加载订单失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId)
    setMessage(null)

    try {
      const response = await orderService.cancel(orderId)
      if (response.success) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o)))
        setMessage({ type: 'success', text: '订单已取消' })
      } else {
        setMessage({ type: 'error', text: response.error?.message || '取消失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setCancellingId(null)
    }
  }

  const handleOpenCancelDialog = (order: Order) => {
    setOrderToCancel(order)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setOrderToCancel(null)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C89460] mx-auto" />
          <p className="mt-4 text-[#3C2415]/60">加载中...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-24 pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="max-w-[960px] mx-auto">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              返回个人中心
            </Link>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">AXIS O</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">我的订单</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-8 py-12">
        <div className="max-w-[960px] mx-auto">
          {message && (
            <div
              className={`mb-6 p-4 flex items-center gap-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle size={18} className="text-green-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-red-600 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white border border-[#E5DDD3] p-16 text-center">
              <PackageOpen className="w-16 h-16 text-[#C89460]/30 mx-auto mb-4" />
              <p className="text-[#3C2415]/60 mb-2">暂无订单</p>
              <p className="text-sm text-[#3C2415]/40 mb-6">去挑选您心仪的包包吧</p>
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-2.5 bg-[#3C2415] text-white text-sm font-medium hover:bg-[#2A1A0F] transition-colors"
              >
                探索产品
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[#E5DDD3] overflow-hidden transition-shadow hover:shadow-sm"
                >
                  <div className="px-6 py-4 border-b border-[#E5DDD3] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#3C2415]/50">订单号</span>
                      <span className="text-sm font-medium text-[#3C2415]">{order.orderNumber}</span>
                      <span className="text-xs text-[#3C2415]/30">|</span>
                      <span className="text-xs text-[#3C2415]/50">{formatDate(order.createdAt)}</span>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium border rounded-full ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-600'}`}
                    >
                      {statusConfig[order.status]?.label || order.status}
                    </span>
                  </div>

                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-[#3C2415]/40">订单金额</span>
                        <p className="mt-1 text-[#3C2415] font-medium">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#3C2415]/40">运费</span>
                        <p className="mt-1 text-[#3C2415]">
                          {order.shippingCost > 0 ? formatPrice(order.shippingCost) : '免运费'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#3C2415]/40">配送方式</span>
                        <p className="mt-1 text-[#3C2415]">{order.shippingMethod === 'express' ? '加急配送' : order.shippingMethod === 'standard' ? '标准配送' : (order.shippingMethod || '标准配送')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-3 border-t border-[#E5DDD3] flex flex-wrap items-center gap-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-4 py-2 text-sm border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2"
                    >
                      <Package size={14} />
                      查看详情
                      <ChevronRight size={14} />
                    </Link>

                    {order.status === 'pending' && (
                      <Link
                        to={`/checkout?orderId=${order.id}`}
                        className="px-4 py-2 text-sm bg-[#3C2415] text-white hover:bg-[#2A1A0F] transition-colors flex items-center gap-2"
                      >
                        <CreditCard size={14} />
                        去付款
                      </Link>
                    )}

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleOpenCancelDialog(order)}
                        disabled={cancellingId === order.id}
                        className="px-4 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {cancellingId === order.id ? '取消中...' : '取消订单'}
                      </button>
                    )}

                    {order.status === 'shipped' && (
                      <button className="px-4 py-2 text-sm border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2">
                        <Truck size={14} />
                        确认收货
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        title="取消订单"
        message={`确定要取消订单 ${orderToCancel?.orderNumber} 吗？取消后将无法恢复。`}
        confirmText="确认取消"
        cancelText="返回"
        confirmColor="danger"
        onConfirm={() => {
          if (orderToCancel) {
            handleCancel(orderToCancel.id)
          }
        }}
      />
    </main>
  )
}
