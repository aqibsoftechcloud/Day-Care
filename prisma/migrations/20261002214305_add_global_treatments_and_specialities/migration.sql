-- AlterTable
ALTER TABLE `specialities` ADD COLUMN `global_speciality_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `treatments` ADD COLUMN `global_treatment_id` INTEGER UNSIGNED NULL;

-- CreateTable
CREATE TABLE `global_treatments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `treatment_name` VARCHAR(255) NOT NULL,
    `treatment_title` VARCHAR(255) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `short_description` TEXT NULL,
    `description` LONGTEXT NULL,
    `image` VARCHAR(500) NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keyword` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_global_treatments_seo_url`(`seo_url`),
    INDEX `idx_global_treatments_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_treatment_sections` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `global_treatment_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NULL,
    `image` VARCHAR(500) NULL,
    `section_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_global_treatment_sections_treatment_id`(`global_treatment_id`),
    INDEX `idx_global_treatment_sections_status`(`status`),
    INDEX `idx_global_treatment_sections_sorting_order`(`section_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_treatment_faqs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `global_treatment_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `text` TEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_global_treatment_faqs_treatment_id`(`global_treatment_id`),
    INDEX `idx_global_treatment_faqs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_specialities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `speciality_name` VARCHAR(255) NOT NULL,
    `speciality_title` VARCHAR(255) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `short_description` TEXT NULL,
    `description` LONGTEXT NULL,
    `image` VARCHAR(500) NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keyword` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_global_specialities_seo_url`(`seo_url`),
    INDEX `idx_global_specialities_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_speciality_sections` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `global_speciality_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NULL,
    `image` VARCHAR(500) NULL,
    `section_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_global_speciality_sections_speciality_id`(`global_speciality_id`),
    INDEX `idx_global_speciality_sections_status`(`status`),
    INDEX `idx_global_speciality_sections_sorting_order`(`section_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_speciality_faqs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `global_speciality_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `text` TEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_global_speciality_faqs_speciality_id`(`global_speciality_id`),
    INDEX `idx_global_speciality_faqs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_specialities_global_speciality_id` ON `specialities`(`global_speciality_id`);

-- CreateIndex
CREATE INDEX `idx_treatments_global_treatment_id` ON `treatments`(`global_treatment_id`);

-- AddForeignKey
ALTER TABLE `global_treatment_sections` ADD CONSTRAINT `fk_global_treatment_sections_treatment` FOREIGN KEY (`global_treatment_id`) REFERENCES `global_treatments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `global_treatment_faqs` ADD CONSTRAINT `fk_global_treatment_faqs_treatment` FOREIGN KEY (`global_treatment_id`) REFERENCES `global_treatments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `global_speciality_sections` ADD CONSTRAINT `fk_global_speciality_sections_speciality` FOREIGN KEY (`global_speciality_id`) REFERENCES `global_specialities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `global_speciality_faqs` ADD CONSTRAINT `fk_global_speciality_faqs_speciality` FOREIGN KEY (`global_speciality_id`) REFERENCES `global_specialities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialities` ADD CONSTRAINT `fk_specialities_global_speciality` FOREIGN KEY (`global_speciality_id`) REFERENCES `global_specialities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatments` ADD CONSTRAINT `fk_treatments_global_treatment` FOREIGN KEY (`global_treatment_id`) REFERENCES `global_treatments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
