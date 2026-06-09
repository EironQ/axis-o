import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, User, Menu, X, Search, LogOut, Globe } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useCartAnimationStore } from '@/store/cartAnimationStore'
import { useSettings } from '@/context/SettingsContext'
import { useTranslation, useLanguage } from '@/i18n'
import Badge from '@/components/ui/Badge'
import SearchOverlay from './SearchOverlay'

const defaultNavLinks = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.classic', href: '/products?series=classic' },
  { key: 'nav.luxe', href: '/products?series=luxe' },
  { key: 'nav.travel', href: '/products?series=travel' },
  { key: 'nav.about', href: '/about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { store } = useSettings()
  const { t } = useTranslation()
  const { lang, setLang } = useLanguage()
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
    navigate(`/${lang}`)
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
          aria-label={t('nav.menu')}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="hidden lg:flex items-center gap-10">
          {defaultNavLinks.map((link) => {
            const hrefBase = link.href.split('?')[0].replace('/', '')
            const currentBase = location.pathname.split('/').filter(Boolean).slice(1).join('/')
            const isActive = location.pathname.includes(`/${hrefBase}`) && (
              !link.href.includes('?') || location.search === link.href.split('?')[1]
            )
            const href = `/${lang}${link.href}`
            return (
              <Link
                key={link.key}
                to={href}
                className={`text-sm tracking-widest uppercase transition-colors duration-300 hover:text-[#C89460] ${
                  isActive ? 'text-[#C89460]' : 'text-[#3C2415]/70'
                }`}
              >
                {t(link.key as any)}
              </Link>
            )
          })}
        </div>

        <Link to={`/${lang}`} className="absolute left-1/2 -translate-x-1/2">
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
          <div className="relative">
            <button
              className="text-[#3C2415]/70 hover:text-[#3C2415] transition-colors text-xs tracking-wider uppercase flex items-center gap-1"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label="Switch language"
            >
              <Globe size={14} />
              <span className="hidden sm:inline">{lang === 'zh' ? '中文' : 'EN'}</span>
            </button>
            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white shadow-lg border border-[#E5DDD3] z-20 min-w-[100px]">
                  <button
                    onClick={() => { setLang('zh'); setLangMenuOpen(false) }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#F5F0E8] transition-colors ${lang === 'zh' ? 'text-[#C89460] font-medium' : 'text-[#3C2415]'}`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => { setLang('en'); setLangMenuOpen(false) }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#F5F0E8] transition-colors ${lang === 'en' ? 'text-[#C89460] font-medium' : 'text-[#3C2415]'}`}
                  >
                    English
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:block text-[#3C2415]/70 hover:text-[#3C2415] transition-colors"
            aria-label={t('nav.search')}
          >
            <Search size={18} />
          </button>

          {isLoggedIn ? (
            <>
              <Link
                to={`/${lang}/profile`}
                className="text-[#3C2415]/70 hover:text-[#3C2415] transition-colors"
                aria-label={t('nav.profile')}
              >
                <User size={18} />
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#3C2415]/70 hover:text-red-500 transition-colors"
                aria-label={t('nav.logout')}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link
              to={`/${lang}/login`}
              className="text-[#3C2415]/70 hover:text-[#3C2415] transition-colors"
              aria-label={t('nav.login')}
            >
              <User size={18} />
            </Link>
          )}

          <Link
            to={`/${lang}/cart`}
            ref={cartIconRef}
            className="relative text-[#3C2415]/70 hover:text-[#3C2415] transition-colors"
            aria-label={t('nav.cart')}
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
                key={link.key}
                to={`/${lang}${link.href}`}
                className={`text-sm tracking-widest uppercase transition-colors duration-300 hover:text-[#C89460] ${
                  location.pathname.includes(`/${link.href.split('?')[0].replace('/', '')}`)
                    ? 'text-[#C89460]'
                    : 'text-[#3C2415]/70'
                }`}
              >
                {t(link.key as any)}
              </Link>
            ))}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm tracking-widest uppercase text-[#3C2415]/70 hover:text-red-500 transition-colors"
              >
                <LogOut size={16} />
                {t('nav.logout')}
              </button>
            )}
          </div>
        </div>
      )}

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
