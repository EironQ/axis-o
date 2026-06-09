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
  RefreshCw,
} from 'lucide-react'
import { orderService, Order } from '@/services/order'
import { useSettings } from '@/context/SettingsContext'
import { useLanguage, useTranslation } from '@/i18n'
import Dialog from '@/components/ui/Dialog'

const statusConfig = (t: (key: string) => string): Record<string, { label: string; color: string }> => ({
  pending: { label: t('order.status.pending'), color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  paid: { label: t('order.status.paid'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { label: t('order.status.processing'), color: 'bg-purple-100 text-purple-700 border-purple-200' },
  shipped: { label: t('order.status.shipped'), color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  delivered: { label: t('order.status.delivered'), color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: t('order.status.cancelled'), color: 'bg-gray-100 text-gray-600 border-gray-200' },
  refunded: { label: t('order.status.refunded'), color: 'bg-red-100 text-red-700 border-red-200' },
})

const formatPrice = (price: number) => {
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

const isReturnAvailable = (deliveredAt?: string): boolean => {
  if (!deliveredAt) return true
  const deliveredDate = new Date(deliveredAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - deliveredDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

export default function OrderListPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)

  const currentStatusConfig = statusConfig(t)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate(`/${lang}/login`)
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
        setMessage({ type: 'error', text: response.error?.message || t('order.loadOrdersFailed') })
      }
    } catch {
      setMessage({ type: 'error', text: t('order.errors.networkError') })
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
        setMessage({ type: 'success', text: t('order.success.orderCancelled') })
      } else {
        setMessage({ type: 'error', text: response.error?.message || t('order.errors.cancelFailed') })
      }
    } catch {
      setMessage({ type: 'error', text: t('order.errors.networkError') })
    } finally {
      setCancellingId(null)
    }
  }

  const handleConfirmDelivery = async (orderId: string) => {
    setConfirmingId(orderId)
    setMessage(null)

    try {
      const response = await orderService.confirmDelivery(orderId)
      if (response.success) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: 'delivered' as const, deliveredAt: new Date().toISOString() } : o)))
        setMessage({ type: 'success', text: t('order.success.confirmTitle') })
      } else {
        setMessage({ type: 'error', text: response.error?.message || t('order.errors.confirmFailed') })
      }
    } catch {
      setMessage({ type: 'error', text: t('order.errors.networkError') })
    } finally {
      setConfirmingId(null)
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
          <p className="mt-4 text-[#3C2415]/60">{t('common.loading')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-20 pb-8 md:pt-24 md:pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <div className="max-w-[960px] mx-auto">
            <Link
              to={`/${lang}/profile`}
              className="inline-flex items-center gap-2 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors mb-4 md:mb-8"
            >
              <ArrowLeft size={16} />
              {t('common.back')}
            </Link>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-2 md:mb-4">AXIS O</p>
            <h1 className="font-['Playfair_Display'] text-2xl md:text-4xl text-[#3C2415]">{t('order.myOrders')}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-6 md:py-12">
        <div className="max-w-[960px] mx-auto">
          {message && (
            <div className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border border-green-200 p-4 rounded-lg animate-pulse' : 'bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm'}`}>
              {message.type === 'success' ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">{message.text}</h4>
                    <p className="text-sm text-green-600">{t('order.success.confirmMessage')}</p>
                  </div>
                </div>
              ) : (
                <>
                  <AlertCircle size={18} className="text-red-600 shrink-0" />
                  {message.text}
                </>
              )}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white border border-[#E5DDD3] p-16 text-center">
              <PackageOpen className="w-16 h-16 text-[#C89460]/30 mx-auto mb-4" />
              <p className="text-[#3C2415]/60 mb-2">{t('cart.empty')}</p>
              <p className="text-sm text-[#3C2415]/40 mb-6">{t('cart.emptyHint')}</p>
              <Link
                to={`/${lang}/products`}
                className="inline-flex items-center px-6 py-2.5 bg-[#3C2415] text-white text-sm font-medium hover:bg-[#2A1A0F] transition-colors"
              >
                {t('cart.exploreProducts')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[#E5DDD3] overflow-hidden transition-shadow hover:shadow-sm"
                >
                  <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[#E5DDD3] flex flex-wrap items-center justify-between gap-2 md:gap-3">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <div>
                        <span className="text-xs text-[#3C2415]/50">{t('order.orderNumber')}</span>
                        <p className="text-sm font-medium text-[#3C2415]">{order.orderNumber}</p>
                      </div>
                      <span className="text-xs text-[#3C2415]/30 hidden sm:block">|</span>
                      <span className="text-xs text-[#3C2415]/50">{formatDate(order.createdAt)}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 md:px-3 md:py-1 text-xs font-medium border rounded-full ${currentStatusConfig[order.status]?.color || 'bg-gray-100 text-gray-600'}`}
                    >
                      {currentStatusConfig[order.status]?.label || order.status}
                    </span>
                  </div>

                  <div className="px-4 py-3 md:px-6 md:py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-sm">
                      <div>
                        <span className="text-[#3C2415]/40">{t('order.total')}</span>
                        <p className="mt-0.5 md:mt-1 text-[#3C2415] font-medium">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#3C2415]/40">{t('order.shipping')}</span>
                        <p className="mt-0.5 md:mt-1 text-[#3C2415]">
                          {order.shippingCost > 0 ? formatPrice(order.shippingCost) : t('order.freeShipping')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#3C2415]/40">{t('order.shippingMethod')}</span>
                        <p className="mt-0.5 md:mt-1 text-[#3C2415]">{order.shippingMethod === 'express' ? t('order.expressShipping') : order.shippingMethod === 'standard' ? t('order.standardShipping') : (order.shippingMethod || t('order.standardShipping'))}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 md:px-6 md:py-3 border-t border-[#E5DDD3] flex flex-wrap items-center gap-2">
                    <Link
                      to={`/${lang}/orders/${order.id}`}
                      className="px-4 py-2 text-sm border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2"
                    >
                      <Package size={14} />
                      {t('order.orderDetails')}
                      <ChevronRight size={14} />
                    </Link>

                    {order.status === 'pending' && (
                      <Link
                        to={`/${lang}/checkout?orderId=${order.id}`}
                        className="px-4 py-2 text-sm bg-[#3C2415] text-white hover:bg-[#2A1A0F] transition-colors flex items-center gap-2"
                      >
                        <CreditCard size={14} />
                        {t('order.actions.payNow')}
                      </Link>
                    )}

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleOpenCancelDialog(order)}
                        disabled={cancellingId === order.id}
                        className="px-4 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {cancellingId === order.id ? t('order.refreshing') : t('order.actions.cancelOrder')}
                      </button>
                    )}

                    {order.status === 'shipped' && (
                      <button
                        onClick={() => handleConfirmDelivery(order.id)}
                        disabled={confirmingId === order.id}
                        className="px-4 py-2 text-sm border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Truck size={14} />
                        {confirmingId === order.id ? t('order.processing') : t('order.actions.confirmReceipt')}
                      </button>
                    )}

                    {order.status === 'delivered' && isReturnAvailable(order.deliveredAt) && !order.hasReturnRequest && (
                      <Link
                        to={`/${lang}/returns/create/${order.id}`}
                        className="px-4 py-2 text-sm border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2"
                      >
                        <RefreshCw size={14} />
                        {t('order.actions.requestReturn')}
                      </Link>
                    )}

                    {order.status === 'delivered' && !isReturnAvailable(order.deliveredAt) && (
                      <span className="px-4 py-2 text-sm text-gray-500">{t('order.returnExpired')}</span>
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
        title={t('order.cancelDialog.title')}
        message={t('order.cancelDialog.message', { orderNumber: orderToCancel?.orderNumber || '' })}
        confirmText={t('order.cancelDialog.confirm')}
        cancelText={t('common.back')}
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
