import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CookieConsentProvider from '@/components/ui/CookieConsent'
import { SettingsProvider } from '@/context/SettingsContext'
import { LanguageProvider } from '@/i18n'
import HomePage from '@/pages/HomePage'
import ProductListPage from '@/pages/ProductListPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderListPage from '@/pages/OrderListPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import ReturnListPage from '@/pages/ReturnListPage'
import ReturnDetailPage from '@/pages/ReturnDetailPage'
import ReturnCreatePage from '@/pages/ReturnCreatePage'
import AboutPage from '@/pages/AboutPage'
import CraftsmanshipPage from '@/pages/CraftsmanshipPage'
import SustainabilityPage from '@/pages/SustainabilityPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProfilePage from '@/pages/ProfilePage'
import AddressPage from '@/pages/AddressPage'
import PrivacyPage from '@/pages/PrivacyPage'
import TermsPage from '@/pages/TermsPage'
import ReturnPolicyPage from '@/pages/ReturnPolicyPage'
import ShippingPage from '@/pages/ShippingPage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import DashboardPage from '@/pages/DashboardPage'
import BannersPage from '@/pages/admin/BannersPage'
import CategoriesPage from '@/pages/admin/CategoriesPage'
import ProductsPage from '@/pages/admin/ProductsPage'
import OrdersPage from '@/pages/admin/OrdersPage'
import PaymentEventsPage from '@/pages/admin/PaymentEventsPage'
import UsersPage from '@/pages/admin/UsersPage'
import ReturnsPage from '@/pages/admin/ReturnsPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import ProtectedRoute from '@/components/admin/ProtectedRoute'
import { useEffect, useState } from 'react'

function ScrollHandler() {
  const location = useLocation()
  
  useEffect(() => {
    const handleScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      document.documentElement.scrollLeft = 0
      document.body.scrollLeft = 0
    }
    
    handleScroll()
    
    const timer1 = setTimeout(handleScroll, 50)
    const timer2 = setTimeout(handleScroll, 100)
    const timer3 = setTimeout(handleScroll, 200)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [location.pathname, location.search])
  
  return null
}

function RootRedirect() {
  const [detectedLang, setDetectedLang] = useState<string | null>(null)
  
  useEffect(() => {
    const stored = localStorage.getItem('preferred_language')
    const browserLang = navigator.language.toLowerCase()
    const detected = stored === 'zh' || stored === 'en' ? stored : browserLang.startsWith('zh') ? 'zh' : 'en'
    setDetectedLang(detected)
  }, [])
  
  if (!detectedLang) return null
  
  return <Navigate to={`/${detectedLang}`} replace />
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#FAF7F2] text-[#3C2415]">
        <Navbar />
        <ScrollHandler />
        {children}
        <Footer />
      </div>
    </LanguageProvider>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/:lang',
    element: (
      <PublicLayout>
        <HomePage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/products',
    element: (
      <PublicLayout>
        <ProductListPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/products/:id',
    element: (
      <PublicLayout>
        <ProductDetailPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/cart',
    element: (
      <PublicLayout>
        <CartPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/checkout',
    element: (
      <PublicLayout>
        <CheckoutPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/orders',
    element: (
      <PublicLayout>
        <OrderListPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/orders/:orderId',
    element: (
      <PublicLayout>
        <OrderDetailPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/returns',
    element: (
      <PublicLayout>
        <ReturnListPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/returns/:returnId',
    element: (
      <PublicLayout>
        <ReturnDetailPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/returns/create',
    element: (
      <PublicLayout>
        <ReturnCreatePage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/returns/create/:orderId',
    element: (
      <PublicLayout>
        <ReturnCreatePage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/about',
    element: (
      <PublicLayout>
        <AboutPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/craftsmanship',
    element: (
      <PublicLayout>
        <CraftsmanshipPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/sustainability',
    element: (
      <PublicLayout>
        <SustainabilityPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/login',
    element: (
      <PublicLayout>
        <LoginPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/register',
    element: (
      <PublicLayout>
        <RegisterPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/profile',
    element: (
      <PublicLayout>
        <ProfilePage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/addresses',
    element: (
      <PublicLayout>
        <AddressPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/privacy',
    element: (
      <PublicLayout>
        <PrivacyPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/terms',
    element: (
      <PublicLayout>
        <TermsPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/return-policy',
    element: (
      <PublicLayout>
        <ReturnPolicyPage />
      </PublicLayout>
    ),
  },
  {
    path: '/:lang/shipping',
    element: (
      <PublicLayout>
        <ShippingPage />
      </PublicLayout>
    ),
  },
  {
    path: '/admin',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/banners',
    element: (
      <ProtectedRoute>
        <BannersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/categories',
    element: (
      <ProtectedRoute>
        <CategoriesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/products',
    element: (
      <ProtectedRoute>
        <ProductsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/orders',
    element: (
      <ProtectedRoute>
        <OrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/payment-events',
    element: (
      <ProtectedRoute>
        <PaymentEventsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute>
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/returns',
    element: (
      <ProtectedRoute>
        <ReturnsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/returns/:returnId',
    element: (
      <ProtectedRoute>
        <ReturnsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
])

export default function App() {
  return (
    <CookieConsentProvider>
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    </CookieConsentProvider>
  )
}
