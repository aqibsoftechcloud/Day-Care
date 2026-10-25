-- Pages become either city-specific (city_id set) or global (city_id NULL, same convention as menus).
-- Existing rows keep their city_id untouched, so no page changes scope.

-- DropForeignKey
ALTER TABLE `pages` DROP FOREIGN KEY `fk_pages_city`;

-- AlterTable
ALTER TABLE `pages` MODIFY `city_id` INTEGER UNSIGNED NULL;

-- AddForeignKey (RESTRICT, not SET NULL: deleting a city must never silently make its pages global)
ALTER TABLE `pages` ADD CONSTRAINT `fk_pages_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
