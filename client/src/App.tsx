import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CookieConsentProvider from '@/components/ui/CookieConsent'
import { SettingsProvider } from '@/context/SettingsContext'
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
import { useEffect } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <div className="min-h-screen">
        <ScrollToTop />
        <Routes>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/banners" element={
            <ProtectedRoute>
              <BannersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute>
              <CategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/payment-events" element={
            <ProtectedRoute>
              <PaymentEventsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/returns" element={
            <ProtectedRoute>
              <ReturnsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/returns/:returnId" element={
            <ProtectedRoute>
              <ReturnsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3C2415]">
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/returns" element={<ReturnListPage />} />
        <Route path="/returns/:returnId" element={<ReturnDetailPage />} />
        <Route path="/returns/create" element={<ReturnCreatePage />} />
        <Route path="/returns/create/:orderId" element={<ReturnCreatePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/addresses" element={<AddressPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <CookieConsentProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </CookieConsentProvider>
    </Router>
  )
}