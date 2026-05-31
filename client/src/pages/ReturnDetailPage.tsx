import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { returnService, ReturnRequest } from '@/services/return'
import { uploadService } from '@/services/uploadService'
import { useLanguage, useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n/types'

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
  processing: { color: 'bg-purple-100 text-purple-700', icon: Clock },
  completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { color: 'bg-gray-100 text-gray-600', icon: XCircle },
}

const typeConfig: Record<string, { color: string }> = {
  return: { color: 'bg-orange-100 text-orange-700' },
  exchange: { color: 'bg-teal-100 text-teal-700' },
  refund: { color: 'bg-pink-100 text-pink-700' },
}

export default function ReturnDetailPage() {
  const { returnId } = useParams<{ returnId: string }>()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { t } = useTranslation()
  const [returnData, setReturnData] = useState<ReturnRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate(`/${lang}/login`)
      return
    }
    if (returnId) {
      loadReturn(returnId)
    }
  }, [returnId])

  const loadReturn = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await returnService.getById(id)
      if (response.success && response.data) {
        setReturnData(response.data)
      } else {
        setError(response.error?.message || '加载退换货详情失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!returnId || !window.confirm(t('return.detail.confirmCancel'))) return
    setIsCancelling(true)
    try {
      const response = await returnService.cancel(returnId)
      if (response.success) {
        navigate(`/${lang}/returns`)
      } else {
        alert(response.error?.message || t('return.detail.cancelFailed'))
      }
    } catch {
      alert(lang === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again later')
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#8B7355] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-lg text-gray-700">{error}</p>
          <button
            onClick={() => returnId && loadReturn(returnId)}
            className="px-6 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5344] transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!returnData) {
    return null
  }

  const StatusIcon = statusConfig[returnData.status]?.icon || Clock

  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-24 pb-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/${lang}/returns`)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#8B7355] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('return.detail.backToList')}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-[#3C2415] mb-3">{t('return.detail.title')}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${typeConfig[returnData.type]?.color}`}>
                  {t(`return.type.${returnData.type}`)}{t('return.detail.request')}
                </span>
                <span className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${statusConfig[returnData.status]?.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {t(`return.status.${returnData.status}`)}
                </span>
              </div>
            </div>
            {returnData.status === 'pending' && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isCancelling ? t('return.detail.cancelling') : t('return.detail.cancel')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Package className="w-4 h-4" />
                {t('return.detail.orderInfo')}
              </div>
              <p className="text-[#3C2415] font-medium">
                {returnData.orderNumber || returnData.orderId}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                {t('return.detail.requestDate')}
              </div>
              <p className="text-[#3C2415] font-medium">{formatDate(returnData.createdAt)}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium text-[#3C2415] mb-4">{t('return.detail.reason')}</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {t(`return.reason.${returnData.reason}`)}
              </span>
            </div>
            {returnData.reasonDetail && (
              <p className="text-gray-600 bg-gray-50 rounded-lg p-4">
                {returnData.reasonDetail}
              </p>
            )}
          </div>
        </div>

        {returnData.items && returnData.items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-medium text-[#3C2415] mb-4">{t('return.detail.items')}</h3>
            <div className="space-y-4">
              {returnData.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={uploadService.getImageUrl(item.imageUrl)} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[#3C2415]">{item.productName}</h4>
                    {item.variantDescription && (
                      <p className="text-sm text-gray-500">{item.variantDescription}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">{t('return.detail.quantity')}: {item.quantity}</p>
                    {item.newVariantId && (
                      <p className="text-sm text-blue-600 mt-1">{t('return.detail.changeVariant')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {returnData.images && returnData.images.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-medium text-[#3C2415] mb-4">{t('return.detail.images')}</h3>
            <div className="grid grid-cols-3 gap-4">
              {returnData.images.map((image, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={image} alt={t('return.detail.imageAlt', { index: index + 1 })} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {returnData.adminNote && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-medium text-[#3C2415] mb-2">{t('return.detail.adminNote')}</h3>
            <p className="text-gray-600 bg-yellow-50 rounded-lg p-4">
              {returnData.adminNote}
            </p>
          </div>
        )}

        {returnData.logs && returnData.logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-[#3C2415] mb-4">{t('return.detail.logs')}</h3>
            <div className="space-y-3">
              {returnData.logs.map((log) => {
                const fromStatusLabel = log.fromStatus ? t(`return.status.${log.fromStatus}` as TranslationKey) : ''
                const toStatusLabel = log.toStatus ? t(`return.status.${log.toStatus}` as TranslationKey) : ''
                return (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8B7355] mt-2" />
                  <div className="flex-1">
                    <p className="text-[#3C2415]">
                      {log.action === 'created' && t('return.log.created')}
                      {log.action === 'status_changed' && t('return.log.statusChanged', { from: fromStatusLabel, to: toStatusLabel })}
                      {log.action === 'note_added' && t('return.log.noteAdded')}
                      {log.action === 'image_added' && t('return.log.imageAdded')}
                      {log.action === 'refund_initiated' && t('return.log.refundInitiated')}
                      {log.action === 'refund_completed' && t('return.log.refundCompleted')}
                      {log.note && ` - ${log.note}`}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}