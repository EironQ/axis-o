import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, User, Menu, X, Search, LogOut } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useCartAnimationStore } from '@/store/cartAnimationStore'
import { useSettings } from '@/context/SettingsContext'
import Badge from '@/components/ui/Badge'

const defaultNavLinks = [
  { label: '首页', href: '/' },
  { label: '经典系列', href: '/products?series=classic' },
  { label: '轻奢系列', href: '/products?series=luxe' },
  { label: '旅行系列', href: '/products?series=travel' },
  { label: '关于我们', href: '/about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { store } = useSettings()
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const setCartIconRef = useCartAnimationStore((s) => s.setCartIconRef)
  const cartIconRef = useRef<HTMLAnchorElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (cartIconRef.current) {
      setCartIconRef(cartIconRef)
    }
  }, [setCartIconRef])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setIsLoggedIn(!!token)
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#FAF7F2]/90 backdrop-blur-lg shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-5">
        <button
          className="lg:hidden text-[#3C2415]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="hidden lg:flex items-center gap-10">
          {defaultNavLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm tracking-widest uppercase transition-colors duration-300 hover:text-[#C89460] ${
                location.pathname === link.href.split('?')[0] &&
                (!link.href.includes('?') || location.search === link.href.split('?')[1].replace('series=', ''))
                  ? 'text-[#C89460]'
                  : 'text-[#3C2415]/70'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          {store.store_logo ? (
            <img
              src={store.store_logo}
              alt={store.store_name}
              className="h-8 object-contain"
            />
          ) : (
            <span className="font-['Playfair_Display'] text-2xl tracking-[0.3em] text-[#3C2415]">
              {store.store_name}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-5">
          <button className="hidden sm:block text-[#3C2415]/70 hover:text-[#3C2415] transition-colors" aria-label="搜索">
            <Search size={18} />
          </button>

          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                className="text-[#3C2415]/70 hover:text-[#3C2415] transition-colors"
                aria-label="个人中心"
              >
                <User size={18} />
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#3C2415]/70 hover:text-red-500 transition-colors"
                aria-label="退出登录"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-[#3C2415]/70 hover:text-[#3C2415] transition-colors"
              aria-label="登录"
            >
              <User size={18} />
            </Link>
          )}

          <Link
            to="/cart"
            ref={cartIconRef}
            className="relative text-[#3C2415]/70 hover:text-[#3C2415] transition-colors"
            aria-label="购物车"
          >
            <ShoppingBag size={18} />
            {itemCount > 0 && <Badge count={itemCount} />}
          </Link>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden bg-[#FAF7F2] border-t border-[#E5DDD3] animate-fadeIn">
          <div className="flex flex-col px-8 py-6 space-y-4">
            {defaultNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm tracking-widest uppercase transition-colors duration-300 hover:text-[#C89460] ${
                  location.pathname === link.href.split('?')[0] &&
                  (!link.href.includes('?') || location.search === link.href.split('?')[1].replace('series=', ''))
                    ? 'text-[#C89460]'
                    : 'text-[#3C2415]/70'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
