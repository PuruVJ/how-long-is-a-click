CREATE TABLE `clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`duration` integer NOT NULL,
	`pointer_type` integer NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stats` (
	`type` text PRIMARY KEY NOT NULL,
	`average_duration` integer NOT NULL,
	`count` integer NOT NULL
);
