-- AXIS O Database Initialization Script
-- Run this script in MySQL to create the database and all tables

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `axis_o` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `axis_o`;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(30),
	`avatar_url` varchar(500),
	`role` enum('customer','admin','super_admin') NOT NULL DEFAULT 'customer',
	`status` enum('active','inactive','banned') NOT NULL DEFAULT 'active',
	`preferred_language` enum('en','zh') NOT NULL DEFAULT 'en',
	`preferred_currency` varchar(5) NOT NULL DEFAULT 'USD',
	`last_login_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

-- ============================================
-- Table: addresses
-- ============================================
CREATE TABLE `addresses` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` enum('shipping','billing') NOT NULL DEFAULT 'shipping',
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`line1` varchar(255) NOT NULL,
	`line2` varchar(255),
	`city` varchar(100) NOT NULL,
	`state` varchar(100),
	`postal_code` varchar(30) NOT NULL,
	`country` varchar(2) NOT NULL,
	`phone` varchar(30),
	`is_default` tinyint NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);

-- ============================================
-- Table: categories
-- ============================================
CREATE TABLE `categories` (
	`id` varchar(36) NOT NULL,
	`name_en` varchar(100) NOT NULL,
	`name_zh` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`parent_id` varchar(36),
	`image_url` varchar(500),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);

-- ============================================
-- Table: products
-- ============================================
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`name_en` varchar(255) NOT NULL,
	`name_zh` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description_en` text,
	`description_zh` text,
	`story_en` text,
	`story_zh` text,
	`category_id` varchar(36),
	`series` enum('classic','luxe','travel') NOT NULL,
	`material` varchar(200),
	`care_instructions` text,
	`base_price` decimal(10,2) NOT NULL,
	`is_bestseller` tinyint NOT NULL DEFAULT 0,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	`meta_title_en` varchar(255),
	`meta_title_zh` varchar(255),
	`meta_description_en` text,
	`meta_description_zh` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);

-- ============================================
-- Table: product_variants
-- ============================================
CREATE TABLE `product_variants` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`color_name` varchar(50) NOT NULL,
	`color_hex` varchar(7),
	`size` varchar(30) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`price_adjustment` decimal(10,2) NOT NULL DEFAULT '0.00',
	`stock_quantity` int NOT NULL DEFAULT 0,
	`low_stock_threshold` int NOT NULL DEFAULT 5,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`)
);

-- ============================================
-- Table: product_images
-- ============================================
CREATE TABLE `product_images` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`url` varchar(500) NOT NULL,
	`alt_text` varchar(255),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_primary` tinyint NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);

-- ============================================
-- Table: cart_items
-- ============================================
CREATE TABLE `cart_items` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`variant_id` varchar(36) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_cart_user_variant` UNIQUE(`user_id`,`variant_id`)
);

-- ============================================
-- Table: orders
-- ============================================
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`order_number` varchar(20) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`shipping_address_id` varchar(36) NOT NULL,
	`billing_address_id` varchar(36) NOT NULL,
	`discount_code_id` varchar(36),
	`status` enum('pending','paid','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`currency` varchar(5) NOT NULL DEFAULT 'USD',
	`subtotal` decimal(10,2) NOT NULL,
	`shipping_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tax_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`shipping_method` varchar(50),
	`notes` text,
	`ip_address` varchar(45),
	`user_agent` varchar(500),
	`paid_at` datetime,
	`shipped_at` datetime,
	`delivered_at` datetime,
	`cancelled_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);

-- ============================================
-- Table: order_items
-- ============================================
CREATE TABLE `order_items` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`variant_id` varchar(36) NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`variant_description` varchar(200),
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	`total_price` decimal(10,2) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);

-- ============================================
-- Table: payments
-- ============================================
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`provider` enum('stripe','paypal','alipay') NOT NULL,
	`transaction_id` varchar(255),
	`status` enum('pending','processing','succeeded','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(5) NOT NULL,
	`fee_amount` decimal(10,2),
	`metadata` text,
	`raw_response` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);

