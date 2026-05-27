import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth'
import { useSettings } from '@/context/SettingsContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { store } = useSettings()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await authService.login({ email, password })

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        navigate('/profile')
      } else {
        setError(response.error?.message || '登录失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-24 pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">{store.store_name}</p>
          <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">登录</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[480px] px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#3C2415] mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5DDD3] bg-white text-[#3C2415] focus:outline-none focus:border-[#C89460] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-[#3C2415] text-white font-medium tracking-wider uppercase hover:bg-[#2A1A0F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-[#3C2415]/60">
            还没有账号？{' '}
            <Link to="/register" className="text-[#C89460] hover:underline">
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
