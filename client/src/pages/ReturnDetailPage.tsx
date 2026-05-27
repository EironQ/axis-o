import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { returnService, ReturnRequest } from '@/services/return'
import { uploadService } from '@/services/uploadService'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: '已批准', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: XCircle },
  processing: { label: '处理中', color: 'bg-purple-100 text-purple-700', icon: Clock },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600', icon: XCircle },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  return: { label: '退货', color: 'bg-orange-100 text-orange-700' },
  exchange: { label: '换货', color: 'bg-teal-100 text-teal-700' },
  refund: { label: '退款', color: 'bg-pink-100 text-pink-700' },
}

const reasonConfig: Record<string, string> = {
  defective: '商品质量问题',
  wrong_item: '发错商品',
  not_as_described: '与描述不符',
  changed_mind: '个人原因',
  arrived_late: '送达超时',
  other: '其他原因',
}

export default function ReturnDetailPage() {
  const { returnId } = useParams<{ returnId: string }>()
  const navigate = useNavigate()
  const [returnData, setReturnData] = useState<ReturnRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
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
    if (!returnId || !window.confirm('确定要取消这个退换货申请吗？')) return
    setIsCancelling(true)
    try {
      const response = await returnService.cancel(returnId)
      if (response.success) {
        navigate('/returns')
      } else {
        alert(response.error?.message || '取消失败')
      }
    } catch {
      alert('网络错误，请稍后重试')
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN', {
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
            重试
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
            onClick={() => navigate('/returns')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#8B7355] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回列表
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-[#3C2415] mb-3">退换货详情</h1>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${typeConfig[returnData.type]?.color}`}>
                  {typeConfig[returnData.type]?.label}申请
                </span>
                <span className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${statusConfig[returnData.status]?.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig[returnData.status]?.label}
                </span>
              </div>
            </div>
            {returnData.status === 'pending' && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isCancelling ? '取消中...' : '取消申请'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Package className="w-4 h-4" />
                订单信息
              </div>
              <p className="text-[#3C2415] font-medium">
                {returnData.orderNumber || returnData.orderId}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                申请时间
              </div>
              <p className="text-[#3C2415] font-medium">{formatDate(returnData.createdAt)}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium text-[#3C2415] mb-4">申请原因</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {reasonConfig[returnData.reason]}
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
            <h3 className="font-medium text-[#3C2415] mb-4">申请商品</h3>
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
                    <p className="text-gray-600">数量: {item.quantity}</p>
                    {item.newVariantId && (
                      <p className="text-sm text-blue-600 mt-1">更换规格</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {returnData.images && returnData.images.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-medium text-[#3C2415] mb-4">凭证图片</h3>
            <div className="grid grid-cols-3 gap-4">
              {returnData.images.map((image, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={image} alt={`凭证 ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {returnData.adminNote && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-medium text-[#3C2415] mb-2">管理员备注</h3>
            <p className="text-gray-600 bg-yellow-50 rounded-lg p-4">
              {returnData.adminNote}
            </p>
          </div>
        )}

        {returnData.logs && returnData.logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-[#3C2415] mb-4">处理日志</h3>
            <div className="space-y-3">
              {returnData.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8B7355] mt-2" />
                  <div className="flex-1">
                    <p className="text-[#3C2415]">
                      {log.action === 'created' && '创建申请'}
                      {log.action === 'status_changed' && `状态变更: ${log.fromStatus} → ${log.toStatus}`}
                      {log.action === 'note_added' && '添加备注'}
                      {log.action === 'image_added' && '上传图片'}
                      {log.action === 'refund_initiated' && '发起退款'}
                      {log.action === 'refund_completed' && '退款完成'}
                      {log.note && ` - ${log.note}`}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}