-- Blogs become either city-specific (city_id set) or global (city_id NULL, same convention as pages and menus).
-- Existing rows keep their city_id untouched, so no blog changes scope.

-- DropForeignKey
ALTER TABLE `blogs` DROP FOREIGN KEY `fk_blogs_city`;

-- AlterTable
ALTER TABLE `blogs` MODIFY `city_id` INTEGER UNSIGNED NULL;

-- AddForeignKey (RESTRICT, not SET NULL: deleting a city must never silently make its blogs global)
ALTER TABLE `blogs` ADD CONSTRAINT `fk_blogs_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
