import { mysqlTable, varchar, text, int, decimal, datetime, mysqlEnum, tinyint, unique, index } from 'drizzle-orm/mysql-core'

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  role: mysqlEnum('role', ['customer', 'admin', 'super_admin']).notNull().default('customer'),
  status: mysqlEnum('status', ['active', 'inactive', 'banned']).notNull().default('active'),
  preferredLanguage: mysqlEnum('preferred_language', ['en', 'zh']).notNull().default('en'),
  preferredCurrency: varchar('preferred_currency', { length: 5 }).notNull().default('USD'),
  lastLoginAt: datetime('last_login_at'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_role').on(table.role),
])

export const addresses = mysqlTable('addresses', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: mysqlEnum('type', ['shipping', 'billing']).notNull().default('shipping'),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  line1: varchar('line1', { length: 255 }).notNull(),
  line2: varchar('line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 30 }).notNull(),
  country: varchar('country', { length: 2 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  isDefault: tinyint('is_default').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_addresses_user').on(table.userId),
])

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 36 }).primaryKey(),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  nameZh: varchar('name_zh', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  parentId: varchar('parent_id', { length: 36 }),
  imageUrl: varchar('image_url', { length: 500 }),
  sortOrder: int('sort_order').notNull().default(0),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_categories_slug').on(table.slug),
])

