-- Shared rate-limit counters (login brute force, public lead form). A DB table is used because
-- the app has no other shared store and must stay correct across multiple instances.
CREATE TABLE `rate_limit_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `bucket` VARCHAR(120) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_rate_limit_events_bucket_created`(`bucket`, `created_at`),
    INDEX `idx_rate_limit_events_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
