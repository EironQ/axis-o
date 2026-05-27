import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import ImageUpload from '@/components/admin/ImageUpload'
import DetailImageUpload from '@/components/admin/DetailImageUpload'
import { uploadService } from '@/services/uploadService'
import { adminProductService, AdminProduct } from '@/services/adminProductService'
import { categoryService, Category } from '@/services/categoryService'

type Series = 'classic' | 'luxe' | 'travel'

interface ProductFormData {
  name: string
  series: Series
  description: string
  descriptionEn: string
  descriptionZh: string
  price: number
  colors: { name: string; hex: string; imageIndex: number }[]
  sizes: string[]
  material: string
  images: string[]
  story: string
  storyEn: string
  storyZh: string
  isBestSeller: boolean
  category: string
  categoryId: string
  stock: number
  sales: number
  careInstructions: string
  detailImages: { image: string; title: string; description: string }[]
}

const seriesLabels: Record<string, string> = {
  classic: '经典系列',
  luxe: '轻奢系列',
  travel: '旅行系列',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    series: 'classic' as Series,
    description: '',
    descriptionEn: '',
    descriptionZh: '',
    price: 0,
    colors: [{ name: '', hex: '#000000', imageIndex: 0 }],
    sizes: [''],
    material: '',
    images: [],
    story: '',
    storyEn: '',
    storyZh: '',
    isBestSeller: false,
    category: '',
    categoryId: '',
    stock: 0,
    sales: 0,
    careInstructions: '',
    detailImages: [],
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const result = await adminProductService.getAll()
      if (result.success) {
        setProducts(result.data.products)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const result = await categoryService.getAll()
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchSeries = seriesFilter === 'all' || p.series === seriesFilter
    return matchSearch && matchSeries
  })

  const openCreateModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      series: 'classic' as Series,
      description: '',
      descriptionEn: '',
      descriptionZh: '',
      price: 0,
      colors: [{ name: '', hex: '#000000', imageIndex: 0 }],
      sizes: [''],
      material: '',
      images: [],
      story: '',
      storyEn: '',
      storyZh: '',
      isBestSeller: false,
      category: '',
      categoryId: '',
      stock: 0,
      sales: 0,
      careInstructions: '',
      detailImages: [],
    })
    setShowModal(true)
  }

  const openEditModal = async (product: AdminProduct) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || product.nameEn || '',
      series: product.series,
      description: product.description || product.descriptionEn || '',
      descriptionEn: product.descriptionEn || '',
      descriptionZh: product.descriptionZh || '',
      price: product.price,
      colors: product.colors || [{ name: '', hex: '#000000', imageIndex: 0 }],
      sizes: product.sizes || [''],
      material: product.material || '',
      images: product.images || [],
      story: product.story || product.storyEn || '',
      storyEn: product.storyEn || '',
      storyZh: product.storyZh || '',
      isBestSeller: product.isBestSeller || false,
      category: product.category || '',
      categoryId: product.categoryId || '',
      stock: product.stock || 0,
      sales: product.sales || 0,
      careInstructions: product.careInstructions || '',
      detailImages: product.detailImages || [],
    })
    setShowModal(true)

    const result = await adminProductService.getById(product.id)
    if (result.success && result.data) {
      setFormData((prev) => ({
        ...prev,
        detailImages: result.data.detailImages || [],
      }))
    }
  }

  const handleSubmit = async () => {
    setSubmitError('')
    setIsSubmitting(true)
    try {
      let result: { success: boolean; error?: { message: string } }
      if (editingProduct) {
        result = await adminProductService.update(editingProduct.id, formData)
      } else {
        result = await adminProductService.create(formData as any)
      }
      if (!result.success) {
        setSubmitError(result.error?.message || '操作失败')
        return
      }
      setShowModal(false)
      loadProducts()
    } catch (err: any) {
      setSubmitError(err.message || '操作失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    await adminProductService.delete(id)
    setDeleteConfirm(null)
    loadProducts()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="搜索商品名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
          />
          <select
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
          >
            <option value="all">全部系列</option>
            <option value="classic">经典系列</option>
            <option value="luxe">轻奢系列</option>
            <option value="travel">旅行系列</option>
          </select>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#C89460] text-white rounded-lg hover:bg-[#A67B4A] transition-colors"
        >
          + 新建商品
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C89460] border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">系列</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">销量</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    暂无商品数据
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          <img src={uploadService.getImageUrl(product.images[0] || '')} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#FFF5E6] text-[#C89460]">
                        {seriesLabels[product.series] || product.series}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${product.stock < 20 ? 'text-red-600' : 'text-gray-700'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.sales}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(product.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="px-3 py-1 text-sm text-[#C89460] hover:bg-[#FFF5E6] rounded transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingProduct ? '编辑商品' : '新建商品'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">系列</label>
                  <select
                    value={formData.series}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value as Series })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  >
                    <option value="classic">经典系列</option>
                    <option value="luxe">轻奢系列</option>
                    <option value="travel">旅行系列</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => {
                      const categoryId = e.target.value
                      const category = categories.find(c => c.id === categoryId)
                      setFormData({ 
                        ...formData, 
                        categoryId,
                        category: category?.nameZh || ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  >
                    <option value="">请选择分类</option>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameZh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">销量</label>
                  <input
                    type="number"
                    value={formData.sales}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">材质</label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  placeholder="如：意大利头层牛皮"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品牌故事</label>
                <textarea
                  value={formData.story}
                  onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品图片</label>
                <ImageUpload
                  images={formData.images}
                  onChange={(urls) => setFormData({ ...formData, images: urls })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">颜色配置</label>
                {formData.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => {
                        const newColors = [...formData.colors]
                        newColors[index] = { ...newColors[index], hex: e.target.value }
                        setFormData({ ...formData, colors: newColors })
                      }}
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={color.name}
                      onChange={(e) => {
                        const newColors = [...formData.colors]
                        newColors[index] = { ...newColors[index], name: e.target.value }
                        setFormData({ ...formData, colors: newColors })
                      }}
                      placeholder="颜色名称（如：经典黑）"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newColors = formData.colors.filter((_, i) => i !== index)
                        setFormData({ ...formData, colors: newColors.length > 0 ? newColors : [{ name: '', hex: '#000000', imageIndex: 0 }] })
                      }}
                      className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-sm flex-shrink-0"
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, colors: [...formData.colors, { name: '', hex: '#000000', imageIndex: 0 }] })}
                  className="text-sm text-[#C89460] hover:text-[#A67B4A] mt-1"
                >
                  + 添加颜色
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">尺码配置</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => {
                          const newSizes = [...formData.sizes]
                          newSizes[index] = e.target.value
                          setFormData({ ...formData, sizes: newSizes })
                        }}
                        placeholder="尺码"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent text-sm text-center"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSizes = formData.sizes.filter((_, i) => i !== index)
                          setFormData({ ...formData, sizes: newSizes.length > 0 ? newSizes : [''] })
                        }}
                        className="text-red-500 hover:bg-red-50 rounded px-1 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, sizes: [...formData.sizes, ''] })}
                  className="text-sm text-[#C89460] hover:text-[#A67B4A]"
                >
                  + 添加尺码
                </button>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">商品详情图</label>
                <p className="text-xs text-gray-400 mb-4">这些图片将展示在商品详情页面的「商品详情」区域，展示商品的细节、材质和使用场景。支持 JPG、PNG、GIF、WebP 格式。</p>
                <DetailImageUpload
                  images={formData.detailImages}
                  onChange={(images) => setFormData({ ...formData, detailImages: images })}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isBestSeller}
                  onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">设为热销商品</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              {submitError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {submitError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-[#C89460] text-white rounded-lg hover:bg-[#A67B4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '提交中...' : editingProduct ? '保存修改' : '创建商品'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">确定要删除该商品吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}