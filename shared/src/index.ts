export interface ProductColor {
  name: string
  hex: string
  imageIndex: number
}

export interface Product {
  id: string
  name: string
  series: 'classic' | 'luxe' | 'travel'
  description: string
  price: number
  stock: number
  colors: ProductColor[]
  sizes: string[]
  material: string
  images: string[]
  story: string
  isBestSeller: boolean
  category: string
  slug: string
  nameEn: string
  nameZh: string
  descriptionEn: string
  descriptionZh: string
  storyEn: string
  storyZh: string
  isActive: boolean
  sortOrder: number
  metaTitleEn: string | null
  metaTitleZh: string | null
  metaDescriptionEn: string | null
  metaDescriptionZh: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  colorName: string
  colorHex: string
  size: string
  sku: string
  priceAdjustment: number
  stockQuantity: number
  lowStockThreshold: number
  isActive: boolean
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  altText: string | null
  sortOrder: number
  isPrimary: boolean
}

export interface Category {
  id: string
  nameEn: string
  nameZh: string
  slug: string
  parentId: string | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
}

export interface CartItem {
  productId: string
  colorName: string
  size: string
  quantity: number
}

export type UserRole = 'customer' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'inactive' | 'banned'
export type Language = 'en' | 'zh'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
  preferredLanguage: Language
  preferredCurrency: string
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: string
  userId: string
  type: 'shipping' | 'billing'
  firstName: string
  lastName: string
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string
  country: string
  phone: string | null
  isDefault: boolean
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface Order {
  id: string
  orderNumber: string
  userId: string
  shippingAddressId: string
  billingAddressId: string
  discountCodeId: string | null
  status: OrderStatus
  currency: string
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  total: number
  shippingMethod: string | null
  notes: string | null
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId: string
  productName: string
  variantDescription: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type PaymentProvider = 'stripe' | 'paypal' | 'airwallex'
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded'

export interface Payment {
  id: string
  orderId: string
  provider: PaymentProvider
  transactionId: string | null
  status: PaymentStatus
  amount: number
  currency: string
  feeAmount: number | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export type ShipmentStatus = 'pending' | 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned'
export type ShipmentCarrier = 'dhl' | 'ups' | 'fedex' | 'other'

export interface Shipment {
  id: string
  orderId: string
  carrier: ShipmentCarrier
  trackingNumber: string | null
  trackingUrl: string | null
  status: ShipmentStatus
  weightKg: number | null
  dimensionsCm: string | null
  estimatedDelivery: string | null
  shippedAt: string | null
  deliveredAt: string | null
  labelUrl: string | null
}

export type DiscountType = 'percentage' | 'fixed_amount'

export interface DiscountCode {
  id: string
  code: string
  type: DiscountType
  value: number
  minOrderAmount: number | null
  maxUses: number | null
  currentUses: number
  validFrom: string
  validUntil: string | null
  isActive: boolean
}

export interface Review {
  id: string
  userId: string
  productId: string
  orderId: string | null
  rating: number
  title: string | null
  content: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaymentIntent {
  orderId: string
  amount: number
  currency: string
  description: string
  metadata: Record<string, string>
  customerEmail: string
  returnUrl: string
  cancelUrl: string
}

export interface PaymentResult {
  success: boolean
  provider: PaymentProvider
  transactionId: string
  status: 'succeeded' | 'processing' | 'failed'
  redirectUrl?: string
  clientSecret?: string
  approvalUrl?: string
  qrCodeUrl?: string
}
