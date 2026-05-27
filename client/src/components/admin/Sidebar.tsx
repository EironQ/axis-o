import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSettings } from '@/context/SettingsContext'

const menuItems = [
  { id: 'dashboard', label: '仪表盘', icon: '📊', path: '/admin/dashboard' },
  { id: 'banners', label: 'Banner管理', icon: '🖼️', path: '/admin/banners' },
  { id: 'categories', label: '分类管理', icon: '📁', path: '/admin/categories' },
  { id: 'products', label: '商品管理', icon: '📦', path: '/admin/products' },
  { id: 'orders', label: '订单管理', icon: '📋', path: '/admin/orders' },
  { id: 'returns', label: '退换货管理', icon: '🔄', path: '/admin/returns' },
  { id: 'payment-events', label: '支付流水', icon: '💳', path: '/admin/payment-events' },
  { id: 'users', label: '用户管理', icon: '👥', path: '/admin/users' },
  { id: 'analytics', label: '数据分析', icon: '📈', path: '/admin/analytics' },
  { id: 'settings', label: '系统设置', icon: '⚙️', path: '/admin/settings' },
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { store } = useSettings()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#1a1a2e] text-white transition-all duration-300 z-50 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-4 border-b border-[#2d2d44]">
          {!isCollapsed && (
            <span className="text-lg font-bold text-[#C89460]">{store.store_name} Admin</span>
          )}
          {isCollapsed && (
            <span className="text-xl">⚡</span>
          )}
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-2 px-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              return (
                <li key={item.id}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#C89460] text-white'
                        : 'hover:bg-[#2d2d44] text-gray-300'
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-2 border-t border-[#2d2d44]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-[#2d2d44] text-gray-300 transition-colors"
          >
            <span>{isCollapsed ? '▶️' : '◀️'}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}