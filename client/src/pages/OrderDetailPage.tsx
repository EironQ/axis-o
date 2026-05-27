import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Truck, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { orderService, Order } from '@/services/order'
import Dialog from '@/components/ui/Dialog'
import { useSettings } from '@/context/SettingsContext'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: '已付款', color: 'bg-blue-100 text-blue-700' },
  processing: { label: '处理中', color: 'bg-purple-100 text-purple-700' },
  shipped: { label: '已发货', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: '已送达', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600' },
  refunded: { label: '已退款', color: 'bg-red-100 text-red-700' },
}

const getAvailableActions = (status: string): Array<{ key: string; label: string; variant: 'primary' | 'secondary' | 'danger'; action: () => void }> => {
  const actions: Array<{ key: string; label: string; variant: 'primary' | 'secondary' | 'danger'; action: () => void }> = []
  
  switch (status) {
    case 'pending':
      actions.push(
        { key: 'pay', label: '立即支付', variant: 'primary', action: () => {} },
        { key: 'cancel', label: '取消订单', variant: 'danger', action: () => {} }
      )
      break
    case 'paid':
      actions.push(
        { key: 'return', label: '申请退换货', variant: 'secondary', action: () => {} }
      )
      break
    case 'processing':
      break
    case 'shipped':
      actions.push(
        { key: 'confirm', label: '确认收货', variant: 'primary', action: () => {} },
        { key: 'return', label: '申请退换货', variant: 'secondary', action: () => {} }
      )
      break
    case 'delivered':
      actions.push(
        { key: 'review', label: '评价商品', variant: 'primary', action: () => {} },
        { key: 'return', label: '申请退换货', variant: 'secondary', action: () => {} }
      )
      break
    case 'cancelled':
    case 'refunded':
      actions.push(
        { key: 'reorder', label: '重新下单', variant: 'primary', action: () => {} }
      )
      break
  }
  
  return actions
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }
    if (orderId) {
      loadOrder(orderId)
    }
  }, [orderId])

  const loadOrder = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await orderService.getById(id)
      if (response.success && response.data) {
        setOrder(response.data)
      } else {
        setError(response.error?.message || '订单加载失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
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

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const [activeAction, setActiveAction] = useState<string | null>(null)

  const handleAction = (actionKey: string) => {
    if (!orderId || !order) return
    
    if (actionKey === 'cancel') {
      setDialogOpen(true)
      return
    }
    
    setActiveAction(actionKey)
    
    try {
      switch (actionKey) {
        case 'pay':
          navigate(`/checkout?orderId=${orderId}`)
          break
        case 'confirm':
          setOrder({ ...order, status: 'delivered', deliveredAt: new Date().toISOString() })
          break
        case 'reorder':
          navigate('/products')
          break
        case 'return':
          navigate(`/returns/create/${orderId}`)
          break
      }
    } catch {
      setError('操作失败，请稍后重试')
    } finally {
      setActiveAction(null)
    }
  }

  const handleCancelOrder = async () => {
    if (!orderId || !order) return
    
    setActiveAction('cancel')
    setDialogOpen(false)
    
    try {
      const cancelResponse = await orderService.cancel(orderId)
      if (cancelResponse.success) {
        setOrder({ ...order, status: 'cancelled' })
      } else {
        setError(cancelResponse.error?.message || '取消失败')
      }
    } catch {
      setError('操作失败，请稍后重试')
    } finally {
      setActiveAction(null)
    }
  }

  const getActionClass = (variant: 'primary' | 'secondary' | 'danger') => {
    switch (variant) {
      case 'primary':
        return 'bg-[#3C2415] text-white hover:bg-[#2A1A0F]'
      case 'secondary':
        return 'bg-white text-[#3C2415] border border-[#3C2415] hover:bg-[#FAF7F2]'
      case 'danger':
        return 'bg-white text-red-500 border border-red-200 hover:bg-red-50'
    }
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

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#FAF7F2]">
        <div className="pt-24 pb-16 bg-[#F5F0E8]">
          <div className="mx-auto max-w-[1200px] px-8">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              返回订单列表
            </Link>
            <div className="text-center">
              <h1 className="font-['Playfair_Display'] text-3xl text-[#3C2415]">订单详情</h1>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[960px] px-8 py-12">
          <div className="bg-white border border-[#E5DDD3] p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <p className="text-[#3C2415]/60 mb-4">{error || '订单不存在'}</p>
            {orderId && (
              <button
                onClick={() => loadOrder(orderId)}
                className="text-sm text-[#C89460] hover:text-[#3C2415] transition-colors"
              >
                重试
              </button>
            )}
          </div>
        </div>
      </main>
    )
  }

  const items = order.items || []

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-24 pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1200px] px-8">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            返回订单列表
          </Link>
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">AXIS O</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">订单详情</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-8 py-12 space-y-6">
        <div className="bg-white border border-[#E5DDD3] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#3C2415]/50">订单号</span>
                <span className="text-sm font-medium text-[#3C2415]">{order.orderNumber}</span>
              </div>
              <p className="text-xs text-[#3C2415]/40 mt-2">下单时间: {formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusConfig[order.status]?.color || ''}`}>
                {statusConfig[order.status]?.label || order.status}
              </span>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
              <Package size={16} className="text-[#C89460]" />
              商品明细 ({items.length} 件)
            </h3>
            <div className="divide-y divide-[#E5DDD3]">
              {items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <div className="w-20 h-20 bg-[#F5F0E8] flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={28} className="text-[#C89460]/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#3C2415] truncate">{item.productName}</h4>
                    <p className="text-xs text-[#3C2415]/50 mt-1">
                      {item.variantDescription || '无规格'}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-[#3C2415]/60">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </span>
                      <span className="text-sm font-medium text-[#3C2415]">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
              <Truck size={16} className="text-[#C89460]" />
              配送信息
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-[#3C2415]/50">配送方式</span>
                <p className="mt-1 text-sm text-[#3C2415]">{order.shippingMethod === 'express' ? '加急配送' : order.shippingMethod === 'standard' ? '标准配送' : (order.shippingMethod || '标准配送')}</p>
              </div>
              {order.paidAt && (
                <div>
                  <span className="text-xs text-[#3C2415]/50">付款时间</span>
                  <p className="mt-1 text-sm text-[#3C2415]">{formatDate(order.paidAt)}</p>
                </div>
              )}
              {order.shippedAt && (
                <div>
                  <span className="text-xs text-[#3C2415]/50">发货时间</span>
                  <p className="mt-1 text-sm text-[#3C2415]">{formatDate(order.shippedAt)}</p>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <span className="text-xs text-[#3C2415]/50">送达时间</span>
                  <p className="mt-1 text-sm text-[#3C2415]">{formatDate(order.deliveredAt)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-[#C89460]" />
              收货地址
            </h3>
            {order.shippingAddress ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#3C2415]">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  {order.shippingAddress.phone && (
                    <span className="ml-3 text-xs text-[#3C2415]/50">{order.shippingAddress.phone}</span>
                  )}
                </p>
                <p className="text-xs text-[#3C2415]/60">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? ` ${order.shippingAddress.line2}` : ''}
                </p>
                <p className="text-xs text-[#3C2415]/60">
                  {order.shippingAddress.city}
                  {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                  {' '}{order.shippingAddress.postalCode}
                </p>
                <p className="text-xs text-[#3C2415]/50">{order.shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-sm text-[#3C2415]/40">暂无地址信息</p>
            )}
          </div>
        </div>

        {order.payment && (
          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-[#C89460]" />
              支付信息
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-[#3C2415]/50">支付流水号</span>
                <p className="mt-1 text-sm font-mono text-[#3C2415] break-all">
                  {order.payment.transactionId || '-'}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#3C2415]/50">支付渠道</span>
                <p className="mt-1 text-sm text-[#3C2415]">
                  {order.payment.provider === 'stripe' ? 'Stripe' : order.payment.provider === 'paypal' ? 'PayPal' : order.payment.provider === 'alipay' ? '支付宝' : order.payment.provider}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#3C2415]/50">支付状态</span>
                <p className="mt-1 text-sm text-[#3C2415]">
                  {order.payment.status === 'succeeded' ? '支付成功' : order.payment.status === 'pending' ? '待支付' : order.payment.status === 'processing' ? '处理中' : order.payment.status === 'failed' ? '支付失败' : order.payment.status === 'refunded' ? '已退款' : order.payment.status === 'partially_refunded' ? '部分退款' : order.payment.status}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#3C2415]/50">支付金额</span>
                <p className="mt-1 text-sm text-[#3C2415]">
                  {formatPrice(parseFloat(order.payment.amount))}
                </p>
              </div>
              {order.payment.feeAmount && (
                <div>
                  <span className="text-xs text-[#3C2415]/50">手续费</span>
                  <p className="mt-1 text-sm text-[#3C2415]">
                    {formatPrice(parseFloat(order.payment.feeAmount))}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-[#3C2415]/50">支付时间</span>
                <p className="mt-1 text-sm text-[#3C2415]">{formatDate(order.payment.createdAt)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E5DDD3] p-6">
          <h3 className="text-sm font-medium text-[#3C2415] mb-4">费用明细</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#3C2415]/60">商品小计</span>
              <span className="text-[#3C2415]">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#3C2415]/60">运费</span>
              <span className="text-[#3C2415]">
                {order.shippingCost > 0 ? formatPrice(order.shippingCost) : '免运费'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#3C2415]/60">税费</span>
              <span className="text-[#3C2415]">{formatPrice(order.taxAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">折扣</span>
                <span className="text-green-600">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-[#E5DDD3]">
              <span className="font-medium text-[#3C2415]">合计</span>
              <span className="font-semibold text-[#C89460] text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-2">备注</h3>
            <p className="text-sm text-[#3C2415]/70">{order.notes}</p>
          </div>
        )}

        <div className="bg-white border border-[#E5DDD3] p-6">
          <h3 className="text-sm font-medium text-[#3C2415] mb-4">订单操作</h3>
          <div className="flex flex-wrap gap-3">
            {getAvailableActions(order.status).map((action) => (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                disabled={activeAction === action.key}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${getActionClass(action.variant)} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {activeAction === action.key ? '处理中...' : action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="取消订单"
        message={`确定要取消订单 ${order.orderNumber} 吗？取消后将无法恢复。`}
        confirmText="确认取消"
        cancelText="返回"
        confirmColor="danger"
        onConfirm={handleCancelOrder}
      />
    </main>
  )
}
