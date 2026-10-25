-- CreateTable
CREATE TABLE `doctor_awards` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `doctor_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `organization` VARCHAR(255) NULL,
    `award_year` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_doctor_awards_doctor_id`(`doctor_id`),
    INDEX `idx_doctor_awards_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_faqs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `doctor_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `text` TEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_doctor_faqs_doctor_id`(`doctor_id`),
    INDEX `idx_doctor_faqs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doctor_awards` ADD CONSTRAINT `fk_doctor_awards_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_faqs` ADD CONSTRAINT `fk_doctor_faqs_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
