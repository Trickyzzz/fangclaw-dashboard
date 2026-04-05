CREATE TABLE `dailyReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDate` varchar(10) NOT NULL,
	`content` json,
	`pushStatus` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailyReports_reportDate_unique` UNIQUE(`reportDate`)
);
--> statement-breakpoint
CREATE TABLE `shareTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`evidenceId` varchar(50) NOT NULL,
	`sharedBy` int,
	`viewCount` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shareTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `shareTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('email','feishu','wecom') NOT NULL,
	`channelAddress` text NOT NULL,
	`frequency` enum('realtime','daily','weekly') NOT NULL DEFAULT 'daily',
	`watchCompanies` json,
	`watchDimensions` json,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contact` varchar(320) NOT NULL,
	`contactType` enum('email','wechat') NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`status` enum('active','expired','converted') NOT NULL DEFAULT 'active',
	`pushCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trials_id` PRIMARY KEY(`id`)
);
