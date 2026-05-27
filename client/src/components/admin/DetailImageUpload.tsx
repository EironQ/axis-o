import { useRef, useState } from 'react'
import { uploadService } from '@/services/uploadService'
import { GripVertical } from 'lucide-react'

interface DetailImageItem {
  image: string
  title: string
  description: string
}

interface DetailImageUploadProps {
  images: DetailImageItem[]
  onChange: (images: DetailImageItem[]) => void
}

export default function DetailImageUpload({ images, onChange }: DetailImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter((f) => f.type.startsWith('image/'))
    if (validFiles.length !== files.length) {
      setError('请只选择图片文件')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const urls = await uploadService.uploadImages(validFiles)
      const newItems = urls.map((url) => ({
        image: url,
        title: '',
        description: '',
      }))
      onChange([...images, ...newItems])
    } catch (err: any) {
      setError(err.message || '上传失败，请重试')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const updateItem = (index: number, field: keyof DetailImageItem, value: string) => {
    const newItems = [...images]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange(newItems)
  }

  const removeItem = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const replaceImage = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    setIsUploading(true)
    setUploadingIndex(index)
    setError('')

    try {
      const urls = await uploadService.uploadImages([file])
      const newItems = [...images]
      newItems[index] = { ...newItems[index], image: urls[0] }
      onChange(newItems)
    } catch (err: any) {
      setError(err.message || '上传失败，请重试')
    } finally {
      setIsUploading(false)
      setUploadingIndex(null)
    }
  }

  return (
    <div>
      <div className="space-y-4">
        {images.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-gray-300" />
                <span className="text-sm font-medium text-gray-700">详情图 {index + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                删除
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">图片</label>
                <div className="flex items-center gap-3">
                  <div className="relative group w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={uploadService.getImageUrl(item.image)}
                      alt={`详情图 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/jpeg,image/png,image/gif,image/webp'
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) await replaceImage(index, file)
                        }
                        input.click()
                      }}
                      disabled={isUploading && uploadingIndex === index}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                    >
                      {isUploading && uploadingIndex === index ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <span className="text-xs text-white">替换</span>
                      )}
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(index, 'title', e.target.value)}
                      placeholder="输入标题，如：精妙内部分隔"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="输入详细描述文字，介绍这张图展示的商品细节..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="mt-3 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:border-[#C89460] hover:text-[#C89460] transition-colors disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#C89460] border-t-transparent"></div>
            <span className="text-sm">上传中...</span>
          </>
        ) : (
          <>
            <span className="text-lg leading-none">+</span>
            <span className="text-sm">添加详情图</span>
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-400 mt-2">支持 JPG、PNG、GIF、WebP 格式，建议图片比例为 4:3</p>
    </div>
  )
}
