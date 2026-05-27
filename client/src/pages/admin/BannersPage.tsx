import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { bannerService, Banner } from '@/services/bannerService'
import { uploadService } from '@/services/uploadService'

interface BannerForm {
  image: string
  title: string
  subtitle: string
  link: string
  linkText: string
  tags: string
  sortOrder: number
  isActive: boolean
}

const emptyForm: BannerForm = {
  image: '',
  title: '',
  subtitle: '',
  link: '/products',
  linkText: 'Shop Now',
  tags: '',
  sortOrder: 0,
  isActive: true,
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerForm>(emptyForm)
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    setLoading(true)
    const result = await bannerService.list()
    if (result.success && result.data) {
      setBanners(result.data)
    }
    setLoading(false)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id)
    setForm({
      image: banner.image,
      title: banner.title,
      subtitle: banner.subtitle,
      link: banner.link,
      linkText: banner.linkText,
      tags: banner.tags ? banner.tags.join(', ') : '',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive === 1,
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    setIsUploading(true)
    setError('')
    try {
      const urls = await uploadService.uploadImages([file])
      setForm({ ...form, image: urls[0] })
    } catch (err: any) {
      setError(err.message || '上传失败')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!form.image) {
      setError('请上传Banner图片')
      return
    }
    if (!form.title) {
      setError('请输入标题')
      return
    }

    setSubmitting(true)
    setError('')

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      isActive: form.isActive ? 1 : 0,
    }

    let result: any
    if (editingId) {
      result = await bannerService.update(editingId, payload as any)
    } else {
      result = await bannerService.create(payload)
    }

    if (result.success) {
      setShowModal(false)
      loadBanners()
    } else {
      setError(result.error?.message || '操作失败')
    }
    setSubmitting(false)
  }

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`确定删除Banner「${banner.title}」？`)) return

    const result = await bannerService.delete(banner.id)
    if (result.success) {
      loadBanners()
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Banner 管理</h2>
            <p className="text-sm text-gray-500 mt-1">管理首页轮播图，最多可设置 8 个 Banner</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#C89460] text-white text-sm rounded-lg hover:bg-[#B07A4A] transition-colors"
          >
            + 新建 Banner
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C89460] border-t-transparent"></div>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <p className="text-gray-400 text-sm">暂无 Banner，点击上方按钮创建</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="w-48 h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={uploadService.getImageUrl(banner.image)}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{banner.title}</h3>
                        {banner.subtitle && (
                          <p className="text-sm text-gray-500 mt-1 truncate">{banner.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {banner.isActive ? '启用' : '停用'}
                        </span>
                        <span className="text-xs text-gray-400">排序: {banner.sortOrder}</span>
                        <button
                          onClick={() => openEdit(banner)}
                          className="text-sm text-[#C89460] hover:text-[#A67B4A]"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(banner)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>链接: {banner.link}</span>
                      <span>按钮: {banner.linkText}</span>
                      {banner.tags && banner.tags.length > 0 && (
                        <span>标签: {banner.tags.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingId ? '编辑 Banner' : '新建 Banner'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner 图片</label>
                  <div className="flex items-start gap-4">
                    <div className="w-56 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                      {form.image ? (
                        <img
                          src={uploadService.getImageUrl(form.image)}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                          暂无图片
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-[#C89460] hover:text-[#C89460] transition-colors disabled:opacity-50"
                      >
                        {isUploading ? '上传中...' : '上传图片'}
                      </button>
                      <p className="text-xs text-gray-400 mt-2">建议比例 16:9，推荐尺寸 1920x1080</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="如：Fashion That Feels Good & Does Good."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">副标题</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="如：Eco-friendly, ultra-durable, and thoughtfully designed..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">链接地址</label>
                    <input
                      type="text"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      placeholder="/products"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">按钮文字</label>
                    <input
                      type="text"
                      value={form.linkText}
                      onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                      placeholder="Shop the Collection"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签（逗号分隔）</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="Green Materials, Reinforced Stitches, 200g Lightweight"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">多个标签用逗号分隔，如不需要留空</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">数字越小越靠前</p>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">启用</span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {error}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-[#C89460] text-white text-sm rounded-lg hover:bg-[#B07A4A] transition-colors disabled:opacity-50"
                >
                  {submitting ? '保存中...' : editingId ? '保存修改' : '创建 Banner'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
