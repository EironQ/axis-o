import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ArrowRight, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { returnService, ReturnRequest } from '@/services/return'
import { useLanguage, useTranslation } from '@/i18n'

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

export default function ReturnListPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { t } = useTranslation()
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate(`/${lang}/login`)
      return
    }
    loadReturns()
  }, [])

  const loadReturns = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await returnService.getAll()
      if (response.success && response.data) {
        setReturns(response.data)
      } else {
        setError(response.error?.message || '加载退换货记录失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
            onClick={loadReturns}
            className="px-6 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5344] transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-24 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#3C2415]">{t('return.list.title')}</h1>
            <p className="text-gray-500 mt-1">{t('return.list.subtitle')}</p>
          </div>
        </div>

        {returns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">{t('return.list.noRecords')}</h3>
            <p className="text-gray-500">{t('return.list.noRecordsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((returnItem) => {
              const StatusIcon = statusConfig[returnItem.status]?.icon || Clock
              return (
                <div
                  key={returnItem.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/${lang}/returns/${returnItem.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeConfig[returnItem.type]?.color}`}>
                          {t(`return.type.${returnItem.type}`)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig[returnItem.status]?.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {t(`return.status.${returnItem.status}`)}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm">
                        <span>{t('return.orderNumber')}: {returnItem.orderNumber || returnItem.orderId}</span>
                        <span className="mx-2">|</span>
                        <span>{t('return.requestDate')}: {formatDate(returnItem.createdAt)}</span>
                      </div>
                      {returnItem.reasonDetail && (
                        <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                          {returnItem.reasonDetail}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}