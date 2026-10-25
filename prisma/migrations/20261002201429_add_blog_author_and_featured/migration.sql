-- AlterTable
ALTER TABLE `blogs` ADD COLUMN `author_image` VARCHAR(500) NULL,
    ADD COLUMN `author_name` VARCHAR(255) NULL,
    ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `idx_blogs_is_featured` ON `blogs`(`is_featured`);
