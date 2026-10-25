-- CreateTable
CREATE TABLE `page_sections` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `page_id` INTEGER UNSIGNED NOT NULL,
    `section_type` ENUM('hero', 'about', 'features', 'content', 'cta') NOT NULL,
    `section_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `content` JSON NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_page_sections_page_id`(`page_id`),
    INDEX `idx_page_sections_section_order`(`section_order`),
    INDEX `idx_page_sections_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `page_sections` ADD CONSTRAINT `fk_page_sections_page` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
