-- CreateTable
CREATE TABLE `treatment_sections` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `treatment_id` INTEGER UNSIGNED NOT NULL,
    `section_type` ENUM('hero', 'highlights', 'overview', 'facts', 'symptoms', 'options', 'eligibility', 'why_choose_us', 'doctors', 'process', 'journey', 'hospital', 'preparation_recovery', 'faqs', 'cta', 'custom') NOT NULL,
    `section_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `content` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_treatment_sections_treatment_id`(`treatment_id`),
    INDEX `idx_treatment_sections_section_order`(`section_order`),
    INDEX `idx_treatment_sections_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `treatment_sections` ADD CONSTRAINT `fk_treatment_sections_treatment` FOREIGN KEY (`treatment_id`) REFERENCES `treatments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
