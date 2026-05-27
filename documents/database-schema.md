# AXIS O 数据库表结构文档

## 数据库概览

- **数据库名**: `axis_o`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`
- **表总数**: 15 张

---

## 表结构列表

### 1. users (用户表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 用户唯一标识 |
| email | varchar(255) | NOT NULL, UNIQUE | 邮箱地址 |
| password_hash | varchar(255) | NOT NULL | 密码哈希 |
| first_name | varchar(100) | NOT NULL | 名字 |
| last_name | varchar(100) | NOT NULL | 姓氏 |
| phone | varchar(30) | NULL | 手机号 |
| avatar_url | varchar(500) | NULL | 头像URL |
| role | enum | NOT NULL, DEFAULT 'customer' | 用户角色: customer/admin/super_admin |
| status | enum | NOT NULL, DEFAULT 'active' | 状态: active/inactive/banned |
| preferred_language | enum | NOT NULL, DEFAULT 'en' | 语言: en/zh |
| preferred_currency | varchar(5) | NOT NULL, DEFAULT 'USD' | 货币 |
| last_login_at | datetime | NULL | 最后登录时间 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

### 2. addresses (地址表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 地址唯一标识 |
| user_id | varchar(36) | NOT NULL, FK → users(id) | 用户ID |
| type | enum | NOT NULL, DEFAULT 'shipping' | 类型: shipping/billing |
| first_name | varchar(100) | NOT NULL | 收件人名字 |
| last_name | varchar(100) | NOT NULL | 收件人姓氏 |
| line1 | varchar(255) | NOT NULL | 地址1 |
| line2 | varchar(255) | NULL | 地址2 |
| city | varchar(100) | NOT NULL | 城市 |
| state | varchar(100) | NULL | 州/省 |
| postal_code | varchar(30) | NOT NULL | 邮编 |
| country | varchar(2) | NOT NULL | 国家代码 |
| phone | varchar(30) | NULL | 联系电话 |
| is_default | tinyint | NOT NULL, DEFAULT 0 | 是否默认地址 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

### 3. categories (分类表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 分类唯一标识 |
| name_en | varchar(100) | NOT NULL | 英文名称 |
| name_zh | varchar(100) | NOT NULL | 中文名称 |
| slug | varchar(100) | NOT NULL, UNIQUE | 别名 |
| parent_id | varchar(36) | NULL | 父分类ID |
| image_url | varchar(500) | NULL | 分类图片 |
| sort_order | int | NOT NULL, DEFAULT 0 | 排序 |
| is_active | tinyint | NOT NULL, DEFAULT 1 | 是否启用 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

### 4. products (商品表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 商品唯一标识 |
| name_en | varchar(255) | NOT NULL | 英文名称 |
| name_zh | varchar(255) | NOT NULL | 中文名称 |
| slug | varchar(255) | NOT NULL, UNIQUE | 别名 |
| description_en | text | NULL | 英文描述 |
| description_zh | text | NULL | 中文描述 |
| story_en | text | NULL | 英文故事 |
| story_zh | text | NULL | 中文故事 |
| category_id | varchar(36) | NULL, FK → categories(id) | 分类ID |
| series | enum | NOT NULL | 系列: classic/luxe/travel |
| material | varchar(200) | NULL | 材质 |
| care_instructions | text | NULL | 保养说明 |
| base_price | decimal(10,2) | NOT NULL | 基础价格 |
| is_bestseller | tinyint | NOT NULL, DEFAULT 0 | 是否畅销 |
| is_active | tinyint | NOT NULL, DEFAULT 1 | 是否启用 |
| sort_order | int | NOT NULL, DEFAULT 0 | 排序 |
| meta_title_en | varchar(255) | NULL | SEO标题(英文) |
| meta_title_zh | varchar(255) | NULL | SEO标题(中文) |
| meta_description_en | text | NULL | SEO描述(英文) |
| meta_description_zh | text | NULL | SEO描述(中文) |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

### 5. product_variants (商品变体表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 变体唯一标识 |
| product_id | varchar(36) | NOT NULL, FK → products(id) | 商品ID |
| color_name | varchar(50) | NOT NULL | 颜色名称 |
| color_hex | varchar(7) | NULL | 颜色十六进制 |
| size | varchar(30) | NOT NULL | 尺寸 |
| sku | varchar(100) | NOT NULL, UNIQUE | SKU编号 |
| price_adjustment | decimal(10,2) | NOT NULL, DEFAULT 0 | 价格调整 |
| stock_quantity | int | NOT NULL, DEFAULT 0 | 库存数量 |
| low_stock_threshold | int | NOT NULL, DEFAULT 5 | 低库存阈值 |
| is_active | tinyint | NOT NULL, DEFAULT 1 | 是否启用 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

### 6. product_images (商品图片表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 图片唯一标识 |
| product_id | varchar(36) | NOT NULL, FK → products(id) | 商品ID |
| url | varchar(500) | NOT NULL | 图片URL |
| alt_text | varchar(255) | NULL | 替代文本 |
| sort_order | int | NOT NULL, DEFAULT 0 | 排序 |
| is_primary | tinyint | NOT NULL, DEFAULT 0 | 是否主图 |
| created_at | datetime | NOT NULL | 创建时间 |

### 7. cart_items (购物车项表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 购物车项唯一标识 |
| user_id | varchar(36) | NOT NULL, FK → users(id) | 用户ID |
| variant_id | varchar(36) | NOT NULL, FK → product_variants(id) | 变体ID |
| quantity | int | NOT NULL, DEFAULT 1 | 数量 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

### 8. orders (订单表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 订单唯一标识 |
| order_number | varchar(20) | NOT NULL, UNIQUE | 订单号 |
| user_id | varchar(36) | NOT NULL, FK → users(id) | 用户ID |
| shipping_address_id | varchar(36) | NOT NULL, FK → addresses(id) | 配送地址 |
| billing_address_id | varchar(36) | NOT NULL, FK → addresses(id) | 账单地址 |
| discount_code_id | varchar(36) | NULL, FK → discount_codes(id) | 折扣码ID |
| status | enum | NOT NULL, DEFAULT 'pending' | 状态 |
| currency | varchar(5) | NOT NULL, DEFAULT 'USD' | 货币 |
| subtotal | decimal(10,2) | NOT NULL | 小计 |
| shipping_cost | decimal(10,2) | NOT NULL, DEFAULT 0 | 运费 |
| tax_amount | decimal(10,2) | NOT NULL, DEFAULT 0 | 税费 |
| discount_amount | decimal(10,2) | NOT NULL, DEFAULT 0 | 折扣金额 |
| total | decimal(10,2) | NOT NULL | 总计 |
| shipping_method | varchar(50) | NULL | 配送方式 |
| notes | text | NULL | 备注 |
| ip_address | varchar(45) | NULL | IP地址 |
| user_agent | varchar(500) | NULL | 用户代理 |
| paid_at | datetime | NULL | 支付时间 |
| shipped_at | datetime | NULL | 发货时间 |
| delivered_at | datetime | NULL | 送达时间 |
| cancelled_at | datetime | NULL | 取消时间 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**订单状态枚举**: pending, paid, processing, shipped, delivered, cancelled, refunded

### 9. order_items (订单项表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 订单项唯一标识 |
| order_id | varchar(36) | NOT NULL, FK → orders(id) | 订单ID |
| product_id | varchar(36) | NOT NULL, FK → products(id) | 商品ID |
| variant_id | varchar(36) | NOT NULL, FK → product_variants(id) | 变体ID |
| product_name | varchar(255) | NOT NULL | 商品名称 |
| variant_description | varchar(200) | NULL | 变体描述 |
| quantity | int | NOT NULL | 数量 |
| unit_price | decimal(10,2) | NOT NULL | 单价 |
| total_price | decimal(10,2) | NOT NULL | 总价 |
| created_at | datetime | NOT NULL | 创建时间 |

### 10. payments (支付表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 支付唯一标识 |
| order_id | varchar(36) | NOT NULL, FK → orders(id) | 订单ID |
| provider | enum | NOT NULL | 支付方式: stripe/paypal/alipay |
| transaction_id | varchar(255) | NULL | 交易ID |
| status | enum | NOT NULL, DEFAULT 'pending' | 状态 |
| amount | decimal(10,2) | NOT NULL | 金额 |
| currency | varchar(5) | NOT NULL | 货币 |
| fee_amount | decimal(10,2) | NULL | 手续费 |
| metadata | text | NULL | 元数据 |
| raw_response | text | NULL | 原始响应 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**支付状态枚举**: pending, processing, succeeded, failed, refunded, partially_refunded

### 11. shipments (发货表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 发货唯一标识 |
| order_id | varchar(36) | NOT NULL, FK → orders(id) | 订单ID |
| carrier | enum | NOT NULL | 快递公司: dhl/ups/fedex/other |
| tracking_number | varchar(100) | NULL | 追踪号 |
| tracking_url | varchar(500) | NULL | 追踪URL |
| status | enum | NOT NULL, DEFAULT 'pending' | 状态 |
| weight_kg | decimal(6,3) | NULL | 重量(kg) |
| dimensions_cm | varchar(30) | NULL | 尺寸(cm) |
| estimated_delivery | datetime | NULL | 预计送达 |
| shipped_at | datetime | NULL | 发货时间 |
| delivered_at | datetime | NULL | 送达时间 |
| label_url | varchar(500) | NULL | 运单URL |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**发货状态枚举**: pending, label_created, in_transit, out_for_delivery, delivered, exception, returned

### 12. discount_codes (折扣码表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 折扣码唯一标识 |
| code | varchar(50) | NOT NULL, UNIQUE | 折扣码 |
| type | enum | NOT NULL | 类型: percentage/fixed_amount |
| value | decimal(10,2) | NOT NULL | 值 |
| min_order_amount | decimal(10,2) | NULL | 最低订单金额 |
| max_uses | int | NULL | 最大使用次数 |
| current_uses | int | NOT NULL, DEFAULT 0 | 当前使用次数 |
| valid_from | datetime | NOT NULL | 开始时间 |
| valid_until | datetime | NULL | 结束时间 |
| is_active | tinyint | NOT NULL, DEFAULT 1 | 是否启用 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

### 13. reviews (评价表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 评价唯一标识 |
| user_id | varchar(36) | NOT NULL, FK → users(id) | 用户ID |
| product_id | varchar(36) | NOT NULL, FK → products(id) | 商品ID |
| order_id | varchar(36) | NULL, FK → orders(id) | 订单ID |
| rating | tinyint | NOT NULL | 评分(1-5) |
| title | varchar(255) | NULL | 标题 |
| content | text | NULL | 内容 |
| status | enum | NOT NULL, DEFAULT 'pending' | 状态 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**评价状态枚举**: pending, approved, rejected

### 14. wishlist_items (心愿单表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 心愿单项唯一标识 |
| user_id | varchar(36) | NOT NULL, FK → users(id) | 用户ID |
| product_id | varchar(36) | NOT NULL, FK → products(id) | 商品ID |
| created_at | datetime | NOT NULL | 创建时间 |

### 15. password_resets (密码重置表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(36) | PRIMARY KEY | 重置记录唯一标识 |
| user_id | varchar(36) | NOT NULL, FK → users(id) | 用户ID |
| token | varchar(255) | NOT NULL, UNIQUE | 重置令牌 |
| expires_at | datetime | NOT NULL | 过期时间 |
| used | tinyint | NOT NULL, DEFAULT 0 | 是否已使用 |
| created_at | datetime | NOT NULL | 创建时间 |

---

## 索引列表

| 表名 | 索引名 | 字段 |
|------|--------|------|
| users | idx_users_email | email |
| users | idx_users_role | role |
| addresses | idx_addresses_user | user_id |
| categories | idx_categories_slug | slug |
| products | idx_products_slug | slug |
| products | idx_products_series | series |
| products | idx_products_bestseller | is_bestseller |
| product_variants | idx_variants_product | product_id |
| product_variants | idx_variants_sku | sku |
| product_images | idx_images_product | product_id |
| orders | idx_orders_user | user_id |
| orders | idx_orders_status | status |
| orders | idx_orders_created | created_at |
| order_items | idx_orderitems_order | order_id |
| payments | idx_payments_order | order_id |
| payments | idx_payments_transaction | transaction_id |
| shipments | idx_shipments_order | order_id |
| shipments | idx_shipments_tracking | tracking_number |
| discount_codes | idx_discount_code | code |
| reviews | idx_reviews_product | product_id |
| password_resets | idx_pwdreset_token | token |

---

## 外键关系图

```
users ──┬──> addresses (user_id)
        ├──> cart_items (user_id)
        ├──> orders (user_id)
        ├──> reviews (user_id)
        ├──> wishlist_items (user_id)
        └──> password_resets (user_id)

products ──┬──> product_variants (product_id)
           ├──> product_images (product_id)
           ├──> order_items (product_id)
           ├──> reviews (product_id)
           └──> wishlist_items (product_id)

orders ──┬──> order_items (order_id)
         ├──> payments (order_id)
         └──> shipments (order_id)

addresses ──> orders (shipping_address_id, billing_address_id)

product_variants ──> cart_items (variant_id)
product_variants ──> order_items (variant_id)

categories ──> products (category_id)

discount_codes ──> orders (discount_code_id)
```

---

*文档生成时间: 2026-05-25*
