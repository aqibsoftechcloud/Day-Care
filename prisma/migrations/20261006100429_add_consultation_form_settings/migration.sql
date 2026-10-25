-- CreateTable
CREATE TABLE `consultation_form_settings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `form_title` VARCHAR(255) NOT NULL,
    `form_description` VARCHAR(500) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
