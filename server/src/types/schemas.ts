import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']).default('shipping'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(30),
  country: z.string().length(2),
  phone: z.string().max(30).optional(),
  isDefault: z.boolean().default(false),
})

export const updateAddressSchema = addressSchema.partial()

export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1),
  billingAddressId: z.string().min(1),
  shippingMethod: z.string().min(1),
  paymentProvider: z.enum(['stripe', 'paypal', 'airwallex', 'lianlianpay']),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().length(3).default('USD'),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  sort: z.string().optional(),
  series: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  lang: z.enum(['en', 'zh']).default('en'),
})

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(99).default(1),
})

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
})

export const reviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  content: z.string().min(1).max(2000),
})

const productImageSchema = z.object({
  url: z.string().min(1).max(500),
  altText: z.string().max(255).optional(),
  sortOrder: z.coerce.number().int().default(0),
  isPrimary: z.coerce.boolean().default(false),
})

const productVariantSchema = z.object({
  colorName: z.string().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  size: z.string().min(1).max(30),
  sku: z.string().min(1).max(100),
  priceAdjustment: z.coerce.number().default(0),
  stockQuantity: z.coerce.number().int().default(0),
  lowStockThreshold: z.coerce.number().int().default(5),
  isActive: z.coerce.boolean().default(true),
})

const productDetailImageSchema = z.object({
  image: z.string().min(1).max(500),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
})

export const createProductSchema = z.object({
  nameEn: z.string().min(1).max(255),
  nameZh: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  descriptionEn: z.string().optional(),
  descriptionZh: z.string().optional(),
  storyEn: z.string().optional(),
  storyZh: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  series: z.enum(['classic', 'luxe', 'travel']),
  material: z.string().max(200).optional(),
  careInstructions: z.string().optional(),
  basePrice: z.coerce.number().positive('Price must be positive'),
  isBestseller: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  metaTitleEn: z.string().max(255).optional(),
  metaTitleZh: z.string().max(255).optional(),
  metaDescriptionEn: z.string().optional(),
  metaDescriptionZh: z.string().optional(),
  images: z.array(productImageSchema).optional().default([]),
  variants: z.array(productVariantSchema).optional().default([]),
  detailImages: z.array(productDetailImageSchema).optional().default([]),
})

export const updateProductSchema = z.object({
  nameEn: z.string().min(1).max(255).optional(),
  nameZh: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  descriptionEn: z.string().optional().nullable(),
  descriptionZh: z.string().optional().nullable(),
  storyEn: z.string().optional().nullable(),
  storyZh: z.string().optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  series: z.enum(['classic', 'luxe', 'travel']).optional(),
  material: z.string().max(200).optional().nullable(),
  careInstructions: z.string().optional().nullable(),
  basePrice: z.coerce.number().positive().optional(),
  isBestseller: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  metaTitleEn: z.string().max(255).optional().nullable(),
  metaTitleZh: z.string().max(255).optional().nullable(),
  metaDescriptionEn: z.string().optional().nullable(),
  metaDescriptionZh: z.string().optional().nullable(),
  stock: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional().nullable(),
  images: z.array(productImageSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
  detailImages: z.array(productDetailImageSchema).optional(),
})

export const adminProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  series: z.enum(['classic', 'luxe', 'travel']).optional(),
  isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
})
