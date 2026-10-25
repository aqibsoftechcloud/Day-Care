-- CreateTable
CREATE TABLE `homepage_custom_icons` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `width` INTEGER UNSIGNED NULL,
    `height` INTEGER UNSIGNED NULL,
    `file_size` INTEGER UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_homepage_custom_icons_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
