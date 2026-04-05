CREATE TABLE `keyVariables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`category` varchar(50) NOT NULL,
	`currentValue` varchar(200) NOT NULL,
	`triggerCondition` text,
	`signal` enum('Bullish','Bearish','Neutral') NOT NULL DEFAULT 'Neutral',
	`impactNote` text,
	`source` varchar(200),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keyVariables_id` PRIMARY KEY(`id`)
);
