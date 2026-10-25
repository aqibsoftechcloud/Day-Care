-- AlterTable
ALTER TABLE `gallery` ADD COLUMN `hospital_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `sorting_order` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `hospital_sections` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER UNSIGNED NOT NULL,
    `section_type` ENUM('hero', 'overview', 'why_choose_us', 'cta', 'disclaimer', 'custom') NOT NULL,
    `section_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `content` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_hospital_sections_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_sections_section_order`(`section_order`),
    INDEX `idx_hospital_sections_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insurance_companies` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `logo` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_insurance_companies_name`(`name`),
    UNIQUE INDEX `uq_insurance_companies_seo_url`(`seo_url`),
    INDEX `idx_insurance_companies_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospital_insurance_companies` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER UNSIGNED NOT NULL,
    `insurance_company_id` INTEGER UNSIGNED NOT NULL,
    `sorting_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_hospital_insurance_companies_insurance_company_id`(`insurance_company_id`),
    INDEX `idx_hospital_insurance_companies_sorting_order`(`sorting_order`),
    INDEX `idx_hospital_insurance_companies_status`(`status`),
    UNIQUE INDEX `uq_hospital_insurance_companies_mapping`(`hospital_id`, `insurance_company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_gallery_hospital_id` ON `gallery`(`hospital_id`);

-- CreateIndex
CREATE INDEX `idx_gallery_sorting_order` ON `gallery`(`sorting_order`);

-- AddForeignKey
ALTER TABLE `gallery` ADD CONSTRAINT `fk_gallery_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospital_sections` ADD CONSTRAINT `fk_hospital_sections_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospital_insurance_companies` ADD CONSTRAINT `fk_hospital_insurance_companies_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospital_insurance_companies` ADD CONSTRAINT `fk_hospital_insurance_companies_insurance_company` FOREIGN KEY (`insurance_company_id`) REFERENCES `insurance_companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
