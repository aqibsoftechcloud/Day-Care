-- AlterTable
ALTER TABLE `menus` ADD COLUMN `placement` ENUM('primary', 'secondary', 'footer') NOT NULL DEFAULT 'primary';

-- CreateIndex
CREATE INDEX `idx_menus_placement` ON `menus`(`placement`);
