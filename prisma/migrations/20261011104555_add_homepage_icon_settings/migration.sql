-- CreateTable
CREATE TABLE `homepage_icon_settings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `city_id` INTEGER UNSIGNED NULL,
    `icons` JSON NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_homepage_icon_settings_city_id`(`city_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `homepage_icon_settings` ADD CONSTRAINT `fk_homepage_icon_settings_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
