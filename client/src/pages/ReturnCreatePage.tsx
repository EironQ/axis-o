import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Package, Upload, Plus, X, CheckCircle, AlertCircle } from 'lucide-react'
import { orderService, Order } from '@/services/order'
import { returnService, CreateReturnInput } from '@/services/return'
import { useLanguage, useTranslation } from '@/i18n'

export default function ReturnCreatePage() {
  const { orderId: initialOrderId } = useParams<{ orderId?: string }>()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { t } = useTranslation()
  
  const typeOptions = [
    { value: 'return', label: t('return.type.return'), description: t('return.create.typeReturnDesc') },
    { value: 'exchange', label: t('return.type.exchange'), description: t('return.create.typeExchangeDesc') },
    { value: 'refund', label: t('return.type.refund'), description: t('return.create.typeRefundDesc') },
  ]

  const reasonOptions = [
    { value: 'defective', label: t('return.reason.defective'), description: t('return.reason.defective') },
    { value: 'wrong_item', label: t('return.reason.wrong_item'), description: t('return.reason.wrong_item') },
    { value: 'not_as_described', label: t('return.reason.not_as_described'), description: t('return.reason.not_as_described') },
    { value: 'changed_mind', label: t('return.reason.changed_mind'), description: t('return.reason.changed_mind') },
    { value: 'arrived_late', label: t('return.reason.arrived_late'), description: t('return.reason.arrived_late') },
    { value: 'other', label: t('return.reason.other'), description: t('return.reason.other') },
  ]
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedItems, setSelectedItems] = useState<Array<{ orderItemId: string; quantity: number; newVariantId?: string }>>([])
  const [formData, setFormData] = useState({
    type: 'return' as 'return' | 'exchange' | 'refund',
    reason: '' as string,
    reasonDetail: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate(`/${lang}/login`)
      return
    }
    loadOrders()
  }, [])

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const order = orders.find((o) => o.id === initialOrderId)
      if (order) {
        loadOrderDetail(order)
      }
    }
  }, [initialOrderId, orders])

  const loadOrderDetail = async (order: Order) => {
    setIsLoadingOrder(true)
    try {
      const response = await orderService.getById(order.id)
      if (response.success && response.data) {
        const fullOrder = response.data
        setSelectedOrder(fullOrder)
        if (fullOrder.items && fullOrder.items.length > 0) {
          setSelectedItems(fullOrder.items.map((item) => ({ orderItemId: item.id, quantity: item.quantity })))
        } else {
          setSelectedItems([])
        }
      }
    } catch {
      setError(t('return.error.loadDetailFailed'))
    } finally {
      setIsLoadingOrder(false)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await orderService.getAll()
      if (response.success && response.data) {
        const eligibleOrders = response.data.filter((order) => 
          order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered'
        )
        setOrders(eligibleOrders)
      }
    } catch {
      setError(t('return.error.loadFailed'))
    }
  }

  const handleOrderSelect = async (order: Order) => {
    loadOrderDetail(order)
  }

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const newItems = [...selectedItems]
    const orderItem = selectedOrder?.items?.find((item) => item.id === newItems[index].orderItemId)
    if (orderItem) {
      newItems[index].quantity = Math.max(1, Math.min(quantity, orderItem.quantity))
    }
    setSelectedItems(newItems)
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*'
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach((file) => {
          const reader = new FileReader()
          reader.onload = (event) => {
            const result = event.target?.result as string
            if (result && images.length < 5) {
              setImages([...images, result])
            }
          }
          reader.readAsDataURL(file)
        })
      }
    }
    input.click()
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!selectedOrder || selectedItems.length === 0 || !formData.reason) {
      setError(t('return.create.orderRequired'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const input: CreateReturnInput = {
        orderId: selectedOrder.id,
        type: formData.type,
        reason: formData.reason as CreateReturnInput['reason'],
        reasonDetail: formData.reasonDetail,
        images: images.length > 0 ? images : undefined,
        items: selectedItems.filter((item) => item.quantity > 0),
      }

      const response = await returnService.create(input)
      if (response.success) {
        setSuccess(true)
      } else {
        setError(response.error?.message || t('return.create.failed'))
      }
    } catch {
      setError(lang === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again later')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center pt-20">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#3C2415] mb-2">{t('return.create.success')}</h2>
          <p className="text-gray-600 mb-6">
            {lang === 'zh' ? '您的退换货申请已提交，我们会尽快处理并通过邮件通知您审核结果。' : 'Your return request has been submitted. We will process it and notify you by email.'}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/${lang}/returns`)}
              className="flex-1 px-6 py-3 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5344] transition-colors"
            >
              {lang === 'zh' ? '查看申请记录' : 'View Request History'}
            </button>
            <button
              onClick={() => navigate(`/${lang}/orders`)}
              className="flex-1 px-6 py-3 border border-[#8B7355] text-[#8B7355] rounded-lg hover:bg-[#8B7355] hover:text-white transition-colors"
            >
              {lang === 'zh' ? '返回订单列表' : 'Back to Orders'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-24 pb-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/${lang}/returns`)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#8B7355] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-bold text-[#3C2415] mb-2">{t('return.create.title')}</h1>
          <p className="text-gray-500 mb-6">{lang === 'zh' ? '请填写以下信息提交退换货申请' : 'Please fill in the following information to submit your return request'}</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#3C2415] mb-3">{t('return.create.selectOrder')}</label>
            {orders.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                {lang === 'zh' ? '暂无可申请退换货的订单' : 'No orders eligible for return'}
              </div>
            ) : (
              <div className="grid gap-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => !isLoadingOrder && handleOrderSelect(order)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedOrder?.id === order.id
                        ? 'border-[#8B7355] bg-[#8B7355]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isLoadingOrder ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#3C2415]">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          订单金额: ${order.total}
                        </p>
                      </div>
                      {selectedOrder?.id === order.id && (
                        <CheckCircle className="w-5 h-5 text-[#8B7355]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedOrder && selectedOrder.items && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#3C2415] mb-3">
                {lang === 'zh' ? '选择商品' : 'Select Items'} ({selectedItems.filter((item) => item.quantity > 0).length}/{selectedOrder.items.length})
              </label>
              {isLoadingOrder ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#8B7355] border-t-transparent"></div>
                </div>
              ) : (
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => {
                  const selectedItem = selectedItems.find((si) => si.orderItemId === item.id)
                  return (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-[#3C2415]">{item.productName}</h4>
                          {item.variantDescription && (
                            <p className="text-sm text-gray-500">{item.variantDescription}</p>
                          )}
                          <p className="text-sm text-gray-600">{lang === 'zh' ? '单价' : 'Unit Price'}: ${item.unitPrice}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleItemQuantityChange(index, (selectedItem?.quantity || 0) - 1)}
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{selectedItem?.quantity || 0}</span>
                          <button
                            onClick={() => handleItemQuantityChange(index, (selectedItem?.quantity || 0) + 1)}
                            className="w-8 h-8 rounded-full bg-[#8B7355] text-white flex items-center justify-center hover:bg-[#6B5344]"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#3C2415] mb-3">{t('return.create.selectType')}</label>
            <div className="grid grid-cols-3 gap-3">
              {typeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setFormData({ ...formData, type: option.value as typeof formData.type })}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    formData.type === option.value
                      ? 'border-[#8B7355] bg-[#8B7355]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-[#3C2415]">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#3C2415] mb-3">{t('return.create.selectReason')}</label>
            <div className="grid grid-cols-2 gap-3">
              {reasonOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setFormData({ ...formData, reason: option.value })}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.reason === option.value
                      ? 'border-[#8B7355] bg-[#8B7355]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-[#3C2415] text-sm">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#3C2415] mb-3">{t('return.create.addDetails')}</label>
            <textarea
              value={formData.reasonDetail}
              onChange={(e) => setFormData({ ...formData, reasonDetail: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-transparent resize-none"
              placeholder={lang === 'zh' ? '请描述具体情况，以便我们更好地处理您的申请...' : 'Please describe the details so we can better process your request...'}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#3C2415] mb-3">
              {t('return.create.uploadImages')}
            </label>
            <div className="grid grid-cols-5 gap-3">
              {images.map((image, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                  <img src={image} alt={`${lang === 'zh' ? '凭证' : 'Evidence'} ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={handleImageUpload}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-[#8B7355] hover:bg-[#8B7355]/5 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">{lang === 'zh' ? '上传' : 'Upload'}</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedOrder || selectedItems.filter((item) => item.quantity > 0).length === 0 || !formData.reason}
            className="w-full py-3 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5344] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('return.create.submitting') : t('return.create.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}