-- ============================================
-- Table: shipments
-- ============================================
CREATE TABLE `shipments` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`carrier` enum('dhl','ups','fedex','other') NOT NULL,
	`tracking_number` varchar(100),
	`tracking_url` varchar(500),
	`status` enum('pending','label_created','in_transit','out_for_delivery','delivered','exception','returned') NOT NULL DEFAULT 'pending',
	`weight_kg` decimal(6,3),
	`dimensions_cm` varchar(30),
	`estimated_delivery` datetime,
	`shipped_at` datetime,
	`delivered_at` datetime,
	`label_url` varchar(500),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);

-- ============================================
-- Table: discount_codes
-- ============================================
CREATE TABLE `discount_codes` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`type` enum('percentage','fixed_amount') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`min_order_amount` decimal(10,2),
	`max_uses` int,
	`current_uses` int NOT NULL DEFAULT 0,
	`valid_from` datetime NOT NULL,
	`valid_until` datetime,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `discount_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `discount_codes_code_unique` UNIQUE(`code`)
);

-- ============================================
-- Table: reviews
-- ============================================
CREATE TABLE `reviews` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`order_id` varchar(36),
	`rating` tinyint NOT NULL,
	`title` varchar(255),
	`content` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_review_user_product` UNIQUE(`user_id`,`product_id`)
);

-- ============================================
-- Table: wishlist_items
-- ============================================
CREATE TABLE `wishlist_items` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `wishlist_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_wishlist_user_product` UNIQUE(`user_id`,`product_id`)
);

-- ============================================
-- Table: password_resets
-- ============================================
CREATE TABLE `password_resets` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used` tinyint NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_resets_token_unique` UNIQUE(`token`)
);

-- ============================================
-- Foreign Keys
-- ============================================
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `orders` ADD CONSTRAINT `orders_shipping_address_id_addresses_id_fk` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `orders` ADD CONSTRAINT `orders_billing_address_id_addresses_id_fk` FOREIGN KEY (`billing_address_id`) REFERENCES `addresses`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX `idx_users_email` ON `users` (`email`);
CREATE INDEX `idx_users_role` ON `users` (`role`);
CREATE INDEX `idx_addresses_user` ON `addresses` (`user_id`);
CREATE INDEX `idx_categories_slug` ON `categories` (`slug`);
CREATE INDEX `idx_products_slug` ON `products` (`slug`);
CREATE INDEX `idx_products_series` ON `products` (`series`);
CREATE INDEX `idx_products_bestseller` ON `products` (`is_bestseller`);
CREATE INDEX `idx_variants_product` ON `product_variants` (`product_id`);
CREATE INDEX `idx_variants_sku` ON `product_variants` (`sku`);
CREATE INDEX `idx_images_product` ON `product_images` (`product_id`);
CREATE INDEX `idx_orders_user` ON `orders` (`user_id`);
CREATE INDEX `idx_orders_status` ON `orders` (`status`);
CREATE INDEX `idx_orders_created` ON `orders` (`created_at`);
CREATE INDEX `idx_orderitems_order` ON `order_items` (`order_id`);
CREATE INDEX `idx_payments_order` ON `payments` (`order_id`);
CREATE INDEX `idx_payments_transaction` ON `payments` (`transaction_id`);
CREATE INDEX `idx_shipments_order` ON `shipments` (`order_id`);
CREATE INDEX `idx_shipments_tracking` ON `shipments` (`tracking_number`);
CREATE INDEX `idx_discount_code` ON `discount_codes` (`code`);
CREATE INDEX `idx_reviews_product` ON `reviews` (`product_id`);
CREATE INDEX `idx_pwdreset_token` ON `password_resets` (`token`);

-- ============================================
-- Done!
-- ============================================
SELECT 'Database initialized successfully!' AS message;
