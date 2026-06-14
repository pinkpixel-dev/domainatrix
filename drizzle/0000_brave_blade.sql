CREATE TABLE `dns_records` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`record_type` text NOT NULL,
	`record_value` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dns_records_unique` ON `dns_records` (`domain_id`,`record_type`,`record_value`);--> statement-breakpoint
CREATE TABLE `domain_costings` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`purchase_price` real DEFAULT 0,
	`renewal_cost` real DEFAULT 0,
	`current_value` real DEFAULT 0,
	`auto_renew` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `domain_hosts` (
	`domain_id` text NOT NULL,
	`host_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`host_id`) REFERENCES `hosts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domain_hosts_unique` ON `domain_hosts` (`domain_id`,`host_id`);--> statement-breakpoint
CREATE TABLE `domain_links` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`link_name` text NOT NULL,
	`link_url` text NOT NULL,
	`link_description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `domain_statuses` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`status_code` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `domain_tags` (
	`domain_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domain_tags_unique` ON `domain_tags` (`domain_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `domain_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`domain_id` text NOT NULL,
	`change` text NOT NULL,
	`change_type` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`domain_name` text NOT NULL,
	`expiry_date` text,
	`notes` text,
	`registrar_id` text,
	`registration_date` text,
	`updated_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`registrar_id`) REFERENCES `registrars`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domains_user_domain_unique` ON `domains` (`user_id`,`domain_name`);--> statement-breakpoint
CREATE TABLE `hosts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ip` text NOT NULL,
	`lat` real,
	`lon` real,
	`isp` text,
	`org` text,
	`as_number` text,
	`city` text,
	`region` text,
	`country` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hosts_user_ip_unique` ON `hosts` (`user_id`,`ip`);--> statement-breakpoint
CREATE TABLE `ip_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`ip_address` text NOT NULL,
	`is_ipv6` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`notification_type` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preferences_unique` ON `notification_preferences` (`domain_id`,`notification_type`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`domain_id` text NOT NULL,
	`change_type` text NOT NULL,
	`message` text,
	`sent` integer DEFAULT false NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `registrars` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrars_user_name_unique` ON `registrars` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `ssl_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`issuer` text,
	`issuer_country` text,
	`subject` text,
	`valid_from` text,
	`valid_to` text,
	`fingerprint` text,
	`key_size` integer,
	`signature_algorithm` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sub_domains` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`name` text NOT NULL,
	`sd_info` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`description` text,
	`icon` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_user_name_unique` ON `tags` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `uptime` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`checked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_up` integer NOT NULL,
	`response_code` integer,
	`response_time_ms` real,
	`dns_lookup_time_ms` real,
	`ssl_handshake_time_ms` real,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whois_info` (
	`id` text PRIMARY KEY NOT NULL,
	`domain_id` text NOT NULL,
	`country` text,
	`state` text,
	`name` text,
	`organization` text,
	`street` text,
	`city` text,
	`postal_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
