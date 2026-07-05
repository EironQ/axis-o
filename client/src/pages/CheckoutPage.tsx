import { useState, useEffect, Component } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MapPin, CreditCard, Truck, Gift, Globe } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useSettings } from '@/context/SettingsContext'
import { useTranslation, useLanguage } from '@/i18n'
import { orderApi, addressApi, paymentApi, CreateOrderRequest, UserAddress, PaymentIntentResponse } from '@/services/api'
import Button from '@/components/ui/Button'
import PayPalPaymentForm from '@/components/checkout/PayPalPaymentForm'
import RedirectPaymentForm from '@/components/checkout/RedirectPaymentForm'

class CheckoutErrorBoundary extends Component<
  { children: React.ReactNode; onBack: () => void; onRetry?: () => void; t: (key: string, params?: Record<string, string | number>) => string },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode; onBack: () => void; onRetry?: () => void; t: (key: string, params?: Record<string, string | number>) => string }) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message || 'Page failed to load' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 mb-2">{this.props.t('checkout.paymentLoadError')}</p>
          <p className="text-xs text-red-400 mb-4">{this.state.errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={this.props.onBack}>{this.props.t('checkout.backToOrder')}</Button>
            {this.props.onRetry && (
              <Button variant="primary" size="sm" onClick={() => { this.setState({ hasError: false, errorMessage: '' }); this.props.onRetry?.() }}>
                {this.props.t('common.retry')}
              </Button>
            )}
          </div>
        </div>
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
  const { store } = useSettings()
  const { t } = useTranslation()
  const { lang } = useLanguage()
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>('')
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<string>('')
  const [shippingMethod, setShippingMethod] = useState<string>('standard')
  const [paymentProvider, setPaymentProvider] = useState<'paypal' | 'lianlianpay'>('paypal')
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
      navigate(`/${lang}/login`, { replace: true })
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [checkoutPhase])

  const [orderItems, setOrderItems] = useState<any[]>([])

  const loadExistingOrder = async (orderId: string) => {
    setIsLoadingOrder(true)
    setError(null)
    try {
      const response = await orderApi.getById(orderId)
      if (!response.success || !response.data) {
        setError(t('checkout.orderLoadFail'))
        setIsLoadingOrder(false)
        return
      }
      const order = response.data
      const orderInfo = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total || 0),
        subtotal: Number(order.subtotal || 0),
        currency: order.currency || 'USD',
        status: order.status,
        shippingMethod: order.shippingMethod || 'standard',
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

      if (order.shippingMethod) {
        setShippingMethod(order.shippingMethod)
      }

      if (order.status === 'paid' || order.status === 'processing' || order.status === 'delivered') {
        setCheckoutPhase('success')
        setIsLoadingOrder(false)
        return
      }

      if (order.status === 'cancelled' || order.status === 'refunded') {
        setError(t('checkout.orderCancelled'))
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
                currency: refreshedOrder.data.currency || 'USD',
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
      setError(err?.message || t('checkout.orderLoadError'))
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

  const freeThreshold = (() => {
    const val = parseFloat(store.free_shipping_threshold)
    return isNaN(val) ? 200 : val
  })()
  const shippingFee = (() => {
    const val = parseFloat(store.shipping_fee)
    return isNaN(val) ? 50 : val
  })()
  const expressFee = (() => {
    const val = parseFloat(store.express_shipping_fee)
    return isNaN(val) ? 50 : val
  })()

  const validItems = items.filter(item => item.quantity > 0)
  const cartTotalPrice = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const effectiveSubtotal = existingOrderId && orderResult ? orderResult.subtotal : cartTotalPrice

  const baseShippingCost = effectiveSubtotal >= freeThreshold ? 0 : shippingFee
  const expediteFee = expressFee

  const shippingMethods = [
    { value: 'standard', label: t('checkout.standard'), desc: t('checkout.standardDesc'), price: baseShippingCost },
    { value: 'express', label: t('checkout.express'), desc: t('checkout.expressDesc'), price: expressFee },
  ]

  const selectedMethod = shippingMethods.find(m => m.value === shippingMethod)
  const shippingCost = selectedMethod?.price ?? 0
  const taxAmount = 0
  const orderTotal = parseFloat((effectiveSubtotal + shippingCost).toFixed(2))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (cartLoading) {
      setError(t('checkout.loadingCart'))
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSubmitAttempted(true)

    try {
      if (!selectedShippingAddress) {
        setError(t('checkout.selectShippingAddress'))
        setIsSubmitting(false)
        return
      }

      if (!selectedBillingAddress) {
        setError(t('checkout.selectBillingAddress'))
        setIsSubmitting(false)
        return
      }

      if (addresses.length === 0) {
        setError(t('checkout.addAddressFirst'))
        setIsSubmitting(false)
        return
      }

      const shippingAddressExists = addresses.some(addr => addr.id === selectedShippingAddress)
      if (!shippingAddressExists) {
        setError(t('checkout.addressNotFound'))
        setIsSubmitting(false)
        return
      }

      const billingAddressExists = addresses.some(addr => addr.id === selectedBillingAddress)
      if (!billingAddressExists) {
        setError(t('checkout.billingAddressNotFound'))
        setIsSubmitting(false)
        return
      }

      if (existingOrderId && orderResult) {
        try {
          const paymentResponse = await paymentApi.createIntent(orderResult.orderId, paymentProvider)
          if (paymentResponse.success && (paymentResponse.data?.paypalOrderId || paymentResponse.data?.lianlianpayRedirectUrl)) {
            if (paymentResponse.data?.alreadyPaid) {
              setCheckoutPhase('success')
              setIsSubmitting(false)
              return
            }
            setPaymentData(paymentResponse.data)
            setCheckoutPhase('payment')
          } else {
            setError('Failed to get payment info, please retry')
          }
        } catch (paymentError: any) {
          console.error('Failed to create payment intent:', paymentError)
          setError(paymentError?.message || 'Failed to get payment info, please retry')
          setIsSubmitting(false)
          return
        }
      } else {
        if (validItems.length === 0) {
          setError('Cart is empty, please add items first')
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
          currency: 'USD',
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
              setError('Failed to get payment info, please retry')
            }
          } catch (paymentError: any) {
            console.error('Failed to create payment intent:', paymentError)
            setError(paymentError?.message || 'Failed to get payment info, please retry')
            setIsSubmitting(false)
            return
          }
        } else {
          setError('Failed to create order')
        }
      }
    } catch (error: any) {
      console.error('Failed to process order:', error)
      const message = error?.message || 'Failed to process order'
      if (message === 'Session expired' || message.includes('401')) {
        navigate(`/${lang}/login`, { replace: true })
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
      navigate(`/${lang}/orders/${orderResult.orderId}`)
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
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">{t('checkout.orderConfirmation')}</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">{t('checkout.orderConfirmation')}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-[600px] px-8 py-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-['Playfair_Display'] text-2xl text-[#3C2415] mb-2">{t('checkout.orderCreated')}</h2>
          <p className="text-sm text-[#3C2415]/60 mb-6">{t('checkout.thankYou')}</p>

          <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-[#3C2415]/60">{t('checkout.orderNumber')}</span>
                <span className="text-sm font-medium text-[#3C2415]">{orderResult.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#3C2415]/60">{t('checkout.amount')}</span>
                <span className="text-sm font-medium text-[#3C2415]">{formatPrice(orderTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#3C2415]/60">{t('checkout.status')}</span>
                <span className="text-sm text-[#C89460]">{orderResult.status}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(`/${lang}/products`)}
            >
              {t('cart.continueShopping')}
            </Button>
            <Button
              onClick={() => navigate(`/${lang}/orders/${orderResult.orderId}`)}
            >
              {t('checkout.viewOrderDetails')}
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
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">{t('checkout.title')}</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">{t('checkout.completePayment')}</h1>
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
            <Button variant="outline" onClick={() => navigate(-1)}>{t('common.back')}</Button>
            <Button onClick={() => loadExistingOrder(existingOrderId!)}>{t('common.retry')}</Button>
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
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">{t('checkout.title')}</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">{t('checkout.title')}</h1>
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
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">{t('payment.method')}</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">{t('checkout.completePayment')}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-[640px] px-8 py-12">
          {paymentData ? (
            <CheckoutErrorBoundary t={t} onBack={handlePaymentCancel} onRetry={() => {
                setPaymentData(null)
                setError(null)
            }}>
              {paymentData.lianlianpayRedirectUrl ? (
                <RedirectPaymentForm
                  redirectUrl={paymentData.lianlianpayRedirectUrl}
                  orderId={paymentData.orderId}
                  orderNumber={orderResult.orderNumber}
                  amount={paymentData.amount || orderTotal}
                  currency={paymentData.currency || orderResult.currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                  provider="lianlianpay"
                />
              ) : paymentData.paypalOrderId ? (
                <PayPalPaymentForm
                  clientId={paymentData.publishableKey}
                  paypalOrderId={paymentData.paypalOrderId}
                  orderId={paymentData.orderId}
                  orderNumber={orderResult.orderNumber}
                  amount={paymentData.amount || orderTotal}
                  currency={paymentData.currency || orderResult.currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              ) : (
                <div className="text-center text-[#3C2415]/60 py-8">
                  <p>Payment method not available</p>
                </div>
              )}
            </CheckoutErrorBoundary>
          ) : (
            <div className="bg-white border border-[#3C2415]/10 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-[#3C2415] mb-2">Loading payment service</p>
              <p className="text-xs text-[#3C2415]/50 mb-6">Please ensure valid payment keys are configured in admin</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={handlePaymentCancel}>
                  Back to Order
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const paymentResponse = await paymentApi.createIntent(orderResult.orderId, paymentProvider)
                      if (paymentResponse.success && (paymentResponse.data?.paypalOrderId || paymentResponse.data?.lianlianpayRedirectUrl)) {
                        if (paymentResponse.data?.alreadyPaid) {
                          setCheckoutPhase('success')
                          return
                        }
                        setPaymentData(paymentResponse.data)
                      } else {
                        setError('Failed to get payment info, please verify payment keys')
                      }
                    } catch (e: any) {
                      setError(e?.message || 'Failed to get payment info, please verify payment keys')
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-600 font-medium">{t('payment.failed')}</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
            {existingOrderId ? 'Back to Order Details' : 'Back to Cart'}
          </button>
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">{t('checkout.title')}</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">{existingOrderId ? 'Complete Payment' : t('checkout.title')}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-12">
        {validItems.length === 0 && !existingOrderId ? (
          <div className="text-center py-16">
            <p className="text-lg font-['Playfair_Display'] text-[#3C2415] mb-2">{t('cart.empty')}</p>
            <p className="text-sm text-[#3C2415]/50 mb-8">{t('cart.emptyHint')}</p>
            <Button onClick={() => navigate(`/${lang}/products`)}>
              Shop Now
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className={`bg-white border rounded-lg p-6 ${submitAttempted && !selectedShippingAddress ? 'border-red-300 bg-red-50/30' : 'border-[#3C2415]/10'}`}>
                <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-[#C89460]" />
                  {t('checkout.shippingAddress')}
                </h3>

                {submitAttempted && !selectedShippingAddress && addresses.length > 0 && (
                  <p className="text-xs text-red-500 mb-4 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                    {t('checkout.selectShippingAddress')}
                  </p>
                )}

                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#3C2415]/60 mb-4">{t('checkout.addAddressFirst')}</p>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/${lang}/addresses`)}>
                      Add Address
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
                          onChange={(e) => {
                            const newAddressId = e.target.value
                            setSelectedShippingAddress(newAddressId)
                            if (selectedBillingAddress === selectedShippingAddress) {
                              setSelectedBillingAddress(newAddressId)
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#3C2415]">
                              {address.firstName} {address.lastName}
                            </span>
                            {address.phone && (
                              <span className="text-xs text-[#3C2415]/60">{address.phone}</span>
                            )}
                            {Boolean(address.isDefault) && (
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
                  {t('checkout.billingAddress')}
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
                    <span className="text-sm text-[#3C2415]">{t('checkout.sameAsShipping')}</span>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#3C2415]">
                              {address.firstName} {address.lastName}
                            </span>
                            {address.phone && (
                              <span className="text-xs text-[#3C2415]/60">{address.phone}</span>
                            )}
                            {Boolean(address.isDefault) && (
                              <span className="text-xs text-[#C89460]">默认</span>
                            )}
                          </div>
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
                  {t('checkout.shippingMethod')}
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
                        {method.price === 0 ? t('checkout.freeShipping') : `$${method.price}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-[#C89460]" />
                  {t('checkout.paymentMethod')}
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'paypal' as const, label: 'PayPal', Icon: Globe },
                  ].map((provider) => (
                    <label
                      key={provider.value}
                      className={`flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-all ${
                        paymentProvider === provider.value
                          ? 'border-[#C89460] bg-[#FFF9F5]'
                          : 'border-[#3C2415]/10 hover:border-[#3C2415]/30'
                      }`}
                    >
                      <provider.Icon className="w-5 h-5 text-[#C89460]" />
                      <span className="text-sm font-medium text-[#3C2415]">{provider.label}</span>
                      <input
                        type="radio"
                        name="paymentProvider"
                        value={provider.value}
                        checked={paymentProvider === provider.value}
                        onChange={(e) => setPaymentProvider(e.target.value as 'paypal' | 'lianlianpay')}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-red-600 font-medium">{t('payment.failed')}</p>
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#F5F0E8] rounded-lg p-6 sticky top-24">
                <h3 className="text-sm font-medium text-[#3C2415] mb-4">{t('cart.orderSummary')}</h3>

                <div className="space-y-4">
                  {existingOrderId && orderResult ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-[#3C2415]/60">Order No.</span>
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
                          <p className="text-xs text-[#3C2415]/40">No items info</p>
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
                    <div className="flex justify-between text-sm">
                      <span className="text-[#3C2415]/60">{t('cart.subtotal')}</span>
                      <span className="text-[#3C2415]">{formatPrice(effectiveSubtotal)}</span>
                    </div>
                    {shippingMethod === 'express' && expediteFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#3C2415]/60">{t('checkout.expediteFee')}</span>
                        <span className="text-[#3C2415]">{formatPrice(expediteFee)}</span>
                      </div>
                    )}
                    {shippingMethod === 'standard' && baseShippingCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#3C2415]/60">{t('cart.shipping')}</span>
                        <span className="text-[#3C2415]">{formatPrice(baseShippingCost)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#3C2415]/10 pt-3 flex justify-between">
                      <span className="text-sm font-medium text-[#3C2415]">{t('cart.total')}</span>
                      <span className="text-lg font-medium text-[#3C2415]">
                        {formatPrice(orderTotal)}
                      </span>
                    </div>
                  </div>

                  {!existingOrderId && (
                    <>
                      <div className="mt-4">
                        <label className="flex items-center gap-2 text-xs text-[#3C2415]/60 mb-2">
                          <Gift size={14} />
                          {t('checkout.discountCode')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder={t('checkout.discountPlaceholder')}
                            className="flex-1 px-3 py-2 text-sm border border-[#3C2415]/20 rounded-lg focus:outline-none focus:border-[#C89460]"
                          />
                          <Button variant="outline" size="sm">
                            {t('common.apply')}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="flex items-center gap-2 text-xs text-[#3C2415]/60 mb-2">
                          {t('checkout.notes')}
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={t('checkout.notesPlaceholder')}
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
                    {isSubmitting ? t('payment.processingBtn') : addresses.length === 0 ? t('checkout.addAddressFirst') : !selectedShippingAddress ? t('checkout.selectShippingAddress') : !selectedBillingAddress ? t('checkout.selectBillingAddress') : `${t('payment.confirmPay', { amount: formatPrice(orderTotal) })}`}
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
