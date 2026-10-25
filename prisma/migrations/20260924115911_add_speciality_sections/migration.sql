-- CreateTable
CREATE TABLE `speciality_sections` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `speciality_id` INTEGER UNSIGNED NOT NULL,
    `section_type` ENUM('hero', 'overview', 'treatments', 'symptoms', 'hospital', 'faqs', 'cta') NOT NULL,
    `section_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `content` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_speciality_sections_speciality_id`(`speciality_id`),
    INDEX `idx_speciality_sections_section_order`(`section_order`),
    INDEX `idx_speciality_sections_status`(`status`),
    UNIQUE INDEX `uq_speciality_sections_speciality_type`(`speciality_id`, `section_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `speciality_sections` ADD CONSTRAINT `fk_speciality_sections_speciality` FOREIGN KEY (`speciality_id`) REFERENCES `specialities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
