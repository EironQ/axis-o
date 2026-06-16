ALTER TABLE `payments` MODIFY COLUMN `provider` enum('stripe','paypal','airwallex','lianlianpay') NOT NULL;
--> statement-breakpoint
ALTER TABLE `payment_events` MODIFY COLUMN `provider` enum('stripe','paypal','airwallex','lianlianpay') NOT NULL;
