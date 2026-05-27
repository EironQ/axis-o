import { useState, useEffect, Component } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MapPin, CreditCard, Truck, Gift } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { orderApi, addressApi, paymentApi, CreateOrderRequest, UserAddress, PaymentIntentResponse } from '@/services/api'
import Button from '@/components/ui/Button'
import StripePaymentForm from '@/components/checkout/StripePaymentForm'
import PayPalPaymentForm from '@/components/checkout/PayPalPaymentForm'
import AlipayPaymentForm from '@/components/checkout/AlipayPaymentForm'

class CheckoutErrorBoundary extends Component<{ children: React.ReactNode; onBack: () => void }, { hasError: boolean; errorMessage: string }> {
  constructor(props: { children: React.ReactNode; onBack: () => void }) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message || '页面加载失败' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[#FAF7F2]">
          <div className="pt-24 pb-16 bg-[#F5F0E8]">
            <div className="mx-auto max-w-[1440px] px-8 text-center">
              <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">支付</h1>
            </div>
          </div>
          <div className="mx-auto max-w-[480px] px-8 py-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-red-600 mb-4">{this.state.errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.props.onBack}>返回</Button>
              <Button onClick={() => this.setState({ hasError: false, errorMessage: '' })}>重试</Button>
            </div>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}

type CheckoutPhase = 'review' | 'payment' | 'success'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const existingOrderId = searchParams.get('orderId')
  const { items, totalPrice, fetchCart, isLoading: cartLoading } = useCartStore()
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>('')
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<string>('')
  const [shippingMethod, setShippingMethod] = useState<string>('standard')
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paypal' | 'alipay'>('stripe')
  const [discountCode, setDiscountCode] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>('review')
  const [paymentData, setPaymentData] = useState<PaymentIntentResponse['data'] | null>(null)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(!!existingOrderId)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const initData = async () => {
      await fetchAddresses()
      
      if (existingOrderId) {
        loadExistingOrder(existingOrderId)
      } else {
        fetchCart()
      }
    }

