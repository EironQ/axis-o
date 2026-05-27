# AXIS O 数据库 DDL

## 创建数据库

```sql
CREATE DATABASE axis_o CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE axis_o;
```

## 用户表

```sql
CREATE TABLE users (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  phone           VARCHAR(30)  NULL,
  avatar_url      VARCHAR(500) NULL,
  role            ENUM('customer','admin','super_admin') NOT NULL DEFAULT 'customer',
  status          ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  preferred_language ENUM('en','zh') NOT NULL DEFAULT 'en',
  preferred_currency VARCHAR(5) NOT NULL DEFAULT 'USD',
  last_login_at   DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 地址表

```sql
CREATE TABLE addresses (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id      VARCHAR(36)  NOT NULL,
  type         ENUM('shipping','billing') NOT NULL DEFAULT 'shipping',
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  line1        VARCHAR(255) NOT NULL,
  line2        VARCHAR(255) NULL,
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100) NULL,
  postal_code  VARCHAR(30)  NOT NULL,
  country      VARCHAR(2)   NOT NULL COMMENT 'ISO 3166-1 alpha-2',
  phone        VARCHAR(30)  NULL,
  is_default   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 分类表

```sql
CREATE TABLE categories (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  name_en    VARCHAR(100) NOT NULL,
  name_zh    VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  parent_id  VARCHAR(36)  NULL,
  image_url  VARCHAR(500) NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 产品表

```sql
CREATE TABLE products (
  id               VARCHAR(36)   NOT NULL PRIMARY KEY,
  name_en          VARCHAR(255)  NOT NULL,
  name_zh          VARCHAR(255)  NOT NULL,
  slug             VARCHAR(255)  NOT NULL UNIQUE,
  description_en   TEXT          NULL,
  description_zh   TEXT          NULL,
  story_en         TEXT          NULL,
  story_zh         TEXT          NULL,
  category_id      VARCHAR(36)   NULL,
  series           ENUM('classic','luxe','travel') NOT NULL,
  material         VARCHAR(200)  NULL,
  care_instructions TEXT         NULL,
  base_price       DECIMAL(10,2) NOT NULL,
  is_bestseller    TINYINT(1)    NOT NULL DEFAULT 0,
  is_active        TINYINT(1)    NOT NULL DEFAULT 1,
  sort_order       INT           NOT NULL DEFAULT 0,
  meta_title_en    VARCHAR(255)  NULL,
  meta_title_zh    VARCHAR(255)  NULL,
  meta_description_en TEXT       NULL,
  meta_description_zh TEXT       NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_products_slug (slug),
  INDEX idx_products_series (series),
  INDEX idx_products_category (category_id),
  INDEX idx_products_bestseller (is_bestseller),
  FULLTEXT idx_products_search (name_en, name_zh, description_en, description_zh)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 产品变体表 (SKU)

```sql
CREATE TABLE product_variants (
  id                  VARCHAR(36)   NOT NULL PRIMARY KEY,
  product_id          VARCHAR(36)   NOT NULL,
  color_name          VARCHAR(50)   NOT NULL,
  color_hex           VARCHAR(7)    NULL COMMENT 'e.g. #C89460',
  size                VARCHAR(30)   NOT NULL,
  sku                 VARCHAR(100)  NOT NULL UNIQUE,
  price_adjustment    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_quantity      INT           NOT NULL DEFAULT 0,
  low_stock_threshold INT           NOT NULL DEFAULT 5,
  is_active           TINYINT(1)    NOT NULL DEFAULT 1,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variants_product (product_id),
  INDEX idx_variants_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 产品图片表

```sql
CREATE TABLE product_images (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  product_id VARCHAR(36)  NOT NULL,
  url        VARCHAR(500) NOT NULL,
  alt_text   VARCHAR(255) NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  is_primary TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_images_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 购物车表

```sql
CREATE TABLE cart_items (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  variant_id VARCHAR(36) NOT NULL,
  quantity   INT         NOT NULL DEFAULT 1,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY uk_cart_user_variant (user_id, variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 订单表

```sql
CREATE TABLE orders (
  id                  VARCHAR(36)   NOT NULL PRIMARY KEY,
  order_number        VARCHAR(20)   NOT NULL UNIQUE COMMENT 'e.g. AX-20260525-0001',
  user_id             VARCHAR(36)   NOT NULL,
  shipping_address_id VARCHAR(36)   NOT NULL,
  billing_address_id  VARCHAR(36)   NOT NULL,
  discount_code_id    VARCHAR(36)   NULL,
  status              ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  currency            VARCHAR(5)    NOT NULL DEFAULT 'USD',
  subtotal            DECIMAL(10,2) NOT NULL,
  shipping_cost       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(10,2) NOT NULL,
  shipping_method     VARCHAR(50)   NULL COMMENT 'dhl_express, fedex_priority, etc.',
  notes               TEXT          NULL,
  ip_address          VARCHAR(45)   NULL,
  user_agent          VARCHAR(500)  NULL,
  paid_at             DATETIME      NULL,
  shipped_at          DATETIME      NULL,
  delivered_at        DATETIME      NULL,
  cancelled_at        DATETIME      NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (shipping_address_id) REFERENCES addresses(id),
  FOREIGN KEY (billing_address_id) REFERENCES addresses(id),
  FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE SET NULL,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_number (order_number),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 订单项表

```sql
CREATE TABLE order_items (
  id                   VARCHAR(36)   NOT NULL PRIMARY KEY,
  order_id             VARCHAR(36)   NOT NULL,
  product_id           VARCHAR(36)   NOT NULL,
  variant_id           VARCHAR(36)   NOT NULL,
  product_name         VARCHAR(255)  NOT NULL COMMENT '快照名称（下单时语言版本）',
  variant_description  VARCHAR(200)  NULL COMMENT '颜色 + 尺寸描述',
  quantity             INT           NOT NULL,
  unit_price           DECIMAL(10,2) NOT NULL COMMENT '下单时单价',
  total_price          DECIMAL(10,2) NOT NULL,
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_orderitems_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 支付记录表

```sql
CREATE TABLE payments (
  id             VARCHAR(36)   NOT NULL PRIMARY KEY,
  order_id       VARCHAR(36)   NOT NULL,
  provider       ENUM('stripe','paypal','alipay') NOT NULL,
  transaction_id VARCHAR(255)  NULL COMMENT 'Stripe PaymentIntent ID / PayPal Order ID / Alipay Trade No',
  status         ENUM('pending','processing','succeeded','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  amount         DECIMAL(10,2) NOT NULL,
  currency       VARCHAR(5)    NOT NULL,
  fee_amount     DECIMAL(10,2) NULL COMMENT '支付手续费',
  metadata       JSON          NULL,
  raw_response   JSON          NULL COMMENT '支付网关原始回调数据',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_transaction (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 物流表

```sql
CREATE TABLE shipments (
  id                   VARCHAR(36)  NOT NULL PRIMARY KEY,
  order_id             VARCHAR(36)  NOT NULL,
  carrier              ENUM('dhl','ups','fedex','other') NOT NULL,
  tracking_number      VARCHAR(100) NULL,
  tracking_url         VARCHAR(500) NULL,
  status               ENUM('pending','label_created','in_transit','out_for_delivery','delivered','exception','returned') NOT NULL DEFAULT 'pending',
  weight_kg            DECIMAL(6,3) NULL,
  dimensions_cm        VARCHAR(30)  NULL COMMENT 'LxWxH cm',
  estimated_delivery   DATE         NULL,
  shipped_at           DATETIME     NULL,
  delivered_at         DATETIME     NULL,
  label_url            VARCHAR(500) NULL COMMENT '物流面单 PDF URL',
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_shipments_order (order_id),
  INDEX idx_shipments_tracking (tracking_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 优惠码表

```sql
CREATE TABLE discount_codes (
  id               VARCHAR(36)   NOT NULL PRIMARY KEY,
  code             VARCHAR(50)   NOT NULL UNIQUE,
  type             ENUM('percentage','fixed_amount') NOT NULL,
  value            DECIMAL(10,2) NOT NULL COMMENT '百分比(10=10%) 或 固定金额',
  min_order_amount DECIMAL(10,2) NULL,
  max_uses         INT           NULL COMMENT 'NULL = 无限',
  current_uses     INT           NOT NULL DEFAULT 0,
  valid_from       DATETIME      NOT NULL,
  valid_until      DATETIME      NULL COMMENT 'NULL = 永不过期',
  is_active        TINYINT(1)    NOT NULL DEFAULT 1,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_discount_code (code),
  INDEX idx_discount_active (is_active, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 评价表

```sql
CREATE TABLE reviews (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  product_id VARCHAR(36)  NOT NULL,
  order_id   VARCHAR(36)  NULL COMMENT '关联订单，确保已购买',
  rating     TINYINT      NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title      VARCHAR(255) NULL,
  content    TEXT         NULL,
  status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_review_user_product (user_id, product_id),
  INDEX idx_reviews_product (product_id),
  INDEX idx_reviews_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 收藏夹表

```sql
CREATE TABLE wishlist_items (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_wishlist_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 密码重置表

```sql
CREATE TABLE password_resets (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pwdreset_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 种子数据：分类

```sql
INSERT INTO categories (id, name_en, name_zh, slug, sort_order) VALUES
  (UUID(), 'Tote Bags', '托特包', 'tote-bags', 1),
  (UUID(), 'Crossbody Bags', '斜挎包', 'crossbody-bags', 2),
  (UUID(), 'Shoulder Bags', '肩背包', 'shoulder-bags', 3),
  (UUID(), 'Backpacks', '双肩包', 'backpacks', 4),
  (UUID(), 'Clutches', '手包', 'clutches', 5),
  (UUID(), 'Chain Bags', '链条包', 'chain-bags', 6),
  (UUID(), 'Top Handle Bags', '手提包', 'top-handle-bags', 7),
  (UUID(), 'Travel Bags', '旅行袋', 'travel-bags', 8),
  (UUID(), 'Wallets', '钱包', 'wallets', 9),
  (UUID(), 'Card Holders', '卡包', 'card-holders', 10),
  (UUID(), 'Cosmetic Pouches', '化妆包', 'cosmetic-pouches', 11);
```
