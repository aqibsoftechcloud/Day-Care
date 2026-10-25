-- CreateTable
CREATE TABLE `contact_page_settings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `badge_text` VARCHAR(100) NULL,
    `heading` VARCHAR(255) NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `show_badge` BOOLEAN NOT NULL DEFAULT true,
    `show_contact_details` BOOLEAN NOT NULL DEFAULT true,
    `form_position` VARCHAR(10) NOT NULL DEFAULT 'right',
    `show_form_heading` BOOLEAN NOT NULL DEFAULT false,
    `contact_items` JSON NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keyword` VARCHAR(500) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Register the admin permission module next to "Consultation Form Settings"
-- (same Settings parent), with View + Update, granted to Super Admin (role 1)
-- exactly as the consultation-form-settings module is. Other roles get it
-- through Roles -> Permissions in the admin panel.
INSERT INTO `modules` (`parent_id`, `name`, `slug`, `sorting_order`, `status`)
SELECT `parent_id`, 'Contact Page Settings', 'contact-page-settings', 2, 'active'
FROM `modules` WHERE `slug` = 'consultation-form-settings'
  AND NOT EXISTS (SELECT 1 FROM `modules` WHERE `slug` = 'contact-page-settings');

INSERT INTO `permissions` (`module_id`, `action_id`, `name`)
SELECT m.`id`, a.`id`, CONCAT('Contact Page Settings - ', a.`name`)
FROM `modules` m JOIN `actions` a ON a.`slug` IN ('view', 'update')
WHERE m.`slug` = 'contact-page-settings'
  AND NOT EXISTS (SELECT 1 FROM `permissions` p WHERE p.`module_id` = m.`id` AND p.`action_id` = a.`id`);

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, p.`id`
FROM `permissions` p JOIN `modules` m ON m.`id` = p.`module_id`
WHERE m.`slug` = 'contact-page-settings'
  AND EXISTS (SELECT 1 FROM `roles` WHERE `id` = 1)
  AND NOT EXISTS (SELECT 1 FROM `role_permissions` rp WHERE rp.`role_id` = 1 AND rp.`permission_id` = p.`id`);
