-- AlterTable
ALTER TABLE `menus` ADD COLUMN `target_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `target_type` ENUM('none', 'speciality', 'treatment', 'hospital', 'doctor', 'doctor_speciality', 'blog', 'blog_category', 'page') NOT NULL DEFAULT 'none';

-- CreateIndex
CREATE INDEX `idx_menus_target` ON `menus`(`target_type`, `target_id`);
