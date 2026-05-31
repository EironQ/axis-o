const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const getToken = () => localStorage.getItem('adminToken')

const adminRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }
  return response.json()
}

export interface AdminOrderItem {
  id: string
  productId: string
  variantId: string
  productName: string
  variantDescription: string
  colorName: string
  colorHex: string
  size: string
  price: number
  quantity: number
  image: string | null
}

export interface AdminOrderAddress {
  name: string
  phone: string
  province: string
  city: string
  district: string
  street: string
  postalCode: string
}

export interface AdminOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: number
  shipping: number
  taxAmount: number
  discountAmount: number
  total: number
  currency: string
  paymentMethod: string
  paymentTransactionId?: string | null
  paymentStatus?: string | null
  trackingNumber?: string
  note?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  items: AdminOrderItem[]
  shippingAddress: AdminOrderAddress | null
  billingAddress: AdminOrderAddress | null
}

function parseVariantDescription(desc: string): { colorName: string; size: string } {
  if (!desc) return { colorName: '', size: '' }
  const parts = desc.split(' / ')
  return { colorName: parts[0] || '', size: parts[1] || '' }
}

function buildName(firstName?: string, lastName?: string): string {
  if (firstName && lastName) return `${firstName} ${lastName}`
  if (firstName) return firstName
  if (lastName) return lastName
  return '未知用户'
}

function mapAddress(addr: any): AdminOrderAddress | null {
  if (!addr) return null
  return {
    name: [addr.firstName, addr.lastName].filter(Boolean).join(' ') || '未知',
    phone: addr.phone || '',
    province: addr.state || '',
    city: addr.city || '',
    district: '',
    street: [addr.line1, addr.line2].filter(Boolean).join(' ') || '',
    postalCode: addr.postalCode || '',
  }
}

function mapApiOrder(apiOrder: any): AdminOrder {
  const user = apiOrder.user || {}

  return {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber,
    customerName: buildName(user.firstName, user.lastName),
    customerPhone: user.phone || '',
    customerEmail: user.email || '',
    status: apiOrder.status,
    subtotal: Number(apiOrder.subtotal || 0),
    shipping: Number(apiOrder.shippingCost || 0),
    taxAmount: Number(apiOrder.taxAmount || 0),
    discountAmount: Number(apiOrder.discountAmount || 0),
    total: Number(apiOrder.total || 0),
    currency: apiOrder.currency || 'USD',
    paymentMethod: apiOrder.payment?.provider || '',
    paymentTransactionId: apiOrder.payment?.transactionId || null,
    paymentStatus: apiOrder.payment?.status || null,
    trackingNumber: apiOrder.trackingNumber || undefined,
    note: apiOrder.notes || undefined,
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt,
    paidAt: apiOrder.paidAt || undefined,
    shippedAt: apiOrder.shippedAt || undefined,
    deliveredAt: apiOrder.deliveredAt || undefined,
    items: (apiOrder.items || []).map((item: any) => {
      const { colorName, size } = parseVariantDescription(item.variantDescription)
      return {
        id: item.id,
        productId: item.productId || '',
        variantId: item.variantId || '',
        productName: item.productName || '',
        variantDescription: item.variantDescription || '',
        colorName,
        colorHex: '#C89460',
        size,
        price: Number(item.unitPrice || 0),
        quantity: item.quantity || 0,
        image: item.image || null,
      }
    }),
    shippingAddress: mapAddress(apiOrder.shippingAddress),
    billingAddress: mapAddress(apiOrder.billingAddress),
  }
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  paid: '已付款',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
  refunded: 'bg-red-100 text-red-700',
}

const paymentLabels: Record<string, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  airwallex: 'Airwallex',
  card: '银行卡',
  credit_card: '信用卡',
  wechat: '微信支付',
  bank_transfer: '银行转账',
}

export const adminOrderService = {
  getAll: async (params: {
    page?: number
    limit?: number
    status?: string
    search?: string
  } = {}): Promise<{
    success: boolean
    data: { orders: AdminOrder[]; total: number; page: number; limit: number; totalPages: number }
  }> => {
    const { page = 1, limit = 20, status, search } = params
    const qs = new URLSearchParams()
    qs.set('page', String(page))
    qs.set('limit', String(limit))
    if (status && status !== 'all') qs.set('status', status)
    if (search) qs.set('search', search)

    const result = await adminRequest<{
      success: boolean
      data: { orders: any[]; pagination: { total: number; totalPages: number } }
    }>(`/admin/orders?${qs.toString()}`)

    return {
      success: true,
      data: {
        orders: (result.data.orders || []).map(mapApiOrder),
        total: result.data.pagination.total,
        page,
        limit,
        totalPages: result.data.pagination.totalPages,
      },
    }
  },

  getById: async (id: string): Promise<{ success: boolean; data: AdminOrder | null; error?: { message: string } }> => {
    try {
      const result = await adminRequest<{ success: boolean; data: any }>(`/admin/orders/${id}`)
      return { success: true, data: result.data ? mapApiOrder(result.data) : null }
    } catch (err: any) {
      return { success: false, data: null, error: { message: err.message || '加载失败' } }
    }
  },

  updateStatus: async (id: string, status: AdminOrder['status'], options?: {
    trackingNumber?: string
  }): Promise<{ success: boolean; data: AdminOrder | null; error?: { message: string } }> => {
    try {
      const body: Record<string, string> = { status }
      if (options?.trackingNumber) body.trackingNumber = options.trackingNumber

      const result = await adminRequest<{ success: boolean; data: any }>(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      if (!result.success) return { success: false, data: null, error: { message: '状态更新失败' } }

      const refreshed = await adminRequest<{ success: boolean; data: any }>(`/admin/orders/${id}`)
      return { success: true, data: refreshed.data ? mapApiOrder(refreshed.data) : null }
    } catch (err: any) {
      return { success: false, data: null, error: { message: err.message || '网络错误' } }
    }
  },

  getStatusLabel: (status: string) => statusLabels[status] || status,
  getStatusColor: (status: string) => statusColors[status] || 'bg-gray-100 text-gray-700',
  getPaymentLabel: (method: string) => paymentLabels[method] || method,
}
