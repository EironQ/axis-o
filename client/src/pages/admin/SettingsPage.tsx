import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { uploadService } from '@/services/uploadService'

interface SettingItem {
  id: string
  key: string
  value: string
  group: string
  description: string
  updatedAt: string
}

interface TabConfig {
  id: string
  label: string
  icon: string
  fields: { key: string; label: string; type: 'text' | 'email' | 'number' | 'password' | 'select' | 'image' | 'textarea'; placeholder?: string; options?: { label: string; value: string }[]; accept?: string }[]
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

const tabConfigs: TabConfig[] = [
  {
    id: 'general',
    label: '店铺信息',
    icon: '🏪',
    fields: [
      { key: 'store_name', label: '店铺名称', type: 'text', placeholder: '输入店铺名称' },
      { key: 'store_logo', label: '店铺Logo', type: 'image', accept: 'image/png,image/jpeg,image/webp,image/svg+xml' },
      { key: 'store_favicon', label: 'Favicon', type: 'image', accept: 'image/png,image/x-icon,image/svg+xml' },
      { key: 'store_email', label: '联系邮箱', type: 'email', placeholder: 'contact@example.com' },
      { key: 'store_phone', label: '联系电话', type: 'text', placeholder: '+86 13800138000' },
      { key: 'default_language', label: '默认语言', type: 'select', options: [{ label: '中文', value: 'zh' }, { label: 'English', value: 'en' }] },
      { key: 'default_currency', label: '默认货币', type: 'select', options: [{ label: 'USD', value: 'USD' }, { label: 'CNY', value: 'CNY' }, { label: 'EUR', value: 'EUR' }] },
      { key: 'timezone', label: '时区', type: 'text', placeholder: 'Asia/Shanghai' },
    ],
  },
  {
    id: 'shipping',
    label: '物流配置',
    icon: '📦',
    fields: [
      { key: 'shipping_fee', label: '运费金额(USD)', type: 'number', placeholder: '50' },
      { key: 'express_shipping_fee', label: '加急配送附加费(USD)', type: 'number', placeholder: '50' },
      { key: 'free_shipping_threshold', label: '免运费门槛金额(USD)', type: 'number', placeholder: '200' },
      { key: 'estimated_delivery_days', label: '预计配送天数', type: 'number', placeholder: '7' },
      { key: 'return_address', label: '退货地址', type: 'textarea', placeholder: '请输入退货地址' },
    ],
  },
  {
    id: 'social',
    label: '社交媒体',
    icon: '🔗',
    fields: [
      { key: 'instagram_url', label: 'Instagram 链接', type: 'text', placeholder: 'https://instagram.com/...' },
      { key: 'facebook_url', label: 'Facebook 链接', type: 'text', placeholder: 'https://facebook.com/...' },
      { key: 'tiktok_url', label: 'TikTok 链接', type: 'text', placeholder: 'https://tiktok.com/...' },
      { key: 'whatsapp_url', label: 'WhatsApp 链接', type: 'text', placeholder: 'https://wa.me/...' },
      { key: 'xiaohongshu_url', label: '小红书链接', type: 'text', placeholder: 'https://xiaohongshu.com/...' },
      { key: 'wechat_url', label: '微信公众号链接', type: 'text', placeholder: 'https://mp.weixin.qq.com/...' },
    ],
  },
  {
    id: 'payment',
    label: '支付配置',
    icon: '💳',
    fields: [
      { key: 'paypal_client_id', label: 'PayPal Client ID', type: 'password', placeholder: 'Ac...' },
      { key: 'paypal_client_secret', label: 'PayPal Client Secret', type: 'password', placeholder: 'EL...' },
      { key: 'paypal_webhook_id', label: 'PayPal Webhook ID', type: 'password', placeholder: 'WH-...' },
      { key: 'paypal_mode', label: 'PayPal 模式', type: 'select', options: [{ label: 'Sandbox (测试)', value: 'sandbox' }, { label: 'Live (生产)', value: 'live' }] },
      { key: 'lianlianpay_merchant_id', label: '连连支付商户ID', type: 'password', placeholder: 'your-merchant-id' },
      { key: 'lianlianpay_private_key', label: '连连支付私钥', type: 'password', placeholder: 'your-private-key' },
      { key: 'lianlianpay_public_key', label: '连连支付公钥', type: 'password', placeholder: 'your-public-key' },
      { key: 'lianlianpay_mode', label: '连连支付模式', type: 'select', options: [{ label: 'Sandbox (测试)', value: 'sandbox' }, { label: 'Live (生产)', value: 'live' }] },
    ],
  },
  {
    id: 'email',
    label: '邮件配置',
    icon: '📧',
    fields: [
      { key: 'smtp_host', label: 'SMTP 服务器', type: 'text', placeholder: 'smtp.example.com' },
      { key: 'smtp_port', label: 'SMTP 端口', type: 'number', placeholder: '587' },
      { key: 'smtp_user', label: 'SMTP 用户名', type: 'text', placeholder: 'user@example.com' },
      { key: 'smtp_password', label: 'SMTP 密码', type: 'password', placeholder: '••••••••' },
      { key: 'smtp_from_email', label: '发件人邮箱', type: 'email', placeholder: 'noreply@axis-o.com' },
      { key: 'smtp_from_name', label: '发件人名称', type: 'text', placeholder: 'AXIS O' },
    ],
  },
  {
    id: 'seo',
    label: 'SEO 配置',
    icon: '🔍',
    fields: [
      { key: 'meta_title_en', label: 'SEO 标题 (英文)', type: 'text', placeholder: 'AXIS O - Luxury Leather Goods' },
      { key: 'meta_title_zh', label: 'SEO 标题 (中文)', type: 'text', placeholder: 'AXIS O - 奢华皮具' },
      { key: 'meta_description_en', label: 'SEO 描述 (英文)', type: 'text', placeholder: 'Premium handcrafted leather bags...' },
      { key: 'meta_description_zh', label: 'SEO 描述 (中文)', type: 'text', placeholder: '匠心打造的高端皮革手袋与配饰' },
      { key: 'meta_keywords_en', label: 'SEO 关键词 (英文)', type: 'text', placeholder: 'leather bags, handbags, luxury accessories' },
      { key: 'meta_keywords_zh', label: 'SEO 关键词 (中文)', type: 'text', placeholder: '皮具, 手袋, 包包, 奢侈品, 匠心' },
      { key: 'google_analytics_id', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
    ],
  },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [grouped, setGrouped] = useState<Record<string, Record<string, string>>>({})
  const [activeTab, setActiveTab] = useState('general')
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings', { headers: getAuthHeaders() })
      const text = await response.text()
      
      let result
      try {
        result = JSON.parse(text)
      } catch {
        throw new Error('服务器返回无效的响应格式')
      }
      
      if (!response.ok) {
        throw new Error(result.error?.message || `请求失败: ${response.status}`)
      }
      
      if (result.success) {
        setSettings(result.data.settings)
        setGrouped(result.data.grouped)
        const flatValues: Record<string, string> = {}
        result.data.settings.forEach((s: SettingItem) => {
          flatValues[s.key] = s.value
        })
        setFormValues(flatValues)
      } else {
        throw new Error(result.error?.message || '加载设置失败')
      }
    } catch (err: any) {
      showToastMessage('error', err.message || '加载设置失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleImageUpload = async (key: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      showToastMessage('error', '请选择图片文件')
      return
    }

    setUploading((prev) => ({ ...prev, [key]: true }))
    try {
      const urls = await uploadService.uploadImages([file])
      if (urls.length > 0) {
        handleFieldChange(key, urls[0])
        showToastMessage('success', '上传成功')
      }
    } catch (err: any) {
      showToastMessage('error', err.message || '上传失败')
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleRemoveImage = (key: string) => {
    handleFieldChange(key, '')
  }

  const handleSave = async () => {
    const currentTab = tabConfigs.find((t) => t.id === activeTab)
    if (!currentTab) return

    const updates: Record<string, string> = {}
    currentTab.fields.forEach((field) => {
      const currentValue = grouped[activeTab]?.[field.key] ?? ''
      if (formValues[field.key] !== currentValue) {
        updates[field.key] = formValues[field.key] ?? ''
      }
    })

    if (Object.keys(updates).length === 0) {
      showToastMessage('success', '没有需要保存的更改')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })
      const text = await response.text()
      
      let result
      try {
        result = JSON.parse(text)
      } catch {
        throw new Error('服务器返回无效的响应格式')
      }
      
      if (!response.ok) {
        throw new Error(result.error?.message || `请求失败: ${response.status}`)
      }
      
      if (result.success) {
        showToastMessage('success', '设置保存成功')
        loadSettings()
      } else {
        throw new Error(result.error?.message || '保存失败')
      }
    } catch (err: any) {
      showToastMessage('error', err.message || '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    const testEmail = formValues['smtp_from_email'] || 'test@example.com'
    
    const smtpConfig = {
      host: formValues['smtp_host'] || '',
      port: formValues['smtp_port'] ? parseInt(formValues['smtp_port']) : undefined,
      user: formValues['smtp_user'] || '',
      pass: formValues['smtp_password'] || '',
      fromEmail: formValues['smtp_from_email'] || '',
      fromName: formValues['smtp_from_name'] || '',
    }
    
    setIsTestingEmail(true)
    try {
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: testEmail, smtpConfig }),
      })
      const result = await response.json()
      if (result.success) {
        showToastMessage('success', '测试邮件发送成功，请检查收件箱')
      } else {
        showToastMessage('error', result.error?.message || result.error || '发送失败')
      }
    } catch (err: any) {
      showToastMessage('error', err.message || '网络错误，发送失败')
    } finally {
      setIsTestingEmail(false)
    }
  }

  const renderImageField = (key: string) => {
    const value = formValues[key]
    const isUploading = uploading[key]

    return (
      <div>
        {value ? (
          <div className="relative inline-block group">
            <img
              src={uploadService.getImageUrl(value)}
              alt={key}
              className={`${key === 'store_favicon' ? 'w-10 h-10' : 'h-16 max-w-[200px]'} object-contain border border-gray-200 rounded-lg bg-gray-50`}
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(key)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className={`${key === 'store_favicon' ? 'w-10 h-10' : 'h-16 w-40'} border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 bg-gray-50`}>
            <span className="text-xs">{key === 'store_favicon' ? 'Fav' : 'Logo'}</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRefs.current[key]?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isUploading ? '上传中...' : value ? '更换图片' : '上传图片'}
          </button>
          {value && (
            <span className="text-xs text-gray-400 truncate max-w-[180px]">{value}</span>
          )}
        </div>

        <input
          ref={(el) => { fileInputRefs.current[key] = el }}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/x-icon"
          onChange={(e) => handleImageUpload(key, e.target.files)}
          className="hidden"
        />
      </div>
    )
  }

  const currentTab = tabConfigs.find((t) => t.id === activeTab)

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

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 bg-white rounded-xl shadow-sm p-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
            设置分类
          </h3>
          {tabConfigs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#F5EDE3] text-[#C89460] font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{currentTab?.label}</h2>
                  <p className="text-sm text-gray-500 mt-1">配置店铺的{currentTab?.label}相关参数</p>
                </div>
                <div className="flex items-center gap-3">
                  {activeTab === 'email' && (
                    <button
                      onClick={handleTestEmail}
                      disabled={isTestingEmail}
                      className="px-4 py-2 border border-[#C89460] text-[#C89460] rounded-lg hover:bg-[#F5EDE3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTestingEmail ? '发送中...' : '测试邮件'}
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#C89460] text-white rounded-lg hover:bg-[#B88450] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? '保存中...' : '保存设置'}
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {currentTab?.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label}
                    </label>
                    {field.type === 'image' ? (
                      renderImageField(field.key)
                    ) : field.type === 'select' ? (
                      <select
                        value={formValues[field.key] ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={formValues[field.key] ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460] focus:border-transparent resize-none"
                      />
                    ) : (
                      <input
                        type={field.type === 'password' ? 'password' : 'text'}
                        value={formValues[field.key] ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C89460] focus:border-transparent"
                      />
                    )}
                    {field.type === 'password' && formValues[field.key] && (
                      <p className="text-xs text-gray-400 mt-1">
                        已设置，修改时请谨慎操作
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}