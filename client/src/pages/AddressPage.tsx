import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  MapPin,
  Plus,
  Trash2,
  Check,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit2,
  X,
  ArrowLeft,
  MapPinOff,
} from 'lucide-react'
import { addressService, Address, CreateAddressRequest } from '@/services/address'
import { useSettings } from '@/context/SettingsContext'
import { useLanguage } from '@/i18n'

const countryNames: Record<string, string> = {
  CN: '中国', US: '美国', GB: '英国', DE: '德国', FR: '法国',
  JP: '日本', KR: '韩国', AU: '澳大利亚', CA: '加拿大', SG: '新加坡',
}

export default function AddressPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { store } = useSettings()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateAddressRequest>({
    type: 'shipping',
    firstName: '',
    lastName: '',
    line1: '',
    city: '',
    postalCode: '',
    country: 'CN',
  })

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate(`/${lang}/login`)
      return
    }
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    try {
      const response = await addressService.getAll()
      if (response.success && response.data) {
        setAddresses(response.data)
      }
    } catch {
      setMessage({ type: 'error', text: '加载地址失败' })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      type: 'shipping',
      firstName: '',
      lastName: '',
      line1: '',
      city: '',
      postalCode: '',
      country: 'CN',
    })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (editingId) {
        const response = await addressService.update(editingId, form)
        if (response.success) {
          await loadAddresses()
          setMessage({ type: 'success', text: '地址更新成功！' })
          setShowAddForm(false)
          resetForm()
        } else {
          setMessage({ type: 'error', text: response.error?.message || '更新失败' })
        }
      } else {
        const response = await addressService.create(form)
        if (response.success) {
          await loadAddresses()
          setMessage({ type: 'success', text: '地址添加成功！' })
          setShowAddForm(false)
          resetForm()
        } else {
          setMessage({ type: 'error', text: response.error?.message || '添加失败' })
        }
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingId(address.id)
    setForm({
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
    })
    setShowAddForm(true)
    setMessage(null)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await addressService.delete(id)
      if (response.success) {
        setAddresses(addresses.filter((a) => a.id !== id))
        setMessage({ type: 'success', text: '地址已删除' })
      } else {
        setMessage({ type: 'error', text: response.error?.message || '删除失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await addressService.setDefault(id)
      if (response.success) {
        setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })))
        setMessage({ type: 'success', text: '已设为默认地址' })
      } else {
        setMessage({ type: 'error', text: response.error?.message || '设置失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C89460] mx-auto" />
          <p className="mt-4 text-[#3C2415]/60">加载中...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-24 pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="max-w-[960px] mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              返回
            </button>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">{store.store_name}</p>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">我的地址</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-8 py-12">
        <div className="max-w-[960px] mx-auto">
          {message && (
            <div
              className={`mb-6 p-4 flex items-center gap-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle size={18} className="text-green-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-red-600 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <div className="bg-white border border-[#E5DDD3]">
            <div className="p-6 border-b border-[#E5DDD3] flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#3C2415]">
                管理收货地址（{addresses.length}）
              </h2>
              <button
                onClick={() => {
                  resetForm()
                  setShowAddForm(true)
                  setMessage(null)
                }}
                className="px-4 py-2 bg-[#3C2415] text-white text-sm font-medium hover:bg-[#2A1A0F] transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                添加地址
              </button>
            </div>

            {showAddForm && (
              <div className="p-6 border-b border-[#E5DDD3] bg-[#FAF7F2]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[#3C2415]">
                    {editingId ? '编辑地址' : '添加新地址'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      resetForm()
                    }}
                    className="text-[#3C2415]/60 hover:text-[#3C2415]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-1">名字 *</label>
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-1">姓氏 *</label>
                      <input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3C2415] mb-1">地址 *</label>
                    <input
                      type="text"
                      required
                      value={form.line1}
                      onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))}
                      placeholder="街道地址"
                      className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3C2415] mb-1">
                      地址二（选填）
                    </label>
                    <input
                      type="text"
                      value={form.line2 || ''}
                      onChange={(e) => setForm((p) => ({ ...p, line2: e.target.value }))}
                      placeholder="公寓、楼层等"
                      className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-1">城市 *</label>
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-1">省份/州</label>
                      <input
                        type="text"
                        value={form.state || ''}
                        onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-1">邮编 *</label>
                      <input
                        type="text"
                        required
                        value={form.postalCode}
                        onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-1">国家 *</label>
                      <select
                        value={form.country}
                        onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                      >
                        {Object.entries(countryNames).map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-1">手机号</label>
                      <input
                        type="tel"
                        value={form.phone || ''}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[#E5DDD3] bg-white focus:outline-none focus:border-[#C89460] transition-colors"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isDefault || false}
                      onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                      className="w-4 h-4 border-[#E5DDD3] text-[#C89460] focus:ring-[#C89460]"
                    />
                    <span className="text-sm text-[#3C2415]">设置为默认地址</span>
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-[#3C2415] text-white text-sm font-medium hover:bg-[#2A1A0F] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? '保存中...' : editingId ? '更新地址' : '添加地址'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        resetForm()
                      }}
                      className="px-6 py-2.5 border border-[#E5DDD3] text-[#3C2415] text-sm font-medium hover:bg-[#FAF7F2] transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-[#E5DDD3]">
              {addresses.length === 0 ? (
                <div className="p-16 text-center">
                  <MapPinOff className="w-16 h-16 text-[#C89460]/30 mx-auto mb-4" />
                  <p className="text-[#3C2415]/60 mb-2">暂无收货地址</p>
                  <p className="text-sm text-[#3C2415]/40 mb-6">添加地址以便快速下单</p>
                  <button
                    onClick={() => {
                      resetForm()
                      setShowAddForm(true)
                    }}
                    className="px-6 py-2.5 bg-[#3C2415] text-white text-sm font-medium hover:bg-[#2A1A0F] transition-colors"
                  >
                    添加地址
                  </button>
                </div>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-[#C89460] text-white text-xs font-medium rounded">
                              默认
                            </span>
                          )}
                          <span className="text-xs text-[#3C2415]/40">
                            {address.type === 'shipping' ? '收货地址' : '账单地址'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#3C2415]">
                            {address.firstName} {address.lastName}
                          </span>
                          {address.phone && (
                            <span className="text-sm text-[#3C2415]/50">{address.phone}</span>
                          )}
                        </div>
                        <p className="text-sm text-[#3C2415]/70">
                          {address.line1}
                          {address.line2 && `, ${address.line2}`}
                          <br />
                          {address.city}
                          {address.state && `, ${address.state}`}
                          &nbsp;{address.postalCode}
                          <br />
                          {countryNames[address.country] || address.country}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefault(address.id)}
                            className="px-3 py-1.5 text-xs border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1"
                          >
                            <Check size={12} />设为默认
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(address)}
                          className="px-3 py-1.5 text-xs border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1"
                        >
                          <Edit2 size={12} />编辑
                        </button>
                        <button
                          onClick={() => handleDelete(address.id)}
                          className="px-3 py-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={12} />删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
