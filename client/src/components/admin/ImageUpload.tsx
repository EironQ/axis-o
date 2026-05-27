import { useRef, useState } from 'react'
import { uploadService } from '@/services/uploadService'

interface ImageUploadProps {
  images: string[]
  onChange: (urls: string[]) => void
}

export default function ImageUpload({ images, onChange }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

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
      onChange([...images, ...urls])
    } catch (err: any) {
      setError(err.message || '上传失败，请重试')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={uploadService.getImageUrl(url)}
              alt={`商品图片 ${index + 1}`}
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#C89460] hover:text-[#C89460] transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#C89460] border-t-transparent"></div>
          ) : (
            <>
              <span className="text-2xl">+</span>
              <span className="text-xs mt-1">上传图片</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、GIF、WebP、SVG，单张不超过 10MB，最多 10 张</p>
    </div>
  )
}
