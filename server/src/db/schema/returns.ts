import { mysqlTable, varchar, text, int, decimal, datetime, mysqlEnum, index } from 'drizzle-orm/mysql-core'

export const returns = mysqlTable('returns', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  type: mysqlEnum('type', ['return', 'exchange', 'refund']).notNull().default('return'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled']).notNull().default('pending'),
  reason: mysqlEnum('reason', ['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'arrived_late', 'other']).notNull(),
  reasonDetail: text('reason_detail'),
  images: text('images'),
  adminNote: text('admin_note'),
  processedBy: varchar('processed_by', { length: 36 }),
  processedAt: datetime('processed_at'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  refundReason: text('refund_reason'),
  completedAt: datetime('completed_at'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (table) => [
  index('idx_returns_order').on(table.orderId),
  index('idx_returns_user').on(table.userId),
  index('idx_returns_status').on(table.status),
  index('idx_returns_created').on(table.createdAt),
])

export const returnItems = mysqlTable('return_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  returnId: varchar('return_id', { length: 36 }).notNull(),
  orderItemId: varchar('order_item_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  variantId: varchar('variant_id', { length: 36 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  variantDescription: varchar('variant_description', { length: 200 }),
  quantity: int('quantity').notNull().default(1),
  newVariantId: varchar('new_variant_id', { length: 36 }),
  newProductName: varchar('new_product_name', { length: 255 }),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('idx_return_items_return').on(table.returnId),
])

export const returnLogs = mysqlTable('return_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  returnId: varchar('return_id', { length: 36 }).notNull(),
  action: mysqlEnum('action', ['created', 'status_changed', 'note_added', 'image_added', 'refund_initiated', 'refund_completed']).notNull(),
  fromStatus: varchar('from_status', { length: 30 }),
  toStatus: varchar('to_status', { length: 30 }),
  operatorId: varchar('operator_id', { length: 36 }),
  operatorType: mysqlEnum('operator_type', ['user', 'admin', 'system']).notNull(),
  note: text('note'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('idx_return_logs_return').on(table.returnId),
])

export type Return = typeof returns.$inferSelect
export type NewReturn = typeof returns.$inferInsert
export type ReturnItem = typeof returnItems.$inferSelect
export type NewReturnItem = typeof returnItems.$inferInsert
export type ReturnLog = typeof returnLogs.$inferSelect
export type NewReturnLog = typeof returnLogs.$inferInsert