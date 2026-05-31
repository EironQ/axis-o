import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Truck, CreditCard, Loader2, AlertCircle, RefreshCw, Eye } from 'lucide-react'
import { orderService, Order } from '@/services/order'
import { paymentApi } from '@/services/api'
import Dialog from '@/components/ui/Dialog'
import { useLanguage, useTranslation } from '@/i18n'
import { returnService, ReturnRequest } from '@/services/return'

const statusConfig = (t: (key: string) => string): Record<string, { label: string; color: string }> => ({
  pending: { label: t('order.status.pending'), color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: t('order.status.paid'), color: 'bg-blue-100 text-blue-700' },
  processing: { label: t('order.status.processing'), color: 'bg-purple-100 text-purple-700' },
  shipped: { label: t('order.status.shipped'), color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: t('order.status.delivered'), color: 'bg-green-100 text-green-700' },
  cancelled: { label: t('order.status.cancelled'), color: 'bg-gray-100 text-gray-600' },
  refunded: { label: t('order.status.refunded'), color: 'bg-red-100 text-red-700' },
})

const getAvailableActions = (t: (key: string) => string, status: string, hasReturnRequest?: boolean): Array<{ key: string; label: string; variant: 'primary' | 'secondary' | 'danger'; action: () => void }> => {
  const actions: Array<{ key: string; label: string; variant: 'primary' | 'secondary' | 'danger'; action: () => void }> = []

  switch (status) {
    case 'pending':
      actions.push(
        { key: 'pay', label: t('order.actions.payNow'), variant: 'primary', action: () => {} },
        { key: 'cancel', label: t('order.actions.cancelOrder'), variant: 'danger', action: () => {} }
      )
      break
    case 'paid':
      if (!hasReturnRequest) {
        actions.push(
          { key: 'return', label: t('order.actions.requestReturn'), variant: 'secondary', action: () => {} }
        )
      }
      break
    case 'processing':
      break
    case 'shipped':
      actions.push(
        { key: 'confirm', label: t('order.actions.confirmReceipt'), variant: 'primary', action: () => {} }
      )
      if (!hasReturnRequest) {
        actions.push(
          { key: 'return', label: t('order.actions.requestReturn'), variant: 'secondary', action: () => {} }
        )
      }
      break
    case 'delivered':
      actions.push(
        { key: 'review', label: t('order.actions.reviewProduct'), variant: 'primary', action: () => {} }
      )
      if (!hasReturnRequest) {
        actions.push(
          { key: 'return', label: t('order.actions.requestReturn'), variant: 'secondary', action: () => {} }
        )
      }
      break
    case 'cancelled':
    case 'refunded':
      actions.push(
        { key: 'reorder', label: t('order.actions.reorder'), variant: 'primary', action: () => {} }
      )
      break
  }

  return actions
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { t } = useTranslation()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [existingReturn, setExistingReturn] = useState<ReturnRequest | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate(`/${lang}/login`)
      return
    }
    if (orderId) {
      loadOrder(orderId)
    }
  }, [orderId])

  const syncPaymentStatus = async (id: string): Promise<boolean> => {
    setSyncMessage(null)
    setIsSyncing(true)
    try {
      const syncResult = await paymentApi.syncStatus(id)
      if (syncResult.success) {
        const newStatus = syncResult.data?.status
        if (newStatus === 'paid' || newStatus === 'processing') {
          const refreshed = await orderService.getById(id)
          if (refreshed.success && refreshed.data) {
            setOrder(refreshed.data)
            setSyncMessage(t('order.paymentStatusUpdated'))
            setTimeout(() => setSyncMessage(null), 3000)
            return true
          }
        } else {
          setSyncMessage(syncResult.data?.message || t('order.syncFailed'))
          setTimeout(() => setSyncMessage(null), 5000)
        }
      } else {
        setSyncMessage(t('order.syncFailed'))
        setTimeout(() => setSyncMessage(null), 5000)
      }
    } catch (e) {
      console.error('Failed to sync payment status:', e)
      setSyncMessage(t('order.syncFailed'))
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setIsSyncing(false)
    }
    return false
  }

  const handleReturnRequest = async () => {
    if (!orderId) return
    
    try {
      const response = await returnService.getByOrderId(orderId)
      if (response.success && response.data) {
        setExistingReturn(response.data)
        setReturnDialogOpen(true)
      } else {
        navigate(`/${lang}/returns/create/${orderId}`)
      }
    } catch {
      navigate(`/${lang}/returns/create/${orderId}`)
    }
  }

  const loadOrder = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await orderService.getById(id)
      if (response.success && response.data) {
        setOrder(response.data)
        if (response.data.status === 'pending') {
          await syncPaymentStatus(id)
        }
      } else {
        setError(response.error?.message || t('order.errors.loadFailed'))
      }
    } catch {
      setError(t('order.errors.networkError'))
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

  const handleAction = async (actionKey: string) => {
    if (!orderId || !order) return
    
    if (actionKey === 'cancel') {
      setDialogOpen(true)
      return
    }
    
    setActiveAction(actionKey)
    
    try {
      switch (actionKey) {
        case 'pay':
          navigate(`/${lang}/checkout?orderId=${orderId}`)
          break
        case 'confirm':
          setOrder({ ...order, status: 'delivered', deliveredAt: new Date().toISOString() })
          break
        case 'reorder':
          navigate(`/${lang}/products`)
          break
        case 'return':
          await handleReturnRequest()
          break
      }
    } catch {
      setError(t('order.errors.operationFailed'))
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
        setError(cancelResponse.error?.message || t('order.errors.cancelFailed'))
      }
    } catch {
      setError(t('order.errors.operationFailed'))
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
          <p className="mt-4 text-[#3C2415]/60">{t('common.loading')}</p>
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
              to={`/${lang}/orders`}
              className="inline-flex items-center gap-2 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              {t('order.backToOrders')}
            </Link>
            <div className="text-center">
              <h1 className="font-['Playfair_Display'] text-3xl text-[#3C2415]">{t('order.orderDetails')}</h1>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[960px] px-8 py-12">
          <div className="bg-white border border-[#E5DDD3] p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <p className="text-[#3C2415]/60 mb-4">{error || t('order.errors.orderNotFound')}</p>
            {orderId && (
              <button
                onClick={() => loadOrder(orderId)}
                className="text-sm text-[#C89460] hover:text-[#3C2415] transition-colors"
              >
                {t('order.errors.retry')}
              </button>
            )}
          </div>
        </div>
      </main>
    )
  }

  const items = order.items || []
  const currentStatusConfig = statusConfig(t)

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-24 pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1200px] px-8">
          <Link
            to={`/${lang}/orders`}
            className="inline-flex items-center gap-2 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            {t('order.backToOrders')}
          </Link>
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">AXIS O</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">{t('order.orderDetails')}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-8 py-12 space-y-6">
        <div className="bg-white border border-[#E5DDD3] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#3C2415]/50">{t('order.orderNumber')}</span>
                <span className="text-sm font-medium text-[#3C2415]">{order.orderNumber}</span>
              </div>
              <p className="text-xs text-[#3C2415]/40 mt-2">{t('order.orderDate')}: {formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${currentStatusConfig[order.status]?.color || ''}`}>
                {currentStatusConfig[order.status]?.label || order.status}
              </span>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
              <Package size={16} className="text-[#C89460]" />
              {t('order.itemsCount', { count: items.length.toString() })}
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
                      {item.variantDescription || t('order.noSpecification')}
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
              {t('order.shippingInfo')}
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-[#3C2415]/50">{t('order.shippingMethod')}</span>
                <p className="mt-1 text-sm text-[#3C2415]">{order.shippingMethod === 'express' ? t('order.expressShipping') : order.shippingMethod === 'standard' ? t('order.standardShipping') : (order.shippingMethod || t('order.standardShipping'))}</p>
              </div>
              {order.paidAt && (
                <div>
                  <span className="text-xs text-[#3C2415]/50">{t('order.paymentDate')}</span>
                  <p className="mt-1 text-sm text-[#3C2415]">{formatDate(order.paidAt)}</p>
                </div>
              )}
              {order.shippedAt && (
                <div>
                  <span className="text-xs text-[#3C2415]/50">{t('order.shippedDate')}</span>
                  <p className="mt-1 text-sm text-[#3C2415]">{formatDate(order.shippedAt)}</p>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <span className="text-xs text-[#3C2415]/50">{t('order.deliveredDate')}</span>
                  <p className="mt-1 text-sm text-[#3C2415]">{formatDate(order.deliveredAt)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-[#C89460]" />
              {t('order.shippingAddress')}
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
              <p className="text-sm text-[#3C2415]/40">{t('order.noAddressInfo')}</p>
            )}
          </div>
        </div>

        {order.payment && (
          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-[#C89460]" />
              {t('order.paymentInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-[#3C2415]/50">{t('order.transactionId')}</span>
                <p className="mt-1 text-sm font-mono text-[#3C2415] break-all">
                  {order.payment.transactionId || '-'}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#3C2415]/50">{t('order.paymentProvider')}</span>
                <p className="mt-1 text-sm text-[#3C2415]">
                  {order.payment.provider === 'stripe' ? 'Stripe' : order.payment.provider === 'paypal' ? 'PayPal' : order.payment.provider === 'airwallex' ? 'Airwallex' : order.payment.provider}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#3C2415]/50">{t('order.paymentStatus')}</span>
                <p className="mt-1 text-sm text-[#3C2415]">
                  {order.payment.status === 'succeeded' ? t('payment.success') : order.payment.status === 'pending' ? t('payment.processing') : order.payment.status === 'processing' ? t('order.status.processing') : order.payment.status === 'failed' ? t('payment.failed') : order.payment.status === 'refunded' ? t('order.status.refunded') : order.payment.status === 'partially_refunded' ? 'Partially Refunded' : order.payment.status}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#3C2415]/50">{t('order.paymentAmount')}</span>
                <p className="mt-1 text-sm text-[#3C2415]">
                  {formatPrice(parseFloat(order.payment.amount))}
                </p>
              </div>
              {order.payment.feeAmount && (
                <div>
                  <span className="text-xs text-[#3C2415]/50">{t('order.fee')}</span>
                  <p className="mt-1 text-sm text-[#3C2415]">
                    {formatPrice(parseFloat(order.payment.feeAmount))}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-[#3C2415]/50">{t('order.paymentDate2')}</span>
                <p className="mt-1 text-sm text-[#3C2415]">{formatDate(order.payment.createdAt)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E5DDD3] p-6">
          <h3 className="text-sm font-medium text-[#3C2415] mb-4">{t('order.costDetails')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#3C2415]/60">{t('order.subtotal')}</span>
              <span className="text-[#3C2415]">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#3C2415]/60">{t('order.shipping')}</span>
              <span className="text-[#3C2415]">
                {order.shippingCost > 0 ? formatPrice(order.shippingCost) : t('order.freeShipping')}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">{t('order.discount')}</span>
                <span className="text-green-600">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-[#E5DDD3]">
              <span className="font-medium text-[#3C2415]">{t('order.total')}</span>
              <span className="font-semibold text-[#C89460] text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-white border border-[#E5DDD3] p-6">
            <h3 className="text-sm font-medium text-[#3C2415] mb-2">{t('order.notes')}</h3>
            <p className="text-sm text-[#3C2415]/70">{order.notes}</p>
          </div>
        )}

        <div className="bg-white border border-[#E5DDD3] p-6">
          <h3 className="text-sm font-medium text-[#3C2415] mb-4">{t('order.orderActions')}</h3>
          <div className="flex flex-wrap gap-3">
            {getAvailableActions(t, order.status, order.hasReturnRequest).map((action) => (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                disabled={activeAction === action.key}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${getActionClass(action.variant)} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {activeAction === action.key ? t('order.processing') : action.label}
              </button>
            ))}
            {order.status === 'pending' && (
              <button
                onClick={() => syncPaymentStatus(order.id)}
                disabled={isSyncing}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[#C89460] text-[#C89460] hover:bg-[#C89460] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? t('order.refreshing') : t('order.refreshPaymentStatus')}
              </button>
            )}
          </div>
          {syncMessage && (
            <p className="mt-3 text-sm text-[#C89460]">{syncMessage}</p>
          )}
        </div>
      </div>

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t('order.cancelDialog.title')}
        message={t('order.cancelDialog.message', { orderNumber: order.orderNumber })}
        confirmText={t('order.cancelDialog.confirm')}
        cancelText={t('common.cancel')}
        confirmColor="danger"
        onConfirm={handleCancelOrder}
      />

      <Dialog
        isOpen={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        title={t('return.existing.title')}
        message={t('return.existing.message')}
        confirmText={t('return.existing.view')}
        cancelText={t('common.cancel')}
        confirmColor="primary"
        onConfirm={() => {
          setReturnDialogOpen(false)
          navigate(`/${lang}/returns/${existingReturn?.id}`)
        }}
      />
    </main>
  )
}
