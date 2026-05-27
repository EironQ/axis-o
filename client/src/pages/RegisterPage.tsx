import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth'
import { useSettings } from '@/context/SettingsContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { store } = useSettings()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (success && countdown === 0) {
      navigate('/login')
    }
  }, [success, countdown, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)
    setCountdown(3)

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('密码至少需要8个字符')
      setIsLoading(false)
      return
    }

    try {
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      if (response.success && response.data) {
        setSuccess(true)
      } else {
        setError(response.error?.message || '注册失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#C89460] to-[#8B6914] rounded-full flex items-center justify-center animate-bounce-in">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-[#C89460]/30 rounded-full animate-ping" />
          </div>
          
          <h2 className="text-3xl font-['Playfair_Display'] text-[#3C2415] mb-3 animate-slide-up">
            注册成功！
          </h2>
          
          <p className="text-[#3C2415]/60 mb-6 animate-slide-up-delay">
            欢迎加入 {store.store_name} 家族
          </p>

          <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#F5F0E8] rounded-full animate-slide-up-delay-2">
            <span className="text-sm text-[#3C2415]/60">
              将在 <span className="font-medium text-[#C89460] text-lg">{countdown}</span> 秒后跳转
            </span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    countdown <= i ? 'bg-[#C89460]' : 'bg-[#E5DDD3]'
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm text-[#3C2415]/40 animate-fade-in-delay">
            或 <button
              onClick={() => navigate('/login')}
              className="text-[#C89460] hover:underline hover:text-[#8B6914] transition-colors"
            >
              立即登录
            </button>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-24 pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
            {store.store_name}
          </p>
          <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">
            创建账户
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[480px] px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-[#3C2415] mb-2">
                名字
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                placeholder="名字"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-[#3C2415] mb-2">
                姓氏
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
                placeholder="姓氏"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#3C2415] mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#3C2415] mb-2">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
              placeholder="至少8个字符"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#3C2415] mb-2">
              确认密码
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
              placeholder="再次输入密码"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-[#3C2415] text-white font-medium tracking-wider uppercase hover:bg-[#2A1A0F] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                注册中...
              </span>
            ) : (
              '创建账户'
            )}
          </button>

          <p className="text-center text-sm text-[#3C2415]/60">
            已有账号？{' '}
            <Link to="/login" className="text-[#C89460] hover:underline transition-colors">
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
