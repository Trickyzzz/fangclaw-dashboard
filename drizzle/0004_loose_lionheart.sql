CREATE TABLE `factorTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`category` varchar(50) NOT NULL,
	`crossCategory` varchar(50),
	`description` text,
	`signalDefinition` text,
	`dataSources` json,
	`applicableMarkets` json,
	`historicalWinRate` float,
	`avgDurationDays` int,
	`priority` int NOT NULL DEFAULT 5,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `factorTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `factorTemplates_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `indicators` ADD `crossDimension` varchar(50);--> statement-breakpoint
ALTER TABLE `indicators` ADD `firstTriggeredAt` timestamp;--> statement-breakpoint
ALTER TABLE `indicators` ADD `triggerCount` int DEFAULT 0 NOT NULL;