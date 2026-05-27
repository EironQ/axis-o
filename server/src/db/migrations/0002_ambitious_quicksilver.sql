CREATE TABLE `banners` (
	`id` varchar(36) NOT NULL,
	`image` varchar(500) NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(500) NOT NULL DEFAULT '',
	`link` varchar(500) NOT NULL DEFAULT '/products',
	`link_text` varchar(100) NOT NULL DEFAULT 'Shop Now',
	`tags` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_banners_sort` ON `banners` (`sort_order`);