export const products = mysqlTable('products', {
  id: varchar('id', { length: 36 }).primaryKey(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameZh: varchar('name_zh', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  descriptionEn: text('description_en'),
  descriptionZh: text('description_zh'),
  storyEn: text('story_en'),
  storyZh: text('story_zh'),
  categoryId: varchar('category_id', { length: 36 }),
  series: mysqlEnum('series', ['classic', 'luxe', 'travel']).notNull(),
  material: varchar('material', { length: 200 }),
  careInstructions: text('care_instructions'),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  isBestseller: tinyint('is_bestseller').notNull().default(0),
  isActive: tinyint('is_active').notNull().default(1),
  sortOrder: int('sort_order').notNull().default(0),
  metaTitleEn: varchar('meta_title_en', { length: 255 }),
  metaTitleZh: varchar('meta_title_zh', { length: 255 }),
  metaDescriptionEn: text('meta_description_en'),
  metaDescriptionZh: text('meta_description_zh'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_products_slug').on(table.slug),
  index('idx_products_series').on(table.series),
  index('idx_products_bestseller').on(table.isBestseller),
])

export const productVariants = mysqlTable('product_variants', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  colorName: varchar('color_name', { length: 50 }).notNull(),
  colorHex: varchar('color_hex', { length: 7 }),
  size: varchar('size', { length: 30 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  priceAdjustment: decimal('price_adjustment', { precision: 10, scale: 2 }).notNull().default('0.00'),
  stockQuantity: int('stock_quantity').notNull().default(0),
  lowStockThreshold: int('low_stock_threshold').notNull().default(5),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_variants_product').on(table.productId),
  index('idx_variants_sku').on(table.sku),
])

export const productImages = mysqlTable('product_images', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  altText: varchar('alt_text', { length: 255 }),
  sortOrder: int('sort_order').notNull().default(0),
  isPrimary: tinyint('is_primary').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('idx_images_product').on(table.productId),
])

export const productDetailImages = mysqlTable('product_detail_images', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  image: varchar('image', { length: 500 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('idx_detail_images_product').on(table.productId),
])

export const cartItems = mysqlTable('cart_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 36 }).notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: int('quantity').notNull().default(1),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  unique('uk_cart_user_variant').on(table.userId, table.variantId),
])

export const orders = mysqlTable('orders', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  shippingAddressId: varchar('shipping_address_id', { length: 36 }).notNull().references(() => addresses.id),
  billingAddressId: varchar('billing_address_id', { length: 36 }).notNull().references(() => addresses.id),
  discountCodeId: varchar('discount_code_id', { length: 36 }),
  status: mysqlEnum('status', ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).notNull().default('pending'),
  currency: varchar('currency', { length: 5 }).notNull().default('USD'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0.00'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  shippingMethod: varchar('shipping_method', { length: 50 }),
  notes: text('notes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  paidAt: datetime('paid_at'),
  shippedAt: datetime('shipped_at'),
  deliveredAt: datetime('delivered_at'),
  cancelledAt: datetime('cancelled_at'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_orders_user').on(table.userId),
  index('idx_orders_status').on(table.status),
  index('idx_orders_created').on(table.createdAt),
])

export const orderItems = mysqlTable('order_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id),
  variantId: varchar('variant_id', { length: 36 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  variantDescription: varchar('variant_description', { length: 200 }),
  quantity: int('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('idx_orderitems_order').on(table.orderId),
])

export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  provider: mysqlEnum('provider', ['stripe', 'paypal', 'alipay']).notNull(),
  transactionId: varchar('transaction_id', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded']).notNull().default('pending'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 5 }).notNull(),
  feeAmount: decimal('fee_amount', { precision: 10, scale: 2 }),
  metadata: text('metadata'),
  rawResponse: text('raw_response'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_payments_order').on(table.orderId),
  index('idx_payments_transaction').on(table.transactionId),
])

export const paymentEvents = mysqlTable('payment_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  paymentId: varchar('payment_id', { length: 36 }).notNull().references(() => payments.id, { onDelete: 'cascade' }),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  eventType: mysqlEnum('event_type', ['intent_created', 'intent_succeeded', 'intent_failed', 'intent_canceled', 'refund_requested', 'refund_succeeded', 'refund_failed', 'status_synced', 'webhook_received']).notNull(),
  provider: mysqlEnum('provider', ['stripe', 'paypal', 'alipay']).notNull(),
  providerEventId: varchar('provider_event_id', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 5 }),
  feeAmount: decimal('fee_amount', { precision: 10, scale: 2 }),
  statusBefore: varchar('status_before', { length: 30 }),
  statusAfter: varchar('status_after', { length: 30 }),
  rawData: text('raw_data'),
  notes: varchar('notes', { length: 500 }),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('idx_payment_events_payment').on(table.paymentId),
  index('idx_payment_events_order').on(table.orderId),
  index('idx_payment_events_type').on(table.eventType),
])

export const shipments = mysqlTable('shipments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  carrier: mysqlEnum('carrier', ['dhl', 'ups', 'fedex', 'other']).notNull(),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  trackingUrl: varchar('tracking_url', { length: 500 }),
  status: mysqlEnum('status', ['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned']).notNull().default('pending'),
  weightKg: decimal('weight_kg', { precision: 6, scale: 3 }),
  dimensionsCm: varchar('dimensions_cm', { length: 30 }),
  estimatedDelivery: datetime('estimated_delivery'),
  shippedAt: datetime('shipped_at'),
  deliveredAt: datetime('delivered_at'),
  labelUrl: varchar('label_url', { length: 500 }),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_shipments_order').on(table.orderId),
  index('idx_shipments_tracking').on(table.trackingNumber),
])

export const discountCodes = mysqlTable('discount_codes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: mysqlEnum('type', ['percentage', 'fixed_amount']).notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
  maxUses: int('max_uses'),
  currentUses: int('current_uses').notNull().default(0),
  validFrom: datetime('valid_from').notNull(),
  validUntil: datetime('valid_until'),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_discount_code').on(table.code),
])

export const reviews = mysqlTable('reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  orderId: varchar('order_id', { length: 36 }),
  rating: tinyint('rating').notNull(),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).notNull().default('pending'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  unique('uk_review_user_product').on(table.userId, table.productId),
  index('idx_reviews_product').on(table.productId),
])

export const wishlistItems = mysqlTable('wishlist_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  unique('uk_wishlist_user_product').on(table.userId, table.productId),
])

export const settings = mysqlTable('settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  group: varchar('group', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_settings_group').on(table.group),
])

export const passwordResets = mysqlTable('password_resets', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: datetime('expires_at').notNull(),
  used: tinyint('used').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('idx_pwdreset_token').on(table.token),
])

export const banners = mysqlTable('banners', {
  id: varchar('id', { length: 36 }).primaryKey(),
  image: varchar('image', { length: 500 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }).notNull().default(''),
  link: varchar('link', { length: 500 }).notNull().default('/products'),
  linkText: varchar('link_text', { length: 100 }).notNull().default('Shop Now'),
  tags: text('tags'),
  sortOrder: int('sort_order').notNull().default(0),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_banners_sort').on(table.sortOrder),
])

export { returns, returnItems, returnLogs } from './returns'
export type { Return, NewReturn, ReturnItem, NewReturnItem, ReturnLog, NewReturnLog } from './returns'