    initData()
  }, [existingOrderId])

  const [orderItems, setOrderItems] = useState<any[]>([])

  const loadExistingOrder = async (orderId: string) => {
    setIsLoadingOrder(true)
    setError(null)
    try {
      const response = await orderApi.getById(orderId)
      if (!response.success || !response.data) {
        setError('订单加载失败，请确认订单号正确')
        setIsLoadingOrder(false)
        return
      }
      const order = response.data
      const orderInfo = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total || 0),
        currency: order.currency || 'CNY',
        status: order.status,
      }
      setOrderResult(orderInfo)

      if (order.items && order.items.length > 0) {
        setOrderItems(order.items)
      }

      if (order.shippingAddress && order.shippingAddress.id && addresses.length > 0) {
        const matchingAddress = addresses.find(addr => addr.id === order.shippingAddress.id)
        if (matchingAddress) {
          setSelectedShippingAddress(matchingAddress.id)
          setSelectedBillingAddress(matchingAddress.id)
        }
      }

      if (order.status === 'paid' || order.status === 'processing' || order.status === 'delivered') {
        setCheckoutPhase('success')
        setIsLoadingOrder(false)
        return
      }

      if (order.status === 'cancelled' || order.status === 'refunded') {
        setError(`订单已${order.status === 'cancelled' ? '取消' : '退款'}，无法继续支付`)
        setIsLoadingOrder(false)
        return
      }

      if (order.status === 'pending') {
        const urlParams = new URLSearchParams(window.location.search)
        const redirectStatus = urlParams.get('redirect_status')
        if (redirectStatus) {
          try {
            await paymentApi.syncStatus(orderId)
            const refreshedOrder = await orderApi.getById(orderId)
            if (refreshedOrder.data?.status === 'paid' || refreshedOrder.data?.status === 'processing' || refreshedOrder.data?.status === 'delivered') {
              setOrderResult({
                orderId: refreshedOrder.data.id,
                orderNumber: refreshedOrder.data.orderNumber,
                total: Number(refreshedOrder.data.total || 0),
                currency: refreshedOrder.data.currency || 'CNY',
                status: refreshedOrder.data.status,
              })
              setCheckoutPhase('success')
              setIsLoadingOrder(false)
              return
            }
          } catch (e) {
            console.error('Failed to sync payment after redirect:', e)
          }
          const url = new URL(window.location.href)
          url.searchParams.delete('payment_intent')
          url.searchParams.delete('payment_intent_client_secret')
          url.searchParams.delete('redirect_status')
          window.history.replaceState({}, '', url.toString())
        }
        setCheckoutPhase('review')
      }
    } catch (err: any) {
      setError(err?.message || '订单加载失败，请稍后重试')
    } finally {
      setIsLoadingOrder(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const response = await addressApi.list()
      if (response.success) {
        setAddresses(response.data)
        const defaultAddress = response.data.find((addr: UserAddress) => addr.isDefault)
        if (defaultAddress) {
          setSelectedShippingAddress(defaultAddress.id)
          setSelectedBillingAddress(defaultAddress.id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    }
  }

  const shippingMethods = [
    { value: 'standard', label: '标准配送', desc: '3-5个工作日送达', price: 0 },
    { value: 'express', label: '加急配送', desc: '1-2个工作日送达', price: 50 },
  ]

  const validItems = items.filter(item => item.quantity > 0)
  const validTotalPrice = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedMethod = shippingMethods.find(m => m.value === shippingMethod)
  const shippingCost = selectedMethod?.price ?? 50
  const taxAmount = validTotalPrice * 0.08
  const orderTotal = parseFloat((validTotalPrice + shippingCost + taxAmount).toFixed(2))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    setSubmitAttempted(true)

    try {
      if (!selectedShippingAddress) {
        setError('请选择配送地址')
        setIsSubmitting(false)
        return
      }

      if (!selectedBillingAddress) {
        setError('请选择账单地址，或勾选"与配送地址相同"')
        setIsSubmitting(false)
        return
      }

      if (addresses.length === 0) {
        setError('请先添加收货地址')
        setIsSubmitting(false)
        return
      }

      const shippingAddressExists = addresses.some(addr => addr.id === selectedShippingAddress)
      if (!shippingAddressExists) {
        setError('所选配送地址不存在，请重新选择')
        setIsSubmitting(false)
        return
      }

      const billingAddressExists = addresses.some(addr => addr.id === selectedBillingAddress)
      if (!billingAddressExists) {
        setError('所选账单地址不存在，请重新选择')
        setIsSubmitting(false)
        return
      }

      if (existingOrderId && orderResult) {
        try {
          const paymentResponse = await paymentApi.createIntent(orderResult.orderId, paymentProvider)
          if (paymentResponse.success && (paymentResponse.data?.clientSecret || paymentResponse.data?.paypalOrderId || paymentResponse.data?.alipayRedirectUrl)) {
            if (paymentResponse.data?.alreadyPaid) {
              setCheckoutPhase('success')
              setIsSubmitting(false)
              return
            }
            setPaymentData(paymentResponse.data)
            setCheckoutPhase('payment')
          } else {
            setError(paymentResponse.error?.message || '获取支付信息失败，请重试')
          }
        } catch (paymentError: any) {
          console.error('Failed to create payment intent:', paymentError)
          setError(paymentError?.message || '获取支付信息失败，请重试')
          setIsSubmitting(false)
          return
        }
      } else {
        if (validItems.length === 0) {
          setError('购物车为空，请先添加商品')
          setIsSubmitting(false)
          return
        }

        const orderData: CreateOrderRequest = {
          shippingAddressId: selectedShippingAddress,
          billingAddressId: selectedBillingAddress,
          shippingMethod,
          paymentProvider,
          discountCode: discountCode || undefined,
          notes: notes || undefined,
          currency: 'CNY',
        }

        const orderResponse = await orderApi.create(orderData)
        if (orderResponse.success) {
          const orderInfo = orderResponse.data
          setOrderResult(orderInfo)

          if (orderInfo.total <= 0) {
            setCheckoutPhase('success')
            setIsSubmitting(false)
            return
          }

          try {
            const paymentResponse = await paymentApi.createIntent(orderInfo.orderId, paymentProvider)
            if (paymentResponse.success) {
              if (paymentResponse.data?.alreadyPaid) {
                setCheckoutPhase('success')
                setIsSubmitting(false)
                return
              }
              setPaymentData(paymentResponse.data)
              setCheckoutPhase('payment')
            } else {
              setError('获取支付信息失败，请重试')
            }
          } catch (paymentError: any) {
            console.error('Failed to create payment intent:', paymentError)
            setError(paymentError?.message || '获取支付信息失败，请重试')
            setIsSubmitting(false)
            return
          }
        } else {
          setError('创建订单失败')
        }
      }
    } catch (error: any) {
      console.error('Failed to process order:', error)
      const message = error?.message || '处理订单失败'
      if (message === 'Session expired' || message.includes('401')) {
        navigate('/login', { replace: true })
        return
      }
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = async (_paymentIntentId: string) => {
    if (orderResult?.orderId) {
      try {
        await paymentApi.syncStatus(orderResult.orderId)
      } catch (e) {
        console.error('Failed to sync payment status:', e)
      }
    }
    setCheckoutPhase('success')
  }

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg)
  }

  const handlePaymentCancel = () => {
    if (orderResult?.orderId) {
      navigate(`/orders/${orderResult.orderId}`)
    } else {
      setCheckoutPhase('review')
      setPaymentData(null)
      setError(null)
    }
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  if (checkoutPhase === 'success' && orderResult) {
    return (
      <main className="min-h-screen bg-[#FAF7F2]">
        <div className="pt-24 pb-16 bg-[#F5F0E8]">
          <div className="mx-auto max-w-[1440px] px-8 text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">订单确认</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">订单确认</h1>
          </div>
        </div>

        <div className="mx-auto max-w-[600px] px-8 py-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-['Playfair_Display'] text-2xl text-[#3C2415] mb-2">订单创建成功</h2>
          <p className="text-sm text-[#3C2415]/60 mb-6">感谢您的购买，订单正在处理中</p>

          <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-[#3C2415]/60">订单号</span>
                <span className="text-sm font-medium text-[#3C2415]">{orderResult.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#3C2415]/60">订单金额</span>
                <span className="text-sm font-medium text-[#3C2415]">{formatPrice(orderResult.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#3C2415]/60">订单状态</span>
                <span className="text-sm text-[#C89460]">{orderResult.status}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/products')}
            >
              继续购物
            </Button>
            <Button
              onClick={() => navigate(`/orders/${orderResult.orderId}`)}
            >
              查看订单详情
            </Button>
          </div>
        </div>
      </main>
    )
  }

  if (existingOrderId && error) {
    return (
      <main className="min-h-screen bg-[#FAF7F2]">
        <div className="pt-24 pb-16 bg-[#F5F0E8]">
          <div className="mx-auto max-w-[1440px] px-8 text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">支付</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">完成支付</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[480px] px-8 py-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>返回</Button>
            <Button onClick={() => loadExistingOrder(existingOrderId!)}>重试</Button>
          </div>
        </div>
      </main>
    )
  }

  if (cartLoading || isLoadingOrder) {
    return (
      <main className="min-h-screen bg-[#FAF7F2]">
        <div className="pt-24 pb-16 bg-[#F5F0E8]">
          <div className="mx-auto max-w-[1440px] px-8 text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">结账</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">结账</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[1440px] px-8 py-12">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C89460] border-t-transparent"></div>
          </div>
        </div>
      </main>
    )
  }

  if (checkoutPhase === 'payment' && orderResult) {
    return (
      <main className="min-h-screen bg-[#FAF7F2]">
        <div className="pt-24 pb-16 bg-[#F5F0E8]">
          <div className="mx-auto max-w-[1440px] px-8 text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">支付</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">完成支付</h1>
          </div>
        </div>

        <div className="mx-auto max-w-[640px] px-8 py-12">
          {paymentData ? (
            <CheckoutErrorBoundary onBack={handlePaymentCancel}>
              {paymentData.alipayRedirectUrl ? (
                <AlipayPaymentForm
                  redirectUrl={paymentData.alipayRedirectUrl}
                  orderId={paymentData.orderId}
                  orderNumber={orderResult.orderNumber}
                  amount={paymentData.amount || orderResult.total}
                  currency={paymentData.currency || orderResult.currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              ) : paymentData.paypalOrderId ? (
                <PayPalPaymentForm
                  clientId={paymentData.publishableKey}
                  paypalOrderId={paymentData.paypalOrderId}
                  orderId={paymentData.orderId}
                  orderNumber={orderResult.orderNumber}
                  amount={paymentData.amount || orderResult.total}
                  currency={paymentData.currency || orderResult.currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              ) : (
                <StripePaymentForm
                  clientSecret={paymentData.clientSecret}
                  publishableKey={paymentData.publishableKey}
                  orderId={paymentData.orderId}
                  orderNumber={orderResult.orderNumber}
                  amount={paymentData.amount || orderResult.total}
                  currency={paymentData.currency || orderResult.currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              )}
            </CheckoutErrorBoundary>
          ) : (
            <div className="bg-white border border-[#3C2415]/10 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-[#3C2415] mb-2">支付服务加载中</p>
              <p className="text-xs text-[#3C2415]/50 mb-6">请确认已在后台配置有效的支付密钥</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={handlePaymentCancel}>
                  返回订单
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const paymentResponse = await paymentApi.createIntent(orderResult.orderId, paymentProvider)
                      if (paymentResponse.success && (paymentResponse.data?.clientSecret || paymentResponse.data?.paypalOrderId || paymentResponse.data?.alipayRedirectUrl)) {
                        if (paymentResponse.data?.alreadyPaid) {
                          setCheckoutPhase('success')
                          return
                        }
                        setPaymentData(paymentResponse.data)
                      } else {
                        setError(paymentResponse.error?.message || '获取支付信息失败，请确认已配置支付密钥')
                      }
                    } catch (e: any) {
                      setError(e?.message || '获取支付信息失败，请确认已配置支付密钥')
                    }
                  }}
                >
                  重试加载
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-500 hover:text-red-600 mt-2"
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-24 pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            {existingOrderId ? '返回订单详情' : '返回购物车'}
          </button>
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">{existingOrderId ? '支付' : '结账'}</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">{existingOrderId ? '完成支付' : '结账'}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-12">
        {validItems.length === 0 && !existingOrderId ? (
          <div className="text-center py-16">
            <p className="text-lg font-['Playfair_Display'] text-[#3C2415] mb-2">购物车是空的</p>
            <p className="text-sm text-[#3C2415]/50 mb-8">请先添加商品到购物车</p>
            <Button onClick={() => navigate('/products')}>
              去购物
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className={`bg-white border rounded-lg p-6 ${submitAttempted && !selectedShippingAddress ? 'border-red-300 bg-red-50/30' : 'border-[#3C2415]/10'}`}>
                <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-[#C89460]" />
                  配送地址
                </h3>

                {submitAttempted && !selectedShippingAddress && addresses.length > 0 && (
                  <p className="text-xs text-red-500 mb-4 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                    请勾选收货地址
                  </p>
                )}

                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#3C2415]/60 mb-4">暂无收货地址</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/addresses')}>
                      添加地址
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedShippingAddress === address.id
                            ? 'border-[#C89460] bg-[#FFF9F5]'
                            : 'border-[#3C2415]/10 hover:border-[#3C2415]/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingAddress"
                          value={address.id}
                          checked={selectedShippingAddress === address.id}
                          onChange={(e) => setSelectedShippingAddress(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#3C2415]">
                              {address.firstName} {address.lastName}
                            </span>
                            {address.isDefault && (
                              <span className="text-xs text-[#C89460]">默认</span>
                            )}
                          </div>
                          <p className="text-xs text-[#3C2415]/60 mt-1">
                            {address.line1} {address.line2}
                          </p>
                          <p className="text-xs text-[#3C2415]/60">
                            {address.city} {address.state} {address.postalCode} {address.country}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-[#C89460]" />
                  账单地址
                </h3>

                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBillingAddress === selectedShippingAddress}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBillingAddress(selectedShippingAddress)
                        } else {
                          setSelectedBillingAddress('')
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-[#3C2415]">与配送地址相同</span>
                  </label>
                </div>

                {selectedBillingAddress !== selectedShippingAddress && addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedBillingAddress === address.id
                            ? 'border-[#C89460] bg-[#FFF9F5]'
                            : 'border-[#3C2415]/10 hover:border-[#3C2415]/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="billingAddress"
                          value={address.id}
                          checked={selectedBillingAddress === address.id}
                          onChange={(e) => setSelectedBillingAddress(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-[#3C2415]">
                            {address.firstName} {address.lastName}
                          </span>
                          <p className="text-xs text-[#3C2415]/60 mt-1">
                            {address.line1} {address.line2}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
                  <Truck size={16} className="text-[#C89460]" />
                  配送方式
                </h3>

                <div className="space-y-3">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                        shippingMethod === method.value
                          ? 'border-[#C89460] bg-[#FFF9F5]'
                          : 'border-[#3C2415]/10 hover:border-[#3C2415]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method.value}
                          checked={shippingMethod === method.value}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <span className="text-sm font-medium text-[#3C2415]">{method.label}</span>
                          <p className="text-xs text-[#3C2415]/60">{method.desc}</p>
                        </div>
                      </div>
                      <span className="text-sm text-[#3C2415]">
                        {method.price === 0 ? '免费' : `$${method.price}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-[#C89460]" />
                  支付方式
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'stripe', label: 'Stripe', icon: '💳' },
                    { value: 'paypal', label: 'PayPal', icon: '🌐' },
                    { value: 'alipay', label: 'Alipay', icon: '🛒' },
                  ].map((provider) => (
                    <label
                      key={provider.value}
                      className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                        paymentProvider === provider.value
                          ? 'border-[#C89460] bg-[#FFF9F5]'
                          : 'border-[#3C2415]/10 hover:border-[#3C2415]/30'
                      }`}
                    >
                      <span className="text-2xl mb-2">{provider.icon}</span>
                      <input
                        type="radio"
                        name="paymentProvider"
                        value={provider.value}
                        checked={paymentProvider === provider.value}
                        onChange={(e) => setPaymentProvider(e.target.value as 'stripe' | 'paypal' | 'alipay')}
                        className="sr-only"
                      />
                      <span className="text-xs text-[#3C2415]">{provider.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs text-red-500 hover:text-red-600 mt-2"
                  >
                    关闭
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#F5F0E8] rounded-lg p-6 sticky top-24">
                <h3 className="text-sm font-medium text-[#3C2415] mb-4">订单摘要</h3>

                <div className="space-y-4">
                  {existingOrderId && orderResult ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-[#3C2415]/60">订单号</span>
                        <span className="text-xs font-medium text-[#3C2415]">{orderResult.orderNumber}</span>
                      </div>
                      <div className="border-b border-[#3C2415]/10 pb-4">
                        {orderItems.length > 0 ? (
                          orderItems.map((item) => (
                            <div key={item.id} className="flex gap-3 mb-3 last:mb-0">
                              <div className="w-16 h-16 bg-white flex-shrink-0">
                                {item.image && (
                                  <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#3C2415] truncate">{item.productName}</p>
                                <p className="text-xs text-[#3C2415]/40">{item.variantDescription}</p>
                                <div className="flex justify-between mt-1">
                                  <span className="text-xs text-[#3C2415]/60">x{item.quantity}</span>
                                  <span className="text-xs text-[#3C2415]">{formatPrice(item.totalPrice)}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#3C2415]/40">暂无商品信息</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="border-b border-[#3C2415]/10 pb-4">
                      {validItems.map((item) => (
                        <div key={item.id} className="flex gap-3 mb-3 last:mb-0">
                          <div className="w-16 h-16 bg-white flex-shrink-0">
                            {item.image && (
                              <img src={item.image} alt={item.productNameEn} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#3C2415] truncate">{item.productNameZh || item.productName}</p>
                            <p className="text-xs text-[#3C2415]/40">{item.colorName} / {item.size}</p>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-[#3C2415]/60">x{item.quantity}</span>
                              <span className="text-xs text-[#3C2415]">{formatPrice(item.totalPrice)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    {!existingOrderId && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#3C2415]/60">小计</span>
                          <span className="text-[#3C2415]">{formatPrice(validTotalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#3C2415]/60">运费</span>
                          <span className="text-[#3C2415]">
                            {shippingCost === 0 ? '免费' : formatPrice(shippingCost)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#3C2415]/60">税费</span>
                          <span className="text-[#3C2415]">{formatPrice(taxAmount)}</span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-[#3C2415]/10 pt-3 flex justify-between">
                      <span className="text-sm font-medium text-[#3C2415]">合计</span>
                      <span className="text-lg font-medium text-[#3C2415]">
                        {existingOrderId && orderResult ? formatPrice(orderResult.total) : formatPrice(orderTotal)}
                      </span>
                    </div>
                  </div>

                  {!existingOrderId && (
                    <>
                      <div className="mt-4">
                        <label className="flex items-center gap-2 text-xs text-[#3C2415]/60 mb-2">
                          <Gift size={14} />
                          优惠码
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="输入优惠码"
                            className="flex-1 px-3 py-2 text-sm border border-[#3C2415]/20 rounded-lg focus:outline-none focus:border-[#C89460]"
                          />
                          <Button variant="outline" size="sm">
                            应用
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="flex items-center gap-2 text-xs text-[#3C2415]/60 mb-2">
                          订单备注
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="如有特殊要求请备注"
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-[#3C2415]/20 rounded-lg focus:outline-none focus:border-[#C89460] resize-none"
                        />
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-6"
                    disabled={isSubmitting || addresses.length === 0 || !selectedShippingAddress || !selectedBillingAddress || !addresses.some(addr => addr.id === selectedShippingAddress) || !addresses.some(addr => addr.id === selectedBillingAddress)}
                  >
                    {isSubmitting ? '处理中...' : addresses.length === 0 ? '请先添加收货地址' : !selectedShippingAddress ? '请先勾选收货地址' : !selectedBillingAddress ? '请先选择账单地址' : (existingOrderId && orderResult ? `确认支付 ${formatPrice(orderResult.total)}` : `提交订单 ${formatPrice(orderTotal)}`)}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
