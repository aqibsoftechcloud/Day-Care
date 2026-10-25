-- CreateTable
CREATE TABLE `footer_settings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `brand_primary` VARCHAR(100) NOT NULL,
    `brand_accent` VARCHAR(100) NULL,
    `logo` VARCHAR(500) NULL,
    `description` VARCHAR(1000) NOT NULL,
    `cta_enabled` BOOLEAN NOT NULL DEFAULT true,
    `cta_heading` VARCHAR(255) NOT NULL,
    `cta_description` VARCHAR(500) NOT NULL,
    `cta_button_label` VARCHAR(100) NOT NULL,
    `cta_button_url` VARCHAR(500) NULL,
    `copyright_text` VARCHAR(500) NOT NULL,
    `columns` JSON NOT NULL,
    `contact_items` JSON NULL,
    `social_links` JSON NULL,
    `bottom_links` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: explicit per-page footer placement. Default 'company' = what every page did before.
ALTER TABLE `pages` ADD COLUMN `footer_placement` ENUM('company', 'legal', 'hidden') NOT NULL DEFAULT 'company';

-- Backfill: pages the old slug-keyword heuristic treated as legal documents keep appearing in the legal bar,
-- so the footer looks identical right after this migration. From now on the admin sets it explicitly.
UPDATE `pages` SET `footer_placement` = 'legal'
WHERE LOWER(`seo_url`) LIKE '%privacy%' OR LOWER(`seo_url`) LIKE '%terms%' OR LOWER(`seo_url`) LIKE '%cookie%'
   OR LOWER(`seo_url`) LIKE '%disclaimer%' OR LOWER(`seo_url`) LIKE '%refund%';

-- Admin permission module next to "Contact Page Settings" (Settings parent), View + Update, Super Admin (role 1).
INSERT INTO `modules` (`parent_id`, `name`, `slug`, `sorting_order`, `status`)
SELECT `parent_id`, 'Footer Settings', 'footer-settings', 3, 'active'
FROM `modules` WHERE `slug` = 'consultation-form-settings'
  AND NOT EXISTS (SELECT 1 FROM `modules` WHERE `slug` = 'footer-settings');

INSERT INTO `permissions` (`module_id`, `action_id`, `name`)
SELECT m.`id`, a.`id`, CONCAT('Footer Settings - ', a.`name`)
FROM `modules` m JOIN `actions` a ON a.`slug` IN ('view', 'update')
WHERE m.`slug` = 'footer-settings'
  AND NOT EXISTS (SELECT 1 FROM `permissions` p WHERE p.`module_id` = m.`id` AND p.`action_id` = a.`id`);

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, p.`id`
FROM `permissions` p JOIN `modules` m ON m.`id` = p.`module_id`
WHERE m.`slug` = 'footer-settings'
  AND EXISTS (SELECT 1 FROM `roles` WHERE `id` = 1)
  AND NOT EXISTS (SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = 1 AND rp.`permission_id` = p.`id`);
