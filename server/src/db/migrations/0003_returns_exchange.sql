CREATE TABLE `returns` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` enum('return', 'exchange', 'refund') NOT NULL DEFAULT 'return',
	`status` enum('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
	`reason` enum('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'arrived_late', 'other') NOT NULL,
	`reason_detail` text,
	`images` text,
	`admin_note` text,
	`processed_by` varchar(36),
	`processed_at` datetime,
	`refund_amount` decimal(10, 2),
	`refund_reason` text,
	`completed_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `returns_id` PRIMARY KEY(`id`),
	CONSTRAINT `returns_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `returns_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE
);
--> statement-breakpoint
CREATE INDEX `idx_returns_order` ON `returns` (`order_id`);
--> statement-breakpoint
CREATE INDEX `idx_returns_user` ON `returns` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_returns_status` ON `returns` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_returns_created` ON `returns` (`created_at`);
--> statement-breakpoint
CREATE TABLE `return_items` (
	`id` varchar(36) NOT NULL,
	`return_id` varchar(36) NOT NULL,
	`order_item_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`variant_id` varchar(36) NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`variant_description` varchar(200),
	`quantity` int NOT NULL DEFAULT 1,
	`new_variant_id` varchar(36),
	`new_product_name` varchar(255),
	`created_at` datetime NOT NULL,
	CONSTRAINT `return_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `return_items_return_id` FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `return_items_order_item_id` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE CASCADE
);
--> statement-breakpoint
CREATE INDEX `idx_return_items_return` ON `return_items` (`return_id`);
--> statement-breakpoint
CREATE TABLE `return_logs` (
	`id` varchar(36) NOT NULL,
	`return_id` varchar(36) NOT NULL,
	`action` enum('created', 'status_changed', 'note_added', 'image_added', 'refund_initiated', 'refund_completed') NOT NULL,
	`from_status` varchar(30),
	`to_status` varchar(30),
	`operator_id` varchar(36),
	`operator_type` enum('user', 'admin', 'system') NOT NULL,
	`note` text,
	`created_at` datetime NOT NULL,
	CONSTRAINT `return_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `return_logs_return_id` FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
--> statement-breakpoint
CREATE INDEX `idx_return_logs_return` ON `return_logs` (`return_id`);