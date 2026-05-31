import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Lock,
  Package,
  MapPin,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit2,
  X,
  CreditCard,
  Truck,
  Calendar,
  PackageOpen,
} from 'lucide-react'
import { userService, UserProfile } from '@/services/user'
import { addressService, Address, CreateAddressRequest } from '@/services/address'
import { orderService, Order } from '@/services/order'
// import { wishlistService, WishlistItem } from '@/services/wishlist'
// import { useCartStore } from '@/store/cartStore'
import { useSettings } from '@/context/SettingsContext'
import { useLanguage, useTranslation } from '@/i18n'

type TabType = 'profile' | 'orders' | 'returns' | 'addresses' | 'wishlist' | 'password'

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700' },
  paid: { color: 'bg-blue-100 text-blue-700' },
  processing: { color: 'bg-purple-100 text-purple-700' },
  shipped: { color: 'bg-indigo-100 text-indigo-700' },
  delivered: { color: 'bg-green-100 text-green-700' },
  cancelled: { color: 'bg-gray-100 text-gray-700' },
  refunded: { color: 'bg-red-100 text-red-700' },
}

const formatPrice = (price: number) => {
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  // const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    preferredLanguage: 'en',
    preferredCurrency: 'USD',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({
    type: 'shipping',
    firstName: '',
    lastName: '',
    line1: '',
    city: '',
    postalCode: '',
    country: 'CN',
  })

  // const addToCart = useCartStore((s) => s.addItem)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate(`/${lang}/login`)
        return
      }

      const [profileRes, ordersRes, addressesRes] = await Promise.all([
        userService.getProfile(),
        orderService.getAll(),
        addressService.getAll(),
        // wishlistService.getAll(),
      ])

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data)
        setFormData({
          firstName: profileRes.data.firstName || '',
          lastName: profileRes.data.lastName || '',
          phone: profileRes.data.phone || '',
          preferredLanguage: profileRes.data.preferredLanguage || 'en',
          preferredCurrency: profileRes.data.preferredCurrency || 'USD',
        })
      }

      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data)
      }

      if (addressesRes.success && addressesRes.data) {
        setAddresses(addressesRes.data)
      }

      // if (wishlistRes.success && wishlistRes.data) {
      //   setWishlist(wishlistRes.data)
      // }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await userService.updateProfile(formData)
      if (response.success && response.data) {
        setProfile(response.data)
        setMessage({ type: 'success', text: '个人信息更新成功！' })
      } else {
        setMessage({ type: 'error', text: response.error?.message || '更新失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' })
      setIsSubmitting(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: '密码长度至少需要8位' })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (response.success) {
        setMessage({ type: 'success', text: '密码修改成功！' })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: response.error?.message || '修改失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await addressService.create(addressForm)
      if (response.success && response.data) {
        setAddresses([...addresses, response.data])
        setShowAddAddress(false)
        setAddressForm({
          type: 'shipping',
          firstName: '',
          lastName: '',
          line1: '',
          city: '',
          postalCode: '',
          country: 'CN',
        })
        setMessage({ type: 'success', text: '地址添加成功！' })
      } else {
        setMessage({ type: 'error', text: response.error?.message || '添加失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
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

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const response = await addressService.setDefault(id)
      if (response.success && response.data) {
        setAddresses(
          addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        )
        setMessage({ type: 'success', text: '已设为默认地址' })
      } else {
        setMessage({ type: 'error', text: response.error?.message || '设置失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    }
  }

  /*
  const handleRemoveWishlist = async (productId: string) => {
    try {
      const response = await wishlistService.remove(productId)
      if (response.success) {
        setWishlist(wishlist.filter((item) => item.productId !== productId))
        setMessage({ type: 'success', text: '已移除心愿单' })
      } else {
        setMessage({ type: 'error', text: response.error?.message || '移除失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    }
  }

  const handleAddToCartFromWishlist = async (item: WishlistItem) => {
    addToCart(item.productId, 1)
    handleRemoveWishlist(item.productId)
    setMessage({ type: 'success', text: '已添加到购物车' })
  }
  */

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
        <div className="mx-auto max-w-[1440px] px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">AXIS O</p>
          <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">{t('profile.title')}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white border border-[#E5DDD3] rounded-sm">
              <div className="p-6 border-b border-[#E5DDD3]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                    <User size={24} className="text-[#C89460]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#3C2415]">
                      {profile?.firstName} {profile?.lastName}
                    </h3>
                    <p className="text-sm text-[#3C2415]/60">{profile?.email}</p>
                  </div>
                </div>
              </div>

              <nav className="p-4">
                <ul className="space-y-1">
                  {[
                    { id: 'profile' as TabType, label: t('profile.menu.profile'), icon: User, link: null },
                    { id: 'orders' as TabType, label: t('profile.menu.orders'), icon: Package, link: '/orders' },
                    { id: 'addresses' as TabType, label: t('profile.menu.addresses'), icon: MapPin, link: '/addresses' },
                    { id: 'returns' as TabType, label: t('profile.menu.returns'), icon: PackageOpen, link: '/returns' },
                    { id: 'password' as TabType, label: t('profile.menu.password'), icon: Lock, link: null },
                  ].map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            if (item.link) {
                              navigate(`/${lang}${item.link}`)
                            } else {
                              setActiveTab(item.id)
                              setMessage(null)
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            isActive
                              ? 'bg-[#F5F0E8] text-[#C89460]'
                              : 'text-[#3C2415]/70 hover:bg-[#FAF7F2] hover:text-[#3C2415]'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {isActive && <ChevronRight size={16} />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>

            <div className="mt-6 p-6 bg-[#F5F0E8] border border-[#E5DDD3]">
              <h4 className="text-sm font-medium text-[#3C2415] mb-3">{t('profile.stats.title')}</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#3C2415]/60">{t('profile.stats.orders')}</span>
                  <span className="text-[#3C2415]">{orders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3C2415]/60">{t('profile.stats.addresses')}</span>
                  <span className="text-[#3C2415]">{addresses.length}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E5DDD3]">
                <div className="flex justify-between">
                  <span className="text-[#3C2415]/60">{t('profile.stats.joined')}</span>
                  <span className="text-[#3C2415] text-xs">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {message && (
              <div
                className={`p-4 flex items-center gap-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <AlertCircle size={18} className="text-red-600" />
                )}
                {message.text}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-[#E5DDD3]">
                <div className="p-6 border-b border-[#E5DDD3]">
                  <h2 className="text-lg font-medium text-[#3C2415]">{t('profile.menu.profile')}</h2>
                </div>
                <form onSubmit={handleInfoSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.form.firstName')}</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.form.lastName')}</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.form.email')}</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-[#E5DDD3] bg-[#F5F0E8] text-[#3C2415]/50 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-[#3C2415]/40">{t('profile.form.emailCannotChange')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.form.phone')}</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="+86 138 0000 0000"
                      className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.form.language')}</label>
                      <select
                        value={formData.preferredLanguage}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, preferredLanguage: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.form.currency')}</label>
                      <select
                        value={formData.preferredCurrency}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, preferredCurrency: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AUD">AUD ($)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-[#3C2415] text-white text-sm font-medium tracking-wider uppercase hover:bg-[#2A1A0F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        {t('profile.form.saving')}
                      </span>
                    ) : (
                      t('profile.form.saveChanges')
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white border border-[#E5DDD3]">
                <div className="p-6 border-b border-[#E5DDD3]">
                  <h2 className="text-lg font-medium text-[#3C2415]">{t('profile.orders.title')}</h2>
                </div>
                <div className="divide-y divide-[#E5DDD3]">
                  {orders.length === 0 ? (
                    <div className="p-12 text-center">
                      <PackageOpen className="w-16 h-16 text-[#C89460]/40 mx-auto mb-4" />
                      <p className="text-[#3C2415]/60">{t('profile.orders.noOrders')}</p>
                      <button
                        onClick={() => navigate(`/${lang}/products`)}
                        className="mt-4 px-6 py-2 border border-[#3C2415] text-[#3C2415] text-sm font-medium hover:bg-[#3C2415] hover:text-white transition-colors"
                      >
                        {t('profile.orders.goShopping')}
                      </button>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <div>
                            <span className="text-sm text-[#3C2415]/60">订单号:</span>
                            <span className="ml-2 text-[#3C2415] font-medium">
                              {order.orderNumber}
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              statusConfig[order.status].color
                            }`}
                          >
                            {t(`order.status.${order.status}`)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-[#3C2415]/60">{t('profile.orders.orderDate')}</span>
                            <span className="ml-1 text-[#3C2415]">
                              {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#3C2415]/60">{t('profile.orders.itemsCount')}</span>
                            <span className="ml-1 text-[#3C2415]">{order.items?.length ?? '-'}</span>
                          </div>
                          <div>
                            <span className="text-[#3C2415]/60">{t('profile.orders.paymentMethod')}</span>
                            <span className="ml-1 text-[#3C2415]">-</span>
                          </div>
                          <div>
                            <span className="text-[#3C2415]/60">{t('profile.orders.orderAmount')}</span>
                            <span className="ml-1 text-[#3C2415] font-medium">
                              {formatPrice(order.total)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button className="px-4 py-2 text-sm border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2">
                            <Package size={14} />
                            {t('profile.orders.viewDetails')}
                          </button>
                          {order.status === 'pending' && (
                            <button className="px-4 py-2 text-sm bg-[#3C2415] text-white hover:bg-[#2A1A0F] transition-colors flex items-center gap-2">
                              <CreditCard size={14} />
                              {t('profile.orders.payNow')}
                            </button>
                          )}
                          {order.status === 'paid' && (
                            <button className="px-4 py-2 text-sm border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2">
                              <Trash2 size={14} />
                              {t('profile.orders.cancelOrder')}
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button className="px-4 py-2 text-sm border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2">
                              <Truck size={14} />
                              {t('profile.orders.confirmReceipt')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white border border-[#E5DDD3]">
                <div className="p-6 border-b border-[#E5DDD3] flex items-center justify-between">
                  <h2 className="text-lg font-medium text-[#3C2415]">{t('profile.addresses.title')}</h2>
                  <button
                    onClick={() => {
                      setShowAddAddress(true)
                      setMessage(null)
                    }}
                    className="px-4 py-2 bg-[#3C2415] text-white text-sm font-medium hover:bg-[#2A1A0F] transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {t('profile.addresses.addNew')}
                  </button>
                </div>

                {showAddAddress && (
                  <div className="p-6 border-b border-[#E5DDD3]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-[#3C2415]">{t('profile.addresses.addNew')}</h3>
                      <button
                        onClick={() => setShowAddAddress(false)}
                        className="text-[#3C2415]/60 hover:text-[#3C2415]"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <form onSubmit={handleCreateAddress} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.firstName')}</label>
                          <input
                            type="text"
                            value={addressForm.firstName}
                            onChange={(e) =>
                              setAddressForm((prev) => ({ ...prev, firstName: e.target.value }))
                            }
                            className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.lastName')}</label>
                          <input
                            type="text"
                            value={addressForm.lastName}
                            onChange={(e) =>
                              setAddressForm((prev) => ({ ...prev, lastName: e.target.value }))
                            }
                            className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.line1')}</label>
                        <input
                          type="text"
                          value={addressForm.line1}
                          onChange={(e) =>
                            setAddressForm((prev) => ({ ...prev, line1: e.target.value }))
                          }
                          placeholder={t('profile.addresses.form.line1')}
                          className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.line2')}</label>
                        <input
                          type="text"
                          value={addressForm.line2 || ''}
                          onChange={(e) =>
                            setAddressForm((prev) => ({ ...prev, line2: e.target.value }))
                          }
                          placeholder={t('profile.addresses.form.line2')}
                          className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.city')}</label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm((prev) => ({ ...prev, city: e.target.value }))
                            }
                            className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.state')}</label>
                          <input
                            type="text"
                            value={addressForm.state || ''}
                            onChange={(e) =>
                              setAddressForm((prev) => ({ ...prev, state: e.target.value }))
                            }
                            className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.postalCode')}</label>
                          <input
                            type="text"
                            value={addressForm.postalCode}
                            onChange={(e) =>
                              setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))
                            }
                            className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.country')}</label>
                          <select
                            value={addressForm.country}
                            onChange={(e) =>
                              setAddressForm((prev) => ({ ...prev, country: e.target.value }))
                            }
                            className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                          >
                            <option value="CN">China</option>
                            <option value="US">United States</option>
                            <option value="GB">United Kingdom</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#3C2415] mb-1">{t('profile.addresses.form.phone')}</label>
                          <input
                            type="tel"
                            value={addressForm.phone || ''}
                            onChange={(e) =>
                              setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            className="w-full px-4 py-2 border border-[#E5DDD3] focus:outline-none focus:border-[#C89460]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault || false}
                          onChange={(e) =>
                            setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                          }
                          id="isDefault"
                        />
                        <label htmlFor="isDefault" className="text-sm text-[#3C2415]">
                          {t('profile.addresses.setDefault')}
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-[#3C2415] text-white text-sm font-medium hover:bg-[#2A1A0F] transition-colors"
                      >
                        {isSubmitting ? t('profile.form.saving') : t('profile.addresses.addNew')}
                      </button>
                    </form>
                  </div>
                )}

                <div className="divide-y divide-[#E5DDD3]">
                  {addresses.length === 0 ? (
                    <div className="p-12 text-center">
                      <MapPin className="w-16 h-16 text-[#C89460]/40 mx-auto mb-4" />
                      <p className="text-[#3C2415]/60">{t('profile.addresses.noAddresses')}</p>
                    </div>
                  ) : (
                    addresses.map((address) => (
                      <div key={address.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {address.isDefault && (
                              <span className="inline-block px-2 py-0.5 bg-[#C89460] text-white text-xs rounded mb-2">
                                {t('profile.addresses.default')}
                              </span>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-[#3C2415]">
                                {address.firstName} {address.lastName}
                              </span>
                              {address.phone && (
                                <span className="text-sm text-[#3C2415]/60">{address.phone}</span>
                              )}
                            </div>
                            <p className="text-sm text-[#3C2415]/80">
                              {address.line1}
                              {address.line2 && `, ${address.line2}`}
                              <br />
                              {address.city}
                              {address.state && `, ${address.state}`}
                              {address.postalCode && ` ${address.postalCode}`}
                              <br />
                              {address.country === 'CN' ? 'China' : address.country === 'US' ? 'United States' : address.country === 'GB' ? 'United Kingdom' : address.country === 'DE' ? 'Germany' : address.country === 'FR' ? 'France' : address.country}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(address.id)}
                                className="px-3 py-1 text-xs border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1"
                              >
                                <Check size={12} />
                                {t('profile.addresses.setDefault')}
                              </button>
                            )}
                            <button className="px-3 py-1 text-xs border border-[#E5DDD3] text-[#3C2415] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1">
                              <Edit2 size={12} />
                              {t('profile.addresses.edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="px-3 py-1 text-xs border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                              {t('profile.addresses.delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white border border-[#E5DDD3]">
                <div className="p-6 border-b border-[#E5DDD3]">
                  <h2 className="text-lg font-medium text-[#3C2415]">{t('profile.password.title')}</h2>
                </div>
                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.password.current')}</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                      placeholder={t('profile.password.currentPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.password.new')}</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                      placeholder={t('profile.password.newPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#3C2415] mb-2">{t('profile.password.confirm')}</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                      placeholder={t('profile.password.confirmPlaceholder')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-[#3C2415] text-white text-sm font-medium tracking-wider uppercase hover:bg-[#2A1A0F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        {t('profile.password.changing')}
                      </span>
                    ) : (
                      t('profile.password.change')
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
