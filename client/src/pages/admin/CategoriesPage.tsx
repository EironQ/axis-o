import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'

const API_BASE = '/api'

export interface Category {
  id: string
  nameEn: string
  nameZh: string
  sortOrder: number
  isActive: number
  createdAt: string
  updatedAt: string
  productCount?: number
}

interface CategoryForm {
  nameEn: string
  nameZh: string
  sortOrder: number
  isActive: number
}

const initialForm: CategoryForm = {
  nameEn: '',
  nameZh: '',
  sortOrder: 0,
  isActive: 1,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(initialForm)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [error, setError] = useState<string>('')

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() })
      const result = await response.json()
      if (result.success) {
        setCategories(result.data.categories || [])
      }
    } catch (err) {
      setError('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const options = {
        method: editingCategory ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      }
      const url = editingCategory ? `${API_BASE}/categories/${editingCategory.id}` : `${API_BASE}/categories`
      await fetch(url, options)
      setShowForm(false)
      setEditingCategory(null)
      setForm(initialForm)
      await fetchCategories()
    } catch (err) {
      setError('Failed to save category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setForm({
      nameEn: category.nameEn,
      nameZh: category.nameZh,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    })
    setShowForm(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return
    setError('')
    try {
      await fetch(`${API_BASE}/categories/${selectedCategory.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      setShowDeleteConfirm(false)
      setSelectedCategory(null)
      await fetchCategories()
    } catch (err) {
      setError('Failed to delete category')
    }
  }

  const handleAdd = () => {
    setEditingCategory(null)
    setForm(initialForm)
    setShowForm(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }))
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C89460] border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
          <p className="text-gray-500 mt-1 text-sm">管理商品分类</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-[#C89460] text-white rounded-lg hover:bg-[#A67B4A] transition-colors"
        >
          + 添加分类
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称 (ZH)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称 (EN)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  暂无分类
                </td>
              </tr>
            ) : (
              categories.map(category => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.nameZh}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{category.nameEn}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{category.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${category.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {category.isActive ? '活跃' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{category.productCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 text-sm text-[#C89460] hover:bg-[#FFF5E6] rounded transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{editingCategory ? '编辑分类' : '添加分类'}</h3>
              <button onClick={() => { setShowForm(false); setEditingCategory(null); setForm(initialForm) }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称 (中文)</label>
                  <input
                    type="text"
                    name="nameZh"
                    value={form.nameZh}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称 (英文)</label>
                  <input
                    type="text"
                    name="nameEn"
                    value={form.nameEn}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={form.sortOrder}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    name="isActive"
                    value={form.isActive}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                  >
                    <option value={1}>活跃</option>
                    <option value={0}>禁用</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCategory(null)
                    setForm(initialForm)
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-[#C89460] text-white rounded-lg hover:bg-[#A67B4A] transition-colors"
                >
                  {editingCategory ? '保存修改' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">确定要删除分类「{selectedCategory.nameZh}」吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
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