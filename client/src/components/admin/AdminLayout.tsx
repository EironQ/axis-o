import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

const pageTitles: Record<string, string> = {
  '/admin/dashboard': '仪表盘',
  '/admin/banners': 'Banner管理',
  '/admin/categories': '分类管理',
  '/admin/products': '商品管理',
  '/admin/orders': '订单管理',
  '/admin/payment-events': '支付流水',
  '/admin/returns': '退换货管理',
  '/admin/users': '用户管理',
  '/admin/analytics': '数据分析',
  '/admin/settings': '系统设置',
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  let currentTitle = '管理后台'
  const sortedPaths = Object.keys(pageTitles).sort((a, b) => b.length - a.length)
  for (const path of sortedPaths) {
    if (currentPath === path || currentPath.startsWith(path + '/')) {
      currentTitle = pageTitles[path]
      break
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRefreshToken')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-56 transition-all duration-300">
        <header className="fixed top-0 right-0 left-56 h-16 bg-white border-b border-gray-200 z-40">
          <div className="flex items-center justify-between px-6 h-full">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-800">{currentTitle}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#C89460] flex items-center justify-center text-white">
                  <span>👤</span>
                </div>
                <span className="text-sm text-gray-600">管理员</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </header>

        <main className="pt-20 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}