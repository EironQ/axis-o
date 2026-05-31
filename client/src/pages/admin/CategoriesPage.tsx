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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        <p className="text-gray-500 mt-1">管理商品分类</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加分类
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">名称 (ZH)</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">名称 (EN)</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">排序</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">状态</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">商品数</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{category.nameZh}</td>
                <td className="py-3 px-4 text-gray-900">{category.nameEn}</td>
                <td className="py-3 px-4 text-gray-600">{category.sortOrder}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {category.isActive ? '活跃' : '禁用'}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{category.productCount || 0}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            暂无分类
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingCategory ? '编辑分类' : '添加分类'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">名称 (中文)</label>
                <input
                  type="text"
                  name="nameZh"
                  value={form.nameZh}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">名称 (英文)</label>
                <input
                  type="text"
                  name="nameEn"
                  value={form.nameEn}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                <input
                  type="number"
                  name="sortOrder"
                  value={form.sortOrder}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  name="isActive"
                  value={form.isActive}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>活跃</option>
                  <option value={0}>禁用</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCategory(null)
                    setForm(initialForm)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? '保存修改' : '添加'}
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
            <p className="mb-6">确定要删除分类「{selectedCategory.nameZh}」吗？此操作无法撤销。</p>
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