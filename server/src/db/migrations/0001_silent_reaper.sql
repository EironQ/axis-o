CREATE TABLE `payment_events` (
	`id` varchar(36) NOT NULL,
	`payment_id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`event_type` enum('intent_created','intent_succeeded','intent_failed','intent_canceled','refund_requested','refund_succeeded','refund_failed','status_synced','webhook_received') NOT NULL,
	`provider` enum('stripe','paypal','alipay') NOT NULL,
	`provider_event_id` varchar(255),
	`amount` decimal(10,2),
	`currency` varchar(5),
	`fee_amount` decimal(10,2),
	`status_before` varchar(30),
	`status_after` varchar(30),
	`raw_data` text,
	`notes` varchar(500),
	`created_at` datetime NOT NULL,
	CONSTRAINT `payment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_detail_images` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`image` varchar(500) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `product_detail_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` varchar(36) NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`group` varchar(50) NOT NULL,
	`description` varchar(255),
	`updated_at` datetime NOT NULL,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `payment_events` ADD CONSTRAINT `payment_events_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_events` ADD CONSTRAINT `payment_events_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_detail_images` ADD CONSTRAINT `product_detail_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_payment_events_payment` ON `payment_events` (`payment_id`);--> statement-breakpoint
CREATE INDEX `idx_payment_events_order` ON `payment_events` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_payment_events_type` ON `payment_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_detail_images_product` ON `product_detail_images` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_settings_group` ON `settings` (`group`);