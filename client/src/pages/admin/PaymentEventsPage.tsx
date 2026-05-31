import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'

interface PaymentEvent {
  id: string
  paymentId: string
  orderId: string
  orderNumber: string | null
  eventType: string
  provider: string
  providerEventId: string | null
  amount: string | null
  currency: string | null
  feeAmount: string | null
  statusBefore: string | null
  statusAfter: string | null
  notes: string | null
  createdAt: string
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  intent_created: { label: '创建意图', color: 'bg-blue-100 text-blue-700', icon: '🆕' },
  intent_succeeded: { label: '支付成功', color: 'bg-green-100 text-green-700', icon: '✅' },
  intent_failed: { label: '支付失败', color: 'bg-red-100 text-red-700', icon: '❌' },
  intent_canceled: { label: '支付取消', color: 'bg-gray-100 text-gray-600', icon: '🚫' },
  refund_requested: { label: '申请退款', color: 'bg-yellow-100 text-yellow-700', icon: '📝' },
  refund_succeeded: { label: '退款成功', color: 'bg-purple-100 text-purple-700', icon: '💰' },
  refund_failed: { label: '退款失败', color: 'bg-red-100 text-red-700', icon: '⚠️' },
  status_synced: { label: '状态同步', color: 'bg-indigo-100 text-indigo-700', icon: '🔄' },
  webhook_received: { label: 'Webhook', color: 'bg-cyan-100 text-cyan-700', icon: '📡' },
}

const PROVIDER_CONFIG: Record<string, { label: string; color: string }> = {
  stripe: { label: 'Stripe', color: 'bg-[#635BFF] text-white' },
  paypal: { label: 'PayPal', color: 'bg-[#003087] text-white' },
  airwallex: { label: 'Airwallex', color: 'bg-[#FF6B35] text-white' },
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export default function PaymentEventsPage() {
  const [events, setEvents] = useState<PaymentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadEvents = useCallback(async (page: number, search: string, typeFilter: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (search) params.append('orderNumber', search)
      if (typeFilter !== 'all') params.append('eventType', typeFilter)

      const response = await fetch(`/api/admin/payments/events?${params}`, { headers: getAuthHeaders() })
      const result = await response.json()
      if (result.success) {
        setEvents(result.data.events)
        setTotalPages(result.data.pagination.totalPages)
        setTotalCount(result.data.pagination.total)
      }
    } catch (err: any) {
      showToast('error', err.message || '加载流水失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents(1, searchTerm, eventTypeFilter)
  }, [eventTypeFilter, loadEvents])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1)
      loadEvents(1, searchTerm, eventTypeFilter)
    }, 400)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchTerm, loadEvents, eventTypeFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadEvents(page, searchTerm, eventTypeFilter)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatAmount = (amount: string | null, currency: string | null) => {
    if (!amount) return '-'
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  return (
    <AdminLayout>
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">支付流水</h2>
            <p className="text-sm text-gray-500 mt-1">
              共 {totalCount} 条记录
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="搜索订单号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
          />
          <select
            value={eventTypeFilter}
            onChange={(e) => { setEventTypeFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
          >
            <option value="all">全部类型</option>
            {Object.entries(EVENT_TYPE_CONFIG).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-500">暂无支付流水记录</p>
            <p className="text-sm text-gray-400 mt-1">完成一笔支付后，流水将自动记录</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200" />

            <div className="space-y-2">
              {events.map((event) => {
                const config = EVENT_TYPE_CONFIG[event.eventType] || { label: event.eventType, color: 'bg-gray-100 text-gray-600', icon: '📌' }
                const providerConfig = PROVIDER_CONFIG[event.provider] || { label: event.provider, color: 'bg-gray-500 text-white' }
                const isExpanded = expandedEvent === event.id

                return (
                  <div key={event.id} className="relative pl-10">
                    <div className={`absolute left-[12px] top-4 w-[15px] h-[15px] rounded-full border-2 border-white ${config.color.split(' ')[0] === 'bg-green-100' ? 'bg-green-500' : config.color.split(' ')[0] === 'bg-red-100' ? 'bg-red-500' : config.color.split(' ')[0] === 'bg-yellow-100' ? 'bg-yellow-500' : config.color.split(' ')[0] === 'bg-purple-100' ? 'bg-purple-500' : config.color.split(' ')[0] === 'bg-indigo-100' ? 'bg-indigo-500' : config.color.split(' ')[0] === 'bg-cyan-100' ? 'bg-cyan-500' : 'bg-gray-400'} shadow-sm`} />

                    <div
                      className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors cursor-pointer"
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{config.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                                {config.label}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${providerConfig.color}`}>
                                {providerConfig.label}
                              </span>
                              {event.orderNumber && (
                                <span className="text-xs text-gray-400 font-mono">
                                  {event.orderNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {event.notes || `${config.label}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                          {event.amount && (
                            <span className="font-medium">
                              {formatAmount(event.amount, event.currency)}
                              {event.feeAmount && (
                                <span className="text-gray-400 ml-1">
                                  (手续费: {formatAmount(event.feeAmount, event.currency)})
                                </span>
                              )}
                            </span>
                          )}
                          <span>{formatTime(event.createdAt)}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-gray-400">事件ID</span>
                              <p className="font-mono mt-0.5 truncate">{event.id}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">支付ID</span>
                              <p className="font-mono mt-0.5 truncate">{event.paymentId}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">渠道事件ID</span>
                              <p className="font-mono mt-0.5 truncate">{event.providerEventId || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">订单ID</span>
                              <p className="font-mono mt-0.5 truncate">{event.orderId}</p>
                            </div>
                          </div>

                          {(event.statusBefore || event.statusAfter) && (
                            <div className="flex items-center gap-2 text-xs">
                              {event.statusBefore && (
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {event.statusBefore}
                                </span>
                              )}
                              {event.statusBefore && event.statusAfter && (
                                <span className="text-gray-400">→</span>
                              )}
                              {event.statusAfter && (
                                <span className={`px-2 py-0.5 rounded ${
                                  event.statusAfter === 'succeeded' || event.statusAfter === 'refunded'
                                    ? 'bg-green-100 text-green-700'
                                    : event.statusAfter === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {event.statusAfter}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              第 {currentPage} / {totalPages} 页
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}