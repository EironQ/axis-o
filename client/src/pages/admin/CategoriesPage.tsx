import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'

const API_BASE = '/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export interface Category {
  id: string
  nameEn: string
  nameZh: string
  slug: string
  imageUrl: string | null
  sortOrder: number
  isActive: number
  createdAt: string
  updatedAt: string
  productCount?: number
}

interface CategoryForm {
  nameEn: string
  nameZh: string
  slug: string
  imageUrl: string
  sortOrder: number
  isActive: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formData, setFormData] = useState<CategoryForm>({
    nameEn: '',
    nameZh: '',
    slug: '',
    imageUrl: '',
    sortOrder: 0,
    isActive: 1,
  })
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadCategories = useCallback(async (page: number = 1, search: string = '') => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (search) params.append('search', search)

      const response = await fetch(`${API_BASE}/categories?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setCategories(result.data.categories)
        setTotalPages(result.data.pagination.totalPages)
        setTotalCount(result.data.pagination.total)
      }
    } catch (err: any) {
      showToastMessage('error', err.message || '加载分类失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories(1, searchTerm)
  }, [])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1)
      loadCategories(1, searchTerm)
    }, 400)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchTerm, loadCategories])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadCategories(page, searchTerm)
  }

  const handleCreate = () => {
    setFormData({
      nameEn: '',
      nameZh: '',
      slug: '',
      imageUrl: '',
      sortOrder: 0,
      isActive: 1,
    })
    setShowCreateModal(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      nameEn: category.nameEn,
      nameZh: category.nameZh,
      slug: category.slug,
      imageUrl: category.imageUrl || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    })
    setShowEditModal(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteConfirm(true)
  }

  const handleToggleStatus = async (category: Category) => {
    try {
      const response = await fetch(`${API_BASE}/categories/${category.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: category.isActive === 1 ? 0 : 1 }),
      })
      const result = await response.json()
      if (result.success) {
        showToastMessage('success', '状态更新成功')
        loadCategories(currentPage, searchTerm)
      } else {
        showToastMessage('error', result.error?.message || '更新失败')
      }
    } catch (err: any) {
      showToastMessage('error', err.message || '更新失败')
    }
  }

  const handleSubmit = async (isCreate: boolean) => {
    try {
      const url = isCreate ? `${API_BASE}/categories` : `${API_BASE}/categories/${selectedCategory!.id}`
      const method = isCreate ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage('success', isCreate ? '创建成功' : '更新成功')
        setShowCreateModal(false)
        setShowEditModal(false)
        loadCategories(1, searchTerm)
      } else {
        showToastMessage('error', result.error?.message || (isCreate ? '创建失败' : '更新失败'))
      }
    } catch (err: any) {
      showToastMessage('error', err.message || (isCreate ? '创建失败' : '更新失败'))
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories/${selectedCategory!.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage('success', '删除成功')
        setShowDeleteConfirm(false)
        loadCategories(1, searchTerm)
      } else {
        showToastMessage('error', result.error?.message || '删除失败')
      }
    } catch (err: any) {
      showToastMessage('error', err.message || '删除失败')
    }
  }

  return (
    <AdminLayout>
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">分类管理</h2>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#C89460] text-white rounded-lg hover:bg-[#B88450] transition-colors"
          >
            + 添加分类
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="搜索分类..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">加载中...</div>
        ) : (
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">排序</th>
                  <th className="text-left py-3 px-4 font-semibold">中文名称</th>
                  <th className="text-left py-3 px-4 font-semibold">英文名称</th>
                  <th className="text-left py-3 px-4 font-semibold">Slug</th>
                  <th className="text-center py-3 px-4 font-semibold">状态</th>
                  <th className="text-center py-3 px-4 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">暂无数据</td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">{category.sortOrder}</td>
                      <td className="py-3 px-4 font-medium">{category.nameZh}</td>
                      <td className="py-3 px-4 text-gray-600">{category.nameEn}</td>
                      <td className="py-3 px-4 text-gray-600">{category.slug}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            category.isActive === 1
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {category.isActive === 1 ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(category)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          >
                            {category.isActive === 1 ? '禁用' : '启用'}
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
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

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              {showCreateModal ? '创建分类' : '编辑分类'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(showCreateModal) }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">中文名称 *</label>
                  <input
                    type="text"
                    value={formData.nameZh}
                    onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">英文名称 *</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">分类图片</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="图片URL"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">排序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">状态</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460]"
                  >
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false) }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C89460] text-white rounded-lg hover:bg-[#B88450] transition-colors"
                >
                  {showCreateModal ? '创建' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">确认删除</h3>
            <p className="mb-6">
              确定要删除分类「{selectedCategory.nameZh}」吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}