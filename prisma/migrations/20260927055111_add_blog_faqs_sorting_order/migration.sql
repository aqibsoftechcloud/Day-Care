-- AlterTable
ALTER TABLE `blog_faqs` ADD COLUMN `sorting_order` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `idx_blog_faqs_sorting_order` ON `blog_faqs`(`sorting_order`